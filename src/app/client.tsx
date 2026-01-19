// =============================================================================
// CLIENT COMPONENT - Consumes tRPC data with React hooks
// =============================================================================
// 'use client' marks this as a Client Component
// It runs in the browser and can:
// - Use React hooks (useState, useEffect, etc.)
// - Handle user interactions
// - Access tRPC via useTRPC() hook
// =============================================================================

"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Client = () => {
    // ---------------------------------------------------------------------------
    // STEP 1: Get tRPC hook
    // ---------------------------------------------------------------------------
    // useTRPC() returns a proxy object with all your procedures
    // It's type-safe: trpc.getUsers exists, trpc.nonExistent would error
    const trpc = useTRPC();

    // ---------------------------------------------------------------------------
    // STEP 2: Fetch data with useSuspenseQuery
    // ---------------------------------------------------------------------------
    // useSuspenseQuery vs useQuery:
    // - useQuery: Returns { data, isLoading, error } - you handle loading states
    // - useSuspenseQuery: Suspends until data is ready - cleaner code
    //
    // trpc.getUsers.queryOptions() generates React Query options:
    // - queryKey: ['getUsers'] (for cache identification)
    // - queryFn: function that calls the tRPC endpoint
    //
    // IMPORTANT: Because page.tsx prefetched this data:
    // - The cache already has the data
    // - This hook returns IMMEDIATELY (no network request!)
    // - No loading state, no spinner
    // ---------------------------------------------------------------------------
    const { data: users } = useSuspenseQuery(trpc.getUsers.queryOptions());

    // ---------------------------------------------------------------------------
    // STEP 3: Render the data
    // ---------------------------------------------------------------------------
    // 'users' is fully typed as User[] (inferred from your Prisma schema)
    // TypeScript knows: users[0].email, users[0].name, etc.
    return (
        <div className="min-h-screen min-w-screen flex items-center justify-center">
            Client component: {JSON.stringify(users)}
        </div>
    );
};