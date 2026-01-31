import { WorkflowsContainer, WorkflowsList, WorkflowsLoading, WorkflowsError, } from "@/features/workflows/components/workflows";
import { prefetchWorkflows } from "@/features/workflows/server/prefetch";
import { workflowsParamsLoader } from "@/features/workflows/server/params-loader";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";
import { SearchParams } from "nuqs";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

type PageProps = {
    searchParams: Promise<SearchParams>;
};

const Page = async ({ searchParams }: PageProps) => {
    await requireAuth();
    const params = await workflowsParamsLoader(searchParams);
    prefetchWorkflows(params);

    return (
        <WorkflowsContainer>
            <HydrateClient>
                <ErrorBoundary fallback={<WorkflowsError />}>
                    <Suspense fallback={<WorkflowsLoading />}>
                        <WorkflowsList />
                    </Suspense>
                </ErrorBoundary>
            </HydrateClient>
        </WorkflowsContainer>
    )
};

export default Page;