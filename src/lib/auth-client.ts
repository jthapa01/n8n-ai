// =============================================================================
// BETTER-AUTH CLIENT - React hooks for authentication
// =============================================================================
// This creates client-side auth utilities for use in React components.
// Import this in 'use client' components to:
//   - Sign in users (authClient.signIn.email(), authClient.signIn.social())
//   - Sign out users (authClient.signOut())
//   - Sign up new users (authClient.signUp.email())
//   - Get current session (authClient.useSession())
//
// The client automatically:
//   - Sends requests to /api/auth/* endpoints
//   - Manages cookies for session persistence
//   - Handles OAuth redirect flows
// =============================================================================

import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth/client";

// -----------------------------------------------------------------------------
// AUTH CLIENT INSTANCE
// -----------------------------------------------------------------------------
// createAuthClient() creates a client that communicates with your auth API.
//
// AVAILABLE METHODS:
// ------------------
// authClient.signIn.email({ email, password })    - Login with email/password
// authClient.signIn.social({ provider: "github" }) - OAuth login (redirects)
// authClient.signUp.email({ email, password, name }) - Register new user
// authClient.signOut()                             - Logout (clears session)
// authClient.useSession()                          - React hook for session
// authClient.checkout({ slug })                    - Polar checkout for products
// authClient.customer.portal()                     - Polar customer billing portal
//
// CALLBACK OPTIONS:
// -----------------
// Most methods accept callbacks:
//   authClient.signIn.email({ ... }, {
//     onSuccess: () => { /* redirect or show success */ },
//     onError: (ctx) => { /* show error: ctx.error.message */ }
//   })
//
// SESSION HOOK USAGE:
// -------------------
// In client components:
//   const { data: session, isPending } = authClient.useSession();
//   if (session) { /* user is logged in */ }
// -----------------------------------------------------------------------------
export const authClient = createAuthClient({
  plugins: [polarClient()],
});
