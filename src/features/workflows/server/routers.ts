/**
 * WORKFLOW tRPC ROUTER
 *
 * This router handles all workflow-related API operations:
 * - Creating new workflows with an initial node
 * - Executing workflows (triggers Inngest background job)
 * - Updating workflow nodes and edges from React Flow
 * - Fetching workflows for the editor and list views
 *
 * Flow: React Flow Editor → tRPC mutation → Prisma DB → Inngest (for execution)
 */

import { generateSlug } from "random-word-slugs";
import prisma from "@/lib/db";
import {
  createTRPCRouter,
  premiumProcedure, // Requires premium subscription
  protectedProcedure, // Requires authentication
} from "@/trpc/init";
import z from "zod";
import { PAGINATION } from "@/config/constants";
import { NodeType } from "@/generated/prisma/client";
import { sendWorkflowExecution } from "@/inngest/utils";
import type { Node, Edge } from "@xyflow/react"; // React Flow types for frontend compatibility

export const workflowsRouter = createTRPCRouter({
  /**
   * EXECUTE WORKFLOW
   * Triggers workflow execution via Inngest background job.
   *
   * Flow:
   * 1. Verify workflow exists and belongs to user
   * 2. Send event to Inngest → triggers executeWorkflow function
   * 3. Inngest handles: node sorting, sequential execution, realtime updates
   */
  execute: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Verify ownership before execution
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
      });

      // Send to Inngest - this triggers the "workflows/execute.workflow" event
      // Inngest then runs the executeWorkflow function in functions.ts
      await sendWorkflowExecution({ workflowId: input.id });

      return workflow;
    }),

  /**
   * CREATE WORKFLOW
   * Creates a new workflow with an initial placeholder node.
   * Uses Prisma nested create for atomicity (both created or neither).
   */
  create: premiumProcedure.mutation(({ ctx }) => {
    return prisma.workflow.create({
      data: {
        name: generateSlug(3), // Generates random 3-word slug like "happy-blue-elephant"
        userId: ctx.auth.user.id,
        // Nested create: Creates workflow AND initial node in single transaction
        nodes: {
          create: {
            type: NodeType.INITIAL, // Placeholder node shown in empty workflow
            position: { x: 0, y: 0 },
            name: NodeType.INITIAL,
          },
        },
      },
    });
  }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return prisma.workflow.delete({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
      });
    }),
  /**
   * UPDATE WORKFLOW (Save from React Flow Editor)
   *
   * Receives the complete React Flow state (nodes + edges) and persists to DB.
   * Uses a transaction to ensure atomicity - delete old → create new.
   *
   * Input format (from React Flow):
   * - nodes: { id, type, position: {x,y}, data: {...nodeConfig} }
   * - edges: { source, target, sourceHandle, targetHandle }
   *
   * DB format:
   * - Node: { id, workflowId, type, position, data }
   * - Connection: { fromNodeId, toNodeId, fromOutput, toInput }
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        // React Flow nodes - each contains node config in 'data' field
        nodes: z.array(
          z.object({
            id: z.string(),
            type: z.string().nullish(),
            position: z.object({ x: z.number(), y: z.number() }),
            data: z.record(z.string(), z.any()).optional(), // Node-specific config (prompts, endpoints, etc.)
          }),
        ),
        // React Flow edges - connections between nodes
        edges: z.array(
          z.object({
            source: z.string(), // Source node ID
            target: z.string(), // Target node ID
            sourceHandle: z.string().nullish(), // Output handle name
            targetHandle: z.string().nullish(), // Input handle name
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, nodes, edges } = input;

      // Verify ownership
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id, userId: ctx.auth.user.id },
      });

      // Transaction: All operations succeed or all fail
      return await prisma.$transaction(async (tx) => {
        // Step 1: Delete all existing nodes (cascades to connections due to FK)
        await tx.node.deleteMany({
          where: { workflowId: id },
        });

        // Step 2: Create new nodes from React Flow state
        await tx.node.createMany({
          data: nodes.map((node) => ({
            id: node.id,
            workflowId: id,
            name: node.type || "unknown",
            type: node.type as NodeType,
            position: node.position,
            data: node.data || {}, // Node config (prompts, API endpoints, etc.)
          })),
        });

        // Step 3: Create connections (edges) between nodes
        await tx.connection.createMany({
          data: edges.map((edge) => ({
            workflowId: id,
            fromNodeId: edge.source, // Maps React Flow 'source' → DB 'fromNodeId'
            toNodeId: edge.target, // Maps React Flow 'target' → DB 'toNodeId'
            fromOutput: edge.sourceHandle || "main",
            toInput: edge.targetHandle || "main",
          })),
        });

        // Step 4: Update workflow timestamp
        await tx.workflow.update({
          where: { id },
          data: { updatedAt: new Date() },
        });
        return workflow;
      });
    }),
  updateName: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      return prisma.workflow.update({
        where: { id: input.id, userId: ctx.auth.user.id },
        data: { name: input.name },
      });
    }),
  /**
   * GET ONE WORKFLOW (Load into React Flow Editor)
   *
   * Fetches workflow with nodes and connections, then transforms
   * DB format → React Flow format for the frontend editor.
   *
   * Transformation:
   * - DB Node → React Flow Node (type, position, data)
   * - DB Connection → React Flow Edge (source, target, handles)
   */
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Fetch workflow with related nodes and connections
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
        include: { nodes: true, connections: true },
      });

      // Transform DB nodes → React Flow nodes
      // React Flow expects: { id, type, position, data }
      const nodes: Node[] = workflow.nodes.map((node) => ({
        id: node.id,
        type: node.type, // Used to render correct node component
        position: node.position as { x: number; y: number },
        data: (node.data as Record<string, unknown>) || {}, // Node config passed to component
      }));

      // Transform DB connections → React Flow edges
      // React Flow expects: { id, source, target, sourceHandle, targetHandle }
      const edges: Edge[] = workflow.connections.map((connection) => ({
        id: connection.id,
        source: connection.fromNodeId, // DB 'fromNodeId' → React Flow 'source'
        target: connection.toNodeId, // DB 'toNodeId' → React Flow 'target'
        sourceHandle: connection.fromOutput,
        targetHandle: connection.toInput,
      }));

      return {
        id: workflow.id,
        name: workflow.name,
        nodes, // React Flow compatible
        edges, // React Flow compatible
      };
    }),
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(PAGINATION.MIN_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
        search: z.string().default(""),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input;
      const skip = (page - 1) * pageSize;

      const where = {
        userId: ctx.auth.user.id,
        ...(search && {
          name: { contains: search, mode: "insensitive" as const },
        }),
      };

      const [workflows, total] = await Promise.all([
        prisma.workflow.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.workflow.count({ where }),
      ]);

      const totalPages = Math.ceil(total / pageSize);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        items: workflows,
        total,
        page,
        pageSize,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };
    }),
});
