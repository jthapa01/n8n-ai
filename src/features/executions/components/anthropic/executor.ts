/**
 * ANTHROPIC (CLAUDE AI) NODE EXECUTOR
 *
 * Sends prompts to Claude AI and stores the response in workflow context.
 * Uses Vercel AI SDK for the API call, wrapped in Inngest for durability.
 *
 * Node Config (data):
 * - variableName: Context key to store AI response (e.g., "summary")
 * - credentialId: Encrypted API key stored in Credential table
 * - systemPrompt: Optional system prompt (supports Handlebars: {{variable}})
 * - userPrompt: Required user prompt (supports Handlebars: {{variable}})
 *
 * Example:
 * - userPrompt: "Summarize: {{json apiResponse}}"
 * - variableName: "summary"
 * - Result: context.summary = "AI generated summary..."
 */

import { NonRetriableError } from "inngest";
import { generateText } from "ai"; // Vercel AI SDK
import { createAnthropic } from "@ai-sdk/anthropic"; // Anthropic provider
import type { NodeExecutor } from "@/features/executions/types";
import { anthropicChannel } from "@/inngest/channels/anthropic";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { compileTemplate } from "@/features/executions/lib/template-utils";

// Type definition for this node's configuration
type AnthropicData = {
  variableName?: string; // Key to store result in context
  credentialId?: string; // ID of credential with API key
  systemPrompt?: string; // Optional system prompt
  userPrompt?: string; // Required user prompt
};

export const anthropicExecutor: NodeExecutor<AnthropicData> = async ({
  data,
  nodeId,
  userId,
  context,
  step,
  publish,
}) => {
  // Publish "loading" status to frontend via realtime channel
  await publish(anthropicChannel().status({ nodeId, status: "loading" }));

  // ========== VALIDATION ==========
  // All errors are NonRetriableError - user must fix config, retry won't help

  if (!data.variableName) {
    await publish(anthropicChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Anthropic node: Variable name is missing");
  }

  if (!data.credentialId) {
    await publish(anthropicChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Anthropic node: Credential is required");
  }

  if (!data.userPrompt) {
    await publish(anthropicChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Anthropic node: User prompt is required");
  }

  // ========== TEMPLATE PROCESSING ==========
  // Compile Handlebars templates with current context
  // e.g., "Summarize: {{json apiResponse}}" → "Summarize: {\"data\": ...}"

  const systemPrompt = data.systemPrompt
    ? compileTemplate(data.systemPrompt, context)
    : "You are a helpful assistant.";

  const userPrompt = compileTemplate(data.userPrompt, context);

  // ========== CREDENTIAL RETRIEVAL ==========
  // Fetch encrypted API key from database (step.run for durability)
  const credential = await step.run("get-credential", () => {
    return prisma.credential.findUnique({
      where: { id: data.credentialId, userId }, // Verify ownership
    });
  });

  if (!credential) {
    await publish(anthropicChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Anthropic node: Credential not found");
  }

  // ========== API CALL ==========
  // Create Anthropic client with decrypted API key
  const anthropic = createAnthropic({
    apiKey: decrypt(credential.value), // Decrypt the stored API key
  });

  try {
    // step.ai.wrap() - Inngest's special wrapper for AI SDK calls
    // Provides: durability, telemetry, cost tracking
    const { steps } = await step.ai.wrap(
      "anthropic-generate-text",
      generateText,
      {
        model: anthropic("claude-sonnet-4-5"),
        system: systemPrompt,
        prompt: userPrompt,
        experimental_telemetry: {
          isEnabled: true,
          recordInputs: true,
          recordOutputs: true,
        },
      },
    );

    // Extract text from AI response
    const text =
      steps[0].content[0].type === "text" ? steps[0].content[0].text : "";

    // Publish success status to frontend
    await publish(anthropicChannel().status({ nodeId, status: "success" }));

    // Return updated context with AI response
    // Other nodes can now use {{variableName}} to access this data
    return {
      ...context,
      [data.variableName]: text,
    };
  } catch (error) {
    await publish(anthropicChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
