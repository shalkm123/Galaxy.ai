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

export type ExecutionMode = "full" | "single";

export type ExecutionRequest = {
    workflowId?: string | null;
    template: string;
    nodes: AppFlowNode[];
    edges: WorkflowEdge[];

    // ✅ NEW (for selective execution)
    mode?: ExecutionMode;
    selectedNodeId?: string | null;
};