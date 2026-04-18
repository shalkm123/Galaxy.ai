import type { AppFlowNode } from "@/types/workflow";
import type {
    NodeRunDetail,
    WorkflowRun,
    WorkflowRunStatus,
} from "@/types/run-history";

function getNodeLabel(node: AppFlowNode) {
    if ("label" in node.data && node.data.label) return node.data.label;
    return node.type;
}

export function createInitialNodeRuns(nodes: AppFlowNode[]): NodeRunDetail[] {
    return nodes.map((node) => ({
        nodeId: node.id,
        nodeLabel: getNodeLabel(node),
        nodeType: node.type,
        status: "pending",
    }));
}

export function createInitialWorkflowRun(nodes: AppFlowNode[]): WorkflowRun {
    return {
        id: `run-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: "running",
        durationMs: 0,
        scope: "full",
        finishedAt: undefined,
        nodeRuns: createInitialNodeRuns(nodes),
    };
}

export function finalizeRunStatus(nodeRuns: NodeRunDetail[]): WorkflowRunStatus {
    const statuses = nodeRuns.map((n) => n.status);

    if (statuses.every((s) => s === "success")) return "success";
    if (statuses.some((s) => s === "failed") && statuses.some((s) => s === "success")) {
        return "partial";
    }
    if (statuses.every((s) => s === "failed")) return "failed";
    return "running";
}