// =============================================================================
// SERVER-SIDE TRPC - For React Server Components & Server Actions
// =============================================================================
// This file is ONLY for server-side code (RSC, API routes, etc.)
// 'server-only' package throws an error if imported from client code
// =============================================================================

import 'server-only'; // Prevents accidental client-side imports

import { createTRPCOptionsProxy, TRPCQueryOptions } from '@trpc/tanstack-react-query';
import { cache } from 'react';
import { createTRPCContext } from './init';
import { makeQueryClient } from './query-client';
import { appRouter } from './routers/_app';
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

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

// -----------------------------------------------------------------------------
// PREFETCH HELPER
// -----------------------------------------------------------------------------
// Prefetches tRPC query data on the server and stores it in the QueryClient cache.
//
// Generic Breakdown:
//   <T extends ReturnType<TRPCQueryOptions<any>>>
//   │   │         │              │           │
//   │   │         │              │           └─ any = accepts queries returning any data type
//   │   │         │              └─ TRPCQueryOptions = type that generates React Query options
//   │   │         └─ ReturnType<...> = extracts what TRPCQueryOptions returns (the options object)
//   │   └─ extends = T must be a subtype of the return type (constraint)
//   └─ T = generic type parameter (placeholder for the actual type passed in)
//
// In plain English: "T must be whatever type TRPCQueryOptions produces"
//
// Usage:
//   prefetch(trpc.workflows.getAll.queryOptions());
//   prefetch(trpc.users.getById.queryOptions({ id: "123" }));
// -----------------------------------------------------------------------------
export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(queryOptions: T) {
    const queryClient = getQueryClient();

    // Check if this is an infinite query (for pagination) or a regular query
    // Infinite queries use prefetchInfiniteQuery, regular queries use prefetchQuery
    if (queryOptions.queryKey[1]?.type === "infinite") {
        void queryClient.prefetchInfiniteQuery(queryOptions as any);
    } else {
        void queryClient.prefetchQuery(queryOptions);
    }
}

// -----------------------------------------------------------------------------
// HYDRATE CLIENT WRAPPER
// -----------------------------------------------------------------------------
// Transfers prefetched data from server to client.
//
// How it works:
//   1. Server: prefetch() stores data in QueryClient cache
//   2. Server: dehydrate() converts the cache → serializable JSON
//   3. Network: JSON is sent to the browser inside the HTML
//   4. Client: HydrationBoundary restores JSON → live QueryClient cache
//   5. Client: useQuery() finds data already in cache → instant render!
//
// Usage (in a Server Component):
//   export default async function Page() {
//     prefetch(trpc.workflows.getAll.queryOptions());
//     return (
//       <HydrateClient>
//         <ClientComponent /> {/* Data is already available here! */}
//       </HydrateClient>
//     );
//   }
// -----------------------------------------------------------------------------
export function HydrateClient(props: { children: React.ReactNode }) {
    const queryClient = getQueryClient();
    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            {props.children}
        </HydrationBoundary>
    )
}