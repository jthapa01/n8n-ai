import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useWorkflowsParams } from "./use-workflows-params";

/**
 * Fetches all workflows for the current user using Suspense.
 * Must be used within a `<Suspense>` boundary.
 *
 * @returns Query result with `data` guaranteed to be defined (no loading state)
 *
 * @example
 * ```tsx
 * const { data: workflows } = useSuspenseWorkflows();
 * ```
 */
export const useSuspenseWorkflows = () => {
  const trpc = useTRPC();
    const [params] = useWorkflowsParams();
  return useSuspenseQuery(trpc.workflows.getMany.queryOptions(params));
};

/**
 * Creates a new workflow with a randomly generated name.
 * Automatically invalidates the workflows list cache on success.
 *
 * @returns Mutation object with `mutate` and `mutateAsync` methods
 *
 * @example
 * ```tsx
 * const { mutate: createWorkflow, isPending } = useCreateWorkflow();
 * createWorkflow(); // No input needed - name is auto-generated
 * ```
 */
export const useCreateWorkflow = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.workflows.create.mutationOptions({
      onSuccess: (data) => {
        toast.success(`workflow "${data.name}" created`);
        queryClient.invalidateQueries({
          queryKey: trpc.workflows.getMany.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(`Failed to create workflow: ${error.message}`);
      },
    }),
  );
};

/**
 * Deletes a workflow by ID.
 * Automatically invalidates both the workflows list and individual workflow cache on success.
 *
 * @returns Mutation object with `mutate` and `mutateAsync` methods
 *
 * @example
 * ```tsx
 * const { mutate: removeWorkflow } = useRemoveWorkflow();
 * removeWorkflow({ id: "workflow-123" });
 * ```
 */
export const useRemoveWorkflow = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.workflows.remove.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Workflow "${data.name}" removed`);
        queryClient.invalidateQueries({
          queryKey: trpc.workflows.getMany.queryKey(),
        });
        queryClient.invalidateQueries(
          trpc.workflows.getOne.queryFilter({ id: data.id }),
        );
      },
    }),
  );
};

/**
 * Fetches a single workflow by ID using Suspense.
 * Must be used within a `<Suspense>` boundary.
 *
 * @param id - The workflow ID to fetch
 * @returns Query result with `data` guaranteed to be defined
 *
 * @example
 * ```tsx
 * const { data: workflow } = useSuspenseWorkflow("workflow-123");
 * ```
 */
export const useSuspenseWorkflow = (id: string) => {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.workflows.getOne.queryOptions({ id }));
};

/**
 * Updates a workflow's name.
 * Automatically invalidates both the workflows list and individual workflow cache on success.
 *
 * @returns Mutation object with `mutate` and `mutateAsync` methods
 *
 * @example
 * ```tsx
 * const { mutate: updateName } = useUpdateWorkflowName();
 * updateName({ id: "workflow-123", name: "New Name" });
 * ```
 */
export const useUpdateWorkflowName = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.workflows.updateName.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Workflow renamed to "${data.name}"`);
        queryClient.invalidateQueries({
          queryKey: trpc.workflows.getMany.queryKey(),
        });
        queryClient.invalidateQueries(
          trpc.workflows.getOne.queryFilter({ id: data.id }),
        );
      },
      onError: (error) => {
        toast.error(`Failed to rename workflow: ${error.message}`);
      },
    }),
  );
};
