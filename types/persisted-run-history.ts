export type PersistedNodeRun = {
    id?: string;
    workflowRunId?: string;
    nodeId: string;
    nodeLabel: string;
    nodeType: string;
    status: "pending" | "running" | "success" | "failed";
    startedAt?: string;
    finishedAt?: string;
    durationMs?: number;
    output?: string;
    error?: string;
};

export type PersistedWorkflowRun = {
    id?: string;
    workflowId: string;
    status: "running" | "success" | "failed" | "partial";
    scope: "full";
    durationMs: number;
    createdAt?: string;
    finishedAt?: string;
    nodeRuns: PersistedNodeRun[];
};