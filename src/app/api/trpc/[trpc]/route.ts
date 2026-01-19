// =============================================================================
// TRPC API ROUTE - The HTTP endpoint for client→server communication
// =============================================================================
// This is a Next.js App Router "catch-all" route
// [trpc] in the folder name means it captures: /api/trpc/getUsers, /api/trpc/createUser, etc.
//
// Flow:
// 1. Client calls: trpc.getUsers.query()
// 2. tRPC client sends HTTP request to: POST /api/trpc/getUsers
// 3. This route handler receives it
// 4. fetchRequestHandler routes to the correct procedure
// 5. Procedure runs, returns data
// 6. Response sent back to client
// =============================================================================

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

// -----------------------------------------------------------------------------
// HANDLER FUNCTION
// -----------------------------------------------------------------------------
// fetchRequestHandler is the adapter that connects tRPC to Next.js
// It:
// - Parses the incoming request
// - Extracts the procedure name from the URL
// - Runs the procedure with the request body as input
// - Returns the result as JSON
// -----------------------------------------------------------------------------
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc", // Must match the route path
    req, // The incoming request
    router: appRouter, // Your router with all procedures
    createContext: createTRPCContext, // Creates context for each request
  });

// -----------------------------------------------------------------------------
// EXPORT AS BOTH GET AND POST
// -----------------------------------------------------------------------------
// tRPC uses:
// - GET for queries (read operations) - cacheable by CDN
// - POST for mutations (write operations) and batched requests
// -----------------------------------------------------------------------------
export { handler as GET, handler as POST };
