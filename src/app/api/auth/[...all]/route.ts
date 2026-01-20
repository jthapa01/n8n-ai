// =============================================================================
// AUTH API ROUTE HANDLER - Catch-all route for authentication endpoints
// =============================================================================
// This file creates all the authentication API endpoints.
// The [...all] folder name means this is a "catch-all" route.
//
// It handles requests to:
//   POST /api/auth/sign-in/email     - Email/password login
//   POST /api/auth/sign-up/email     - Email/password registration
//   POST /api/auth/sign-out          - Logout (clear session)
//   GET  /api/auth/session           - Get current session
//   GET  /api/auth/sign-in/social    - OAuth provider redirect
//   POST /api/auth/callback/:provider - OAuth callback handler
//
// The authClient from auth-client.ts calls these endpoints automatically.
// You don't need to call them directly.
// =============================================================================

import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// -----------------------------------------------------------------------------
// EXPORT HTTP HANDLERS
// -----------------------------------------------------------------------------
// toNextJsHandler() converts the better-auth handler to Next.js format.
// It returns { GET, POST } functions that Next.js App Router expects.
//
// Internally, better-auth:
// 1. Parses the URL to determine which auth action is requested
// 2. Validates request body/cookies
// 3. Performs the auth operation (create user, validate password, etc.)
// 4. Sets/clears cookies as needed
// 5. Returns appropriate response
//
// All auth logic is handled by better-auth - this file just bridges
// the library to Next.js's routing system.
// -----------------------------------------------------------------------------
export const { POST, GET } = toNextJsHandler(auth);
