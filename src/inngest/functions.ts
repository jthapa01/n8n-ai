import { inngest } from "./client";
import { gpt4oMini } from "@/lib/ai";
import { generateText } from "ai";

export const execute = inngest.createFunction(
  { id: "execute" },
  { event: "execute/ai" },
  async ({ event, step }) => {
    const { steps } = await step.ai.wrap("Generate text", generateText, {
      model: gpt4oMini,
      system: "You are a helpful assistant.",
      prompt: "What is 2 + 2?",
      experimental_telemetry: {
        isEnabled: true,
        recordInputs: true,
        recordOutputs: true,
      },
    });

    return steps;
  },
);
