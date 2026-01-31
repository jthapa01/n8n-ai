// =============================================================================
// APP ROUTER - The root of all your tRPC procedures
// =============================================================================
// This is where you define your API endpoints ("procedures")
// Think of it like defining REST routes, but with full TypeScript types
// =============================================================================

import prisma from "@/lib/db";
import { createTRPCRouter } from "../init";
import { workflowsRouter } from '@/features/workflows/server/routers';
// -----------------------------------------------------------------------------
// ROOT ROUTER
// -----------------------------------------------------------------------------
// createTRPCRouter() groups procedures into a router
// You can nest routers for organization:
//   appRouter = createTRPCRouter({
//     user: userRouter,    // /api/trpc/user.getAll
//     post: postRouter,    // /api/trpc/post.create
//   })
// -----------------------------------------------------------------------------
export const appRouter = createTRPCRouter({
  workflows: workflowsRouter,
});

// -----------------------------------------------------------------------------
// TYPE EXPORT
// -----------------------------------------------------------------------------
// This type is imported by the CLIENT to know what procedures exist
// It's the "contract" between server and client
// The client never imports the actual router - just this type!
// -----------------------------------------------------------------------------
export type AppRouter = typeof appRouter;
