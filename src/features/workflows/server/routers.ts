import { generateSlug } from "random-word-slugs";
import prisma from "@/lib/db";
import { createTRPCRouter, premiumProcedure, protectedProcedure, } from "@/trpc/init";
import z from "zod";
import { PAGINATION } from "@/config/constants";

export const workflowsRouter = createTRPCRouter({
  execute: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
      });

      return workflow;
    }),
  create: premiumProcedure.mutation(({ ctx }) => {
    return prisma.workflow.create({
      data: {
        name: generateSlug(3),
        userId: ctx.auth.user.id,
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
  updateName: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      return prisma.workflow.update({
        where: { id: input.id, userId: ctx.auth.user.id },
        data: { name: input.name },
      });
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
      });
      return workflow;
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
