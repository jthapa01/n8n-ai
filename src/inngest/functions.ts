/**
 * WORKFLOW EXECUTION ENGINE (Inngest)
 *
 * This is the core workflow execution logic that runs as a background job.
 *
 * Flow:
 * 1. tRPC router calls sendWorkflowExecution() → sends Inngest event
 * 2. Inngest receives "workflows/execute.workflow" event
 * 3. executeWorkflow function runs:
 *    - Creates execution record in DB
 *    - Sorts nodes topologically (respects dependencies)
 *    - Executes each node sequentially via executor registry
 *    - Publishes realtime status updates to frontend
 *    - Updates execution status on completion/failure
 *
 * Key Concepts:
 * - step.run(): Durable execution - survives crashes, can be retried
 * - publish(): Sends realtime updates to frontend via WebSocket
 * - context: Accumulated data from all executed nodes, passed to next node
 */

import { inngest } from "@/inngest/client";
import { NonRetriableError } from "inngest"; // Errors that should NOT be retried
import prisma from "@/lib/db";
import { topologicalSort } from "./utils";
import { ExecutionStatus, NodeType } from "@/generated/prisma/client";
import { getExecutor } from "@/features/executions/lib/executor-registry";

// Realtime channels - each node type has its own channel for status updates
import { httpRequestChannel } from "./channels/http-request";
import { manualTriggerChannel } from "./channels/manual-trigger";
import { googleFormTriggerChannel } from "./channels/google-form-trigger";
import { stripeTriggerChannel } from "./channels/stripe-trigger";
import { geminiChannel } from "./channels/gemini";
import { openAiChannel } from "./channels/openai";
import { anthropicChannel } from "./channels/anthropic";
import { discordChannel } from "./channels/discord";
import { slackChannel } from "./channels/slack";

export const executeWorkflow = inngest.createFunction(
  // Function configuration
  {
    id: "execute-workflow",
    retries: process.env.NODE_ENV === "production" ? 3 : 0, // Retry in prod, not in dev

    // Global failure handler - runs if all retries exhausted
    onFailure: async ({ event, step }) => {
      // Mark execution as FAILED in database
      return prisma.execution.update({
        where: { inngestEventId: event.data.event.id },
        data: {
          status: ExecutionStatus.FAILED,
          error: event.data.error.message,
          errorStack: event.data.error.stack,
        },
      });
    },
  },
  // Trigger configuration
  {
    event: "workflows/execute.workflow", // Event name that triggers this function

    // Realtime channels for WebSocket updates to frontend
    // Each channel defines topics (e.g., status updates per node)
    channels: [
      httpRequestChannel(),
      manualTriggerChannel(),
      googleFormTriggerChannel(),
      stripeTriggerChannel(),
      geminiChannel(),
      openAiChannel(),
      anthropicChannel(),
      discordChannel(),
      slackChannel(),
    ],
  },
  // Main execution handler
  async ({ event, step, publish }) => {
    const inngestEventId = event.id; // Unique event ID for tracking
    const workflowId = event.data.workflowId;

    // Validate required data
    if (!inngestEventId || !workflowId) {
      throw new NonRetriableError("Event ID or workflow ID is missing");
    }

    // STEP 1: Create execution record for tracking
    // step.run() makes this durable - if it crashes, Inngest resumes from here
    await step.run("create-execution", async () => {
      return prisma.execution.create({
        data: {
          workflowId,
          inngestEventId, // Links execution to this Inngest event
        },
      });
    });

    // STEP 2: Sort nodes topologically (respects dependencies)
    // Nodes connected A → B means A runs before B
    const sortedNodes = await step.run("prepare-workflow", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        include: { nodes: true, connections: true },
      });
      // topologicalSort uses toposort library to order nodes by dependencies
      return topologicalSort(workflow.nodes, workflow.connections);
    });

    // STEP 3: Get user ID for credential access
    const userId = await step.run("find-user-id", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        select: { userId: true },
      });
      return workflow.userId;
    });

    // STEP 4: Initialize workflow context
    // Context accumulates data from each node and is passed to the next
    // Example: HTTP node adds {response: {...}}, AI node uses {{response.data}}
    let context = event.data.initialData || {};

    // STEP 5: Execute each node sequentially
    // Order determined by topological sort (dependencies first)
    for (const node of sortedNodes) {
      // Get the executor function for this node type (e.g., anthropicExecutor)
      const executor = getExecutor(node.type as NodeType);

      // Execute node and update context with its output
      // Each executor: validates data, calls APIs, publishes status, returns updated context
      context = await executor({
        data: node.data as Record<string, unknown>, // Node config (prompts, endpoints, etc.)
        nodeId: node.id,
        userId,
        context, // Accumulated data from previous nodes
        step, // Inngest step tools for durable execution
        publish, // Function to send realtime updates to frontend
      });
    }

    // STEP 6: Mark execution as successful
    await step.run("update-execution", async () => {
      return prisma.execution.update({
        where: { inngestEventId, workflowId },
        data: {
          status: ExecutionStatus.SUCCESS,
          completedAt: new Date(),
          output: context, // Final context with all accumulated data
        },
      });
    });

    return {
      workflowId,
      result: context,
    };
  },
);
