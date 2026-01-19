// =============================================================================
// QUERY CLIENT FACTORY - Creates TanStack Query (React Query) instances
// =============================================================================
// TanStack Query handles:
// - Caching API responses
// - Background refetching
// - Loading/error states
// - Deduplication of requests
// =============================================================================

import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
// import superjson from 'superjson';

// -----------------------------------------------------------------------------
// QUERY CLIENT FACTORY
// -----------------------------------------------------------------------------
// Why a factory function instead of a singleton?
// - Server: Each request needs its own QueryClient (no shared state between users)
// - Client: We want ONE shared instance (cached in browser memory)
//
// The client.tsx and server.tsx files handle this logic differently
// -----------------------------------------------------------------------------
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // How long data is considered "fresh" (won't refetch)
        // 30 seconds = data older than 30s will refetch in background
        staleTime: 30 * 1000,
      },

      // ---------------------------------------------------------------------
      // DEHYDRATION: Server → Client data transfer
      // ---------------------------------------------------------------------
      // "Dehydrate" = serialize query cache to JSON for transfer
      // This happens on the server to send prefetched data to the client
      dehydrate: {
        // serializeData: superjson.serialize, // Uncomment for Date/Map/Set support

        // Which queries should be sent to the client?
        // Default: only successful queries
        // We also include 'pending' so loading states transfer correctly
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },

      // ---------------------------------------------------------------------
      // HYDRATION: Client receives server data
      // ---------------------------------------------------------------------
      // "Hydrate" = deserialize JSON back into query cache
      // This populates the client's cache with server-fetched data
      hydrate: {
        // deserializeData: superjson.deserialize, // Match dehydrate serializer
      },
    },
  });
}
