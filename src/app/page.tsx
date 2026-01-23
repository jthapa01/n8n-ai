"use client";

import { Button } from "@/components/ui/button";
import { LogoutButton } from "./logout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

const Page = () => {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.getWorkflows.queryOptions());

  const create = useMutation(trpc.createWorkFlow.mutationOptions({
    onSuccess: () => {
      toast.success("Workflow created successfully");
    }
  }));

  const testAi = useMutation(trpc.testAi.mutationOptions({
    onSuccess: (data) => {
      toast.success(data.message);
    }
  }));

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center flex-col gap-y-6">
      Protected server component
      <div>
        {JSON.stringify(data, null, 2)}
      </div>
      <Button disabled={create.isPending} onClick={() => create.mutate()}>
        Create Workflow
      </Button>
      <Button disabled={testAi.isPending} onClick={() => testAi.mutate()}>
        Test AI
      </Button>
      <LogoutButton />
    </div>
  );
};

export default Page;