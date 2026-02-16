import type { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.executions.getMany>;

export const prefetchExecutions = (input: Input) => {
    return prefetch(trpc.executions.getMany.queryOptions(input));
};

export const prefetchExecution = (id: string) => {
    return prefetch(trpc.executions.getOne.queryOptions({ id }));
};