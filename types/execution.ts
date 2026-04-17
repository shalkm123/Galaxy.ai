import type { AppFlowNode, WorkflowEdge } from "@/types/workflow";

export type ExecutionNodeResult = {
    nodeId: string;
    status: "success" | "failed";
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

export type ExecutionRequest = {
    workflowId?: string | null;
    template: string;
    nodes: AppFlowNode[];
    edges: WorkflowEdge[];
};