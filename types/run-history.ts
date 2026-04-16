export type NodeRunStatus = "pending" | "running" | "success" | "failed";

export type WorkflowRunStatus = "running" | "success" | "failed" | "partial";

export type NodeRunDetail = {
    nodeId: string;
    nodeLabel: string;
    nodeType: string;
    status: NodeRunStatus;
    startedAt?: string;
    finishedAt?: string;
    durationMs?: number;
    output?: string;
    error?: string;
};

export type WorkflowRunScope = "full";

export type WorkflowRun = {
    id: string;
    createdAt: string;
    status: WorkflowRunStatus;
    durationMs: number;
    scope: WorkflowRunScope;
    nodeRuns: NodeRunDetail[];
};