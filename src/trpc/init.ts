// =============================================================================
// TRPC INITIALIZATION - The foundation of your tRPC setup
// =============================================================================
// tRPC = TypeScript Remote Procedure Call
// It lets you call server functions from the client with full type safety
// No REST endpoints, no GraphQL schemas - just TypeScript functions
// =============================================================================

import { auth } from "@/lib/auth";
import { polarClient } from '@/lib/polar';
import { initTRPC, TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { cache } from "react";
import superjson from "superjson";

// -----------------------------------------------------------------------------
// CONTEXT FACTORY
// -----------------------------------------------------------------------------
// Context is data available to ALL your tRPC procedures (like middleware)
// Common uses: user session, database connection, request headers
//
// cache() from React ensures the same context is reused within a single request
// (prevents creating multiple contexts during React Server Component rendering)
// -----------------------------------------------------------------------------
export const createTRPCContext = cache(async () => {
  // TODO: Replace with real auth - get user from session/JWT
  // Example: const session = await getServerSession();
  // return { userId: session?.user?.id, db: prisma };
  return { userId: "user_123" };
});

// -----------------------------------------------------------------------------
// TRPC INSTANCE CREATION
// -----------------------------------------------------------------------------
// initTRPC.create() initializes tRPC and returns builders for:
// - router: groups procedures together
// - procedure: defines an API endpoint
// - middleware: runs before procedures
//
// We don't export 't' directly because:
// 1. 't' is a common variable name (conflicts with i18n libraries)
// 2. Better to export specific, named utilities
// -----------------------------------------------------------------------------
const t = initTRPC.create({
  transformer: superjson,
});

// -----------------------------------------------------------------------------
// EXPORTED UTILITIES
// -----------------------------------------------------------------------------

// createTRPCRouter: Creates a router that groups related procedures
// Example: createTRPCRouter({ getUsers: ..., createUser: ... })
export const createTRPCRouter = t.router;

// createCallerFactory: Creates a function to call procedures directly (server-side)
// Useful for: Server Components, API routes, testing
export const createCallerFactory = t.createCallerFactory;

// baseProcedure: The starting point for defining any procedure
// Chain with .input(), .query(), .mutation() to build endpoints
// Example: baseProcedure.input(z.object({...})).query(async () => {...})
export const baseProcedure = t.procedure;
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new TRPCError({ 
        code: "UNAUTHORIZED", 
        message: "Unauthorized",
    });
  }

  return next({
    ctx: {
      ...ctx,
      auth: session,
    },
  });
});

export const premiumProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const customer = await polarClient.customers.getStateExternal({
    externalId: ctx.auth.user.id,
  });

  if (!customer?.activeSubscriptions || customer.activeSubscriptions.length === 0) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Premium subscription required",
    });
  }

  return next({ ctx: { ...ctx, customer } });
});