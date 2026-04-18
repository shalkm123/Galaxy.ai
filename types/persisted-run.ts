import type { NodeRunDetail, WorkflowRunStatus } from "@/types/run-history";

export type PersistedWorkflowRun = {
    id: string;
    workflowId: string;
    userId?: string | null;
    status: WorkflowRunStatus;
    scope: string;
    durationMs: number;
    createdAt: string;
    finishedAt?: string | null;
    nodeRuns: NodeRunDetail[];
};