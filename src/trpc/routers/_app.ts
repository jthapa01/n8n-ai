// =============================================================================
// APP ROUTER - The root of all your tRPC procedures
// =============================================================================
// This is where you define your API endpoints ("procedures")
// Think of it like defining REST routes, but with full TypeScript types
// =============================================================================

import prisma from "@/lib/db";
import { createTRPCRouter, protectedProcedure } from "../init";
import { inngest } from "@/inngest/client";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
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
  // ---------------------------------------------------------------------------
  // GET USERS PROCEDURE
  // ---------------------------------------------------------------------------
  // baseProcedure = starting point for any endpoint
  // .query() = read-only operation (like GET in REST)
  // .mutation() = write operation (like POST/PUT/DELETE in REST)
  //
  // The return type is automatically inferred!
  // Client knows: trpc.getWorkflows returns Promise<Workflow[]>
  // ---------------------------------------------------------------------------
  testAi: protectedProcedure.mutation(async () => {
    await inngest.send({
      name: "execute/ai",
    });
    return { success: true, message: "Job queued" }
  }),
  getWorkflows: protectedProcedure.query(({ ctx }) => {
    // This runs on the SERVER only
    // Direct database access is safe here
    return prisma.workflow.findMany();
  }),
  createWorkFlow: protectedProcedure.mutation(async () => {
    await inngest.send({
      name: "test/hello.world",
      data: { text: "test@test.com" },
    });

    return { success: true, message: "Inngest event sent." };
  }),

  // TODO: Add more procedures here
  // Example with input validation:
  // getUserById: baseProcedure
  //   .input(z.object({ id: z.number() }))
  //   .query(({ input }) => prisma.user.findUnique({ where: { id: input.id } })),
  //
  // Example mutation:
  // createUser: baseProcedure
  //   .input(z.object({ email: z.string().email(), name: z.string() }))
  //   .mutation(({ input }) => prisma.user.create({ data: input })),
});

// -----------------------------------------------------------------------------
// TYPE EXPORT
// -----------------------------------------------------------------------------
// This type is imported by the CLIENT to know what procedures exist
// It's the "contract" between server and client
// The client never imports the actual router - just this type!
// -----------------------------------------------------------------------------
export type AppRouter = typeof appRouter;
