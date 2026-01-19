// =============================================================================
// SERVER-SIDE TRPC - For React Server Components & Server Actions
// =============================================================================
// This file is ONLY for server-side code (RSC, API routes, etc.)
// 'server-only' package throws an error if imported from client code
// =============================================================================

import 'server-only'; // Prevents accidental client-side imports

import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { cache } from 'react';
import { createTRPCContext } from './init';
import { makeQueryClient } from './query-client';
import { appRouter } from './routers/_app';

// -----------------------------------------------------------------------------
// QUERY CLIENT (Server-side)
// -----------------------------------------------------------------------------
// cache() ensures the SAME QueryClient is used throughout a single request
// Why? React Server Components may render multiple times during streaming
// Without cache(), each render would create a new QueryClient = lost data
//
// Flow:
// 1. Request comes in
// 2. First call to getQueryClient() creates new QueryClient
// 3. Subsequent calls in same request return the SAME instance
// 4. Request ends, QueryClient is garbage collected
// -----------------------------------------------------------------------------
export const getQueryClient = cache(makeQueryClient);

// -----------------------------------------------------------------------------
// TRPC OPTIONS PROXY (For prefetching)
// -----------------------------------------------------------------------------
// createTRPCOptionsProxy creates a helper to generate React Query options
// Used in Server Components to PREFETCH data before sending to client
//
// Usage in page.tsx:
//   const queryClient = getQueryClient();
//   void queryClient.prefetchQuery(trpc.getUsers.queryOptions());
//
// This fetches data on the server, then hydrates it to the client
// Result: No loading spinner - data is already there!
// -----------------------------------------------------------------------------
export const trpc = createTRPCOptionsProxy({
    ctx: createTRPCContext,     // Provides context (userId, etc.) to procedures
    router: appRouter,          // The router with all procedures
    queryClient: getQueryClient, // QueryClient to cache into
});

// -----------------------------------------------------------------------------
// DIRECT CALLER (Alternative to prefetch)
// -----------------------------------------------------------------------------
// createCaller lets you call procedures directly without HTTP
// Useful for: Server Components, Server Actions, API routes
//
// Usage:
//   const users = await caller.getUsers();
//
// Difference from prefetch:
// - caller: Returns data directly (simpler, but doesn't populate React Query cache)
// - prefetch: Populates cache (data available to client immediately)
// -----------------------------------------------------------------------------
export const caller = appRouter.createCaller(createTRPCContext);