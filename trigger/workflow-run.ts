import { task } from "@trigger.dev/sdk";
import { executeWorkflowGraph } from "@/lib/node-execution";
import type { AppFlowNode, WorkflowEdge } from "@/types/workflow";

export const workflowRunTask = task({
    id: "workflow-run",
    run: async (payload: {
        nodes: AppFlowNode[];
        edges: WorkflowEdge[];
        baseUrl: string;
        internalExecutionKey: string;
        options?: {
            mode?: "full" | "single";
            selectedNodeId?: string | null;
        };
    }) => {
        const result = await executeWorkflowGraph(
            payload.nodes,
            payload.edges,
            payload.baseUrl,
            payload.internalExecutionKey,
            payload.options
        );

        return result;
    },
});