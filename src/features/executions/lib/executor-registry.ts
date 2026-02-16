/**
 * EXECUTOR REGISTRY
 *
 * Maps each NodeType to its executor function.
 * Used by functions.ts to look up the correct executor for each node.
 *
 * Flow:
 * 1. functions.ts calls getExecutor(node.type)
 * 2. Registry returns the corresponding executor function
 * 3. Executor is called with node data, context, and Inngest tools
 *
 * Adding a new node type:
 * 1. Create executor function in components/<node-type>/executor.ts
 * 2. Add NodeType to Prisma schema and run prisma generate
 * 3. Add entry here: [NodeType.NEW_TYPE]: newTypeExecutor
 */

import { NodeExecutor } from "./../types";
import { NodeType } from "@/generated/prisma/enums";

// Import all executor functions
import { manualTriggerExecutor } from "@/features/triggers/components/manual-trigger/executor";
import { httpRequestExecutor } from "../components/http-request/executor";
import { googleFormTriggerExecutor } from "@/features/triggers/components/google-form-trigger/executor";
import { stripeTriggerExecutor } from "@/features/triggers/components/stripe-trigger/executor";
import { geminiExecutor } from "../components/gemini/executor";
import { openAiExecutor } from "../components/openai/executor";
import { anthropicExecutor } from "../components/anthropic/executor";
import { discordExecutor } from "../components/discord/executor";
import { slackExecutor } from "../components/slack/executor";

/**
 * Registry mapping NodeType enum → Executor function
 *
 * Each executor handles:
 * - Validating node.data (throws NonRetriableError if invalid)
 * - Calling external APIs or performing logic
 * - Publishing realtime status updates (loading/success/error)
 * - Returning updated context with new data
 */
export const executorRegistry: Record<NodeType, NodeExecutor> = {
  // Trigger nodes (entry points for workflows)
  [NodeType.INITIAL]: manualTriggerExecutor, // Placeholder node in new workflows
  [NodeType.MANUAL_TRIGGER]: manualTriggerExecutor, // User clicks "Run" button
  [NodeType.GOOGLE_FORM_TRIGGER]: googleFormTriggerExecutor, // Webhook from Google Forms
  [NodeType.STRIPE_TRIGGER]: stripeTriggerExecutor, // Webhook from Stripe

  // Action nodes (do something with data)
  [NodeType.HTTP_REQUEST]: httpRequestExecutor, // Make HTTP API calls

  // AI nodes (LLM integrations)
  [NodeType.GEMINI]: geminiExecutor, // Google Gemini AI
  [NodeType.ANTHROPIC]: anthropicExecutor, // Claude AI
  [NodeType.OPENAI]: openAiExecutor, // OpenAI GPT

  // Messaging nodes (send notifications)
  [NodeType.DISCORD]: discordExecutor, // Send Discord messages
  [NodeType.SLACK]: slackExecutor, // Send Slack messages
};

/**
 * Get executor function for a node type
 * @param type - NodeType enum value
 * @returns Executor function for that node type
 * @throws Error if no executor found (should never happen if registry is complete)
 */
export const getExecutor = (type: NodeType): NodeExecutor => {
  const executor = executorRegistry[type];
  if (!executor) {
    throw new Error(`No executor found for node type: ${type}`);
  }
  return executor;
};
