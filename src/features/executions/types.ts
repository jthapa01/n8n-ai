/**
 * EXECUTION TYPES
 *
 * Core type definitions for the workflow execution system.
 * These types define the contract between:
 * - functions.ts (orchestrator)
 * - executor functions (individual node handlers)
 * - Inngest (durable execution & realtime)
 */

import type { Realtime } from "@inngest/realtime";
import type { GetStepTools, Inngest } from "inngest";

/**
 * WorkflowContext - Accumulated data passed between nodes
 *
 * Each node can read from context and add new data to it.
 * Uses Handlebars templates: {{variableName}} or {{json response}}
 *
 * Example flow:
 * 1. HTTP node fetches data → adds {apiResponse: {...}}
 * 2. AI node uses {{json apiResponse}} in prompt → adds {summary: "..."}
 * 3. Slack node uses {{summary}} in message
 */
export type WorkflowContext = Record<string, unknown>;

/**
 * StepTools - Inngest's durable execution helpers
 *
 * Provides:
 * - step.run(name, fn): Executes fn durably (survives crashes)
 * - step.ai.wrap(): Special wrapper for AI SDK calls
 * - step.sleep(): Pause execution for a duration
 */
export type StepTools = GetStepTools<Inngest.Any>;

/**
 * NodeExecutorParams - Parameters passed to each executor function
 *
 * @template TData - Type of node.data (config from React Flow)
 */
export interface NodeExecutorParams<TDdata = Record<string, unknown>> {
  data: TDdata; // Node configuration (prompts, endpoints, credentials, etc.)
  nodeId: string; // Unique node ID for realtime updates
  userId: string; // Owner ID for credential/permission checks
  context: WorkflowContext; // Accumulated data from previous nodes
  step: StepTools; // Inngest step tools for durable execution
  publish: Realtime.PublishFn; // Function to send realtime status updates
}

/**
 * NodeExecutor - Function signature for all node executor functions
 *
 * Each executor must:
 * 1. Validate data (throw NonRetriableError if invalid)
 * 2. Publish status updates (loading → success/error)
 * 3. Perform node logic (API calls, AI generation, etc.)
 * 4. Return updated context with new data
 *
 * @template TData - Type of node.data for type-safe config access
 * @returns Promise<WorkflowContext> - Context with new data added
 */
export type NodeExecutor<TData = Record<string, unknown>> = (
  params: NodeExecutorParams<TData>,
) => Promise<WorkflowContext>;
