// =============================================================================
// AI PROVIDERS CONFIGURATION
// =============================================================================
// Centralized AI model configuration using Vercel AI SDK.
//
// Environment Variables Required:
//   - OPENAI_API_KEY: For GPT models
//   - ANTHROPIC_API_KEY: For Claude models
//   - GOOGLE_GENERATIVE_AI_API_KEY: For Gemini models
//
// Usage:
//   import { gpt4oMini, claude35Sonnet, gemini15Flash } from "@/lib/ai";
// =============================================================================

import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";

// -----------------------------------------------------------------------------
// OpenAI Models
// -----------------------------------------------------------------------------
export const gpt4o = openai("gpt-4o"); // Most capable
export const gpt4oMini = openai("gpt-4o-mini"); // Fast & cheap

// -----------------------------------------------------------------------------
// Anthropic (Claude) Models
// -----------------------------------------------------------------------------
export const claude35Sonnet = anthropic("claude-3-5-sonnet-latest"); // Best balance
export const claude3Haiku = anthropic("claude-3-haiku-20240307"); // Fast & cheap

// -----------------------------------------------------------------------------
// Google (Gemini) Models
// -----------------------------------------------------------------------------
export const gemini15Pro = google("gemini-1.5-pro"); // Most capable
export const gemini15Flash = google("gemini-1.5-flash"); // Fast & cheap
