import type { AppFlowNode, WorkflowEdge } from "@/types/workflow";

export type ExecutionNodeResult = {
    nodeId: string;
    nodeLabel: string;
    nodeType: string;
    status: "success" | "failed";
    startedAt?: string;
    finishedAt?: string;
    output?: string;
    error?: string;
    durationMs: number;
};

export type ExecutionResponse = {
    status: "success" | "failed" | "partial";
    durationMs: number;
    nodeResults: ExecutionNodeResult[];
    updatedNodes: AppFlowNode[];
};

export type ExecutionMode = "full" | "single";

export type ExecutionRequest = {
    workflowId?: string | null;
    template: string;
    nodes: AppFlowNode[];
    edges: WorkflowEdge[];
    mode?: ExecutionMode;
    selectedNodeId?: string | null;
};

export type StartExecutionResponse = {
    triggerRunId: string;
    workflowId?: string | null;
    status: "queued";
};