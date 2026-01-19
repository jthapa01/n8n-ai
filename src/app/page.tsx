// =============================================================================
// SERVER COMPONENT PAGE - Prefetches data, then hydrates to client
// =============================================================================
// This is a React Server Component (no 'use client' directive)
// It runs on the server and can:
// - Directly access databases
// - Fetch data before sending HTML to client
// - Prefetch data for client components
// =============================================================================

import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Client } from "./client";
import { Suspense } from "react";

const Page = async () => {
  // ---------------------------------------------------------------------------
  // STEP 1: Get the Query Client for this request
  // ---------------------------------------------------------------------------
  // getQueryClient() is cached per-request (from server.tsx)
  // So all prefetches in this request share the same cache
  const queryClient = getQueryClient();

  // ---------------------------------------------------------------------------
  // STEP 2: Prefetch data on the server
  // ---------------------------------------------------------------------------
  // void = we don't await, letting it run in background
  // prefetchQuery = fetches data and stores in queryClient cache
  // trpc.getUsers.queryOptions() = generates React Query options for this procedure
  //
  // After this runs:
  // - queryClient.cache contains the users data
  // - Client component won't need to fetch - data is already there!
  void queryClient.prefetchQuery(trpc.getUsers.queryOptions());

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center">
      {/* ------------------------------------------------------------------- */}
      {/* STEP 3: Hydration Boundary - Transfers server cache to client       */}
      {/* ------------------------------------------------------------------- */}
      {/* dehydrate() = serializes queryClient cache to JSON                  */}
      {/* HydrationBoundary = sends this JSON to client, populates its cache  */}
      {/*                                                                     */}
      {/* Result: Client component has data immediately, no loading spinner!  */}
      {/* ------------------------------------------------------------------- */}
      <HydrationBoundary state={dehydrate(queryClient)}>
        {/* Suspense: Shows fallback while Client component loads/suspends */}
        <Suspense fallback={<div>Loading...</div>}>
          <Client />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
};

export default Page;