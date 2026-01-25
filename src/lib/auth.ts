// =============================================================================
// BETTER-AUTH SERVER CONFIGURATION
// =============================================================================
// This is the CORE server-side authentication configuration.
// It defines:
//   - Database adapter (how auth data is stored)
//   - Authentication methods (email/password, OAuth providers)
//   - Session settings (cookie name, expiration)
//
// This file runs on the SERVER only. Never import this in client components!
// For client-side auth, use: import { authClient } from '@/lib/auth-client'
// =============================================================================

import { betterAuth } from "better-auth";
import { prisma } from "./db";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { checkout, polar, portal } from "@polar-sh/better-auth";
import { polarClient } from "./polar";
// -----------------------------------------------------------------------------
// AUTH INSTANCE
// -----------------------------------------------------------------------------
// betterAuth() creates the main auth instance that:
// - Handles user registration, login, logout
// - Manages sessions (creates tokens, validates cookies)
// - Provides API handlers for auth endpoints
//
// The returned 'auth' object has:
// - auth.api.getSession() - Get current session on server
// - auth.handler - HTTP handler for API routes
// -----------------------------------------------------------------------------
export const auth = betterAuth({
  // ---------------------------------------------------------------------------
  // DATABASE ADAPTER
  // ---------------------------------------------------------------------------
  // prismaAdapter connects better-auth to your database via Prisma
  // It automatically uses these tables from your schema:
  //   - user: Stores user accounts (id, email, name, emailVerified)
  //   - session: Active login sessions (token, expiresAt, userId)
  //   - account: OAuth provider connections (providerId, accessToken)
  //   - verification: Email verification tokens
  //
  // The adapter handles all CRUD operations for auth data.
  // ---------------------------------------------------------------------------
  database: prismaAdapter(prisma, {
    provider: "postgresql", // Tells adapter which SQL dialect to use
  }),

  // ---------------------------------------------------------------------------
  // EMAIL & PASSWORD AUTHENTICATION
  // ---------------------------------------------------------------------------
  // Enables traditional email/password login.
  // When enabled, users can:
  //   - Sign up with email + password (authClient.signUp.email())
  //   - Sign in with email + password (authClient.signIn.email())
  //
  // Password is automatically hashed using bcrypt before storing.
  // ---------------------------------------------------------------------------
  emailAndPassword: {
    enabled: true, // Allow email/password registration and login
    autoSignIn: true, // Automatically create session after registration
    // (user doesn't need to login again after signup)
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: "235df4d8-8384-4293-a57f-b8975f2470c0",
              slug: "Nodebase-Pro"
            }
          ],
          successUrl: process.env.POLAR_SUCCESS_URL,
          authenticatedUsersOnly: true,
        }),
        portal(),
      ],
    })
  ]

  // ---------------------------------------------------------------------------
  // OPTIONAL: Add OAuth providers here
  // ---------------------------------------------------------------------------
  // To enable GitHub/Google login, add:
  //
  // socialProviders: {
  //   github: {
  //     clientId: process.env.GITHUB_CLIENT_ID!,
  //     clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  //   },
  //   google: {
  //     clientId: process.env.GOOGLE_CLIENT_ID!,
  //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  //   },
  // },
  // ---------------------------------------------------------------------------
});
