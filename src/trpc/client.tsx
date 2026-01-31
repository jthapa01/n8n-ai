// =============================================================================
// CLIENT-SIDE TRPC - React hooks and providers for the browser
// =============================================================================
// This file sets up tRPC for client components (components with 'use client')
// It provides:
// - TRPCReactProvider: Wraps your app with necessary context
// - useTRPC: Hook to access tRPC procedures in components
// =============================================================================

'use client'; // Required: This is a Client Component

import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { useState } from 'react';
import { makeQueryClient } from './query-client';
import superjson from "superjson";
import type { AppRouter } from './routers/_app'; // TYPE only - no server code!

// -----------------------------------------------------------------------------
// TRPC CONTEXT CREATION
// -----------------------------------------------------------------------------
// createTRPCContext<AppRouter>() creates:
// - TRPCProvider: React context provider for tRPC
// - useTRPC: Hook to access tRPC in components
//
// The <AppRouter> generic gives us full type safety:
// - useTRPC().getUsers.queryOptions() ✓ (exists)
// - useTRPC().nonExistent.queryOptions() ✗ (TypeScript error)
// -----------------------------------------------------------------------------
export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

// -----------------------------------------------------------------------------
// QUERY CLIENT SINGLETON (Browser only)
// -----------------------------------------------------------------------------
// In the browser, we want ONE QueryClient instance (persists across navigations)
// On server (during SSR), we create a new one per request
//
// Why the check for window?
// - Next.js renders on both server and client
// - On server: window is undefined → create fresh client
// - On client: window exists → reuse existing client
// -----------------------------------------------------------------------------
let browserQueryClient: QueryClient;

function getQueryClient() {
    if (typeof window === 'undefined') {
        // SERVER: Always create new (no shared state between requests)
        return makeQueryClient();
    }

    // BROWSER: Singleton pattern
    // Create once, reuse forever
    // Important: Prevents losing cache if React suspends during initial render
    if (!browserQueryClient) {
        browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
}

// -----------------------------------------------------------------------------
// URL HELPER
// -----------------------------------------------------------------------------
// Determines the tRPC API endpoint URL
// - Browser: Relative URL (same origin) → '/api/trpc'
// - Server (Vercel): Full URL with VERCEL_URL
// - Server (local): localhost:3000
// -----------------------------------------------------------------------------
function getUrl() {
    const base = (() => {
        if (typeof window !== 'undefined') return ''; // Browser: relative URL
        if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
        return 'http://localhost:3000'; // Local development
    })();
    return `${base}/api/trpc`;
}

// -----------------------------------------------------------------------------
// TRPC REACT PROVIDER
// -----------------------------------------------------------------------------
// This component wraps your entire app (in layout.tsx)
// It provides both React Query and tRPC context to all child components
//
// Structure:
//   <QueryClientProvider>      ← React Query context
//     <TRPCProvider>           ← tRPC context
//       {children}             ← Your app
//     </TRPCProvider>
//   </QueryClientProvider>
// -----------------------------------------------------------------------------
export function TRPCReactProvider(
    props: Readonly<{
        children: React.ReactNode;
    }>,
) {
    // Get or create the QueryClient
    const queryClient = getQueryClient();

    // Create tRPC client (using useState to ensure stable reference)
    // useState(() => ...) runs the initializer only ONCE
    const [trpcClient] = useState(() =>
        createTRPCClient<AppRouter>({
            links: [
                // httpBatchLink: Batches multiple requests into one HTTP call
                // Example: 3 simultaneous queries → 1 HTTP request
                httpBatchLink({
                    url: getUrl(),
                    transformer: superjson,
                }),
            ],
        }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
                {props.children}
            </TRPCProvider>
        </QueryClientProvider>
    );
}