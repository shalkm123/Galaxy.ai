import { task } from "@trigger.dev/sdk";
import { prisma } from "@/lib/prisma";
import { executeWorkflowGraph } from "@/lib/node-execution";
import type { AppFlowNode, WorkflowEdge } from "@/types/workflow";

function getNodeLabel(node: AppFlowNode) {
    return "label" in node.data && node.data.label ? node.data.label : node.type;
}

export const workflowRunTask = task({
    id: "workflow-run",
    run: async (payload: {
        workflowId?: string | null;
        userId?: string | null;
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

        let persistedRunId: string | null = null;

        if (payload.workflowId && payload.userId) {
            const createdRun = await prisma.workflowRun.create({
                data: {
                    workflowId: payload.workflowId,
                    userId: payload.userId,
                    status: result.status,
                    scope: payload.options?.mode ?? "full",
                    durationMs: result.durationMs,
                    finishedAt: new Date(),
                    nodeRuns: {
                        create: payload.nodes.map((node) => {
                            const execution = result.nodeResults.find(
                                (r) => r.nodeId === node.id
                            );

                            return {
                                nodeId: node.id,
                                nodeLabel: execution?.nodeLabel ?? getNodeLabel(node),
                                nodeType: execution?.nodeType ?? node.type,
                                status: execution?.status ?? "pending",
                                startedAt: execution?.startedAt
                                    ? new Date(execution.startedAt)
                                    : null,
                                finishedAt: execution?.finishedAt
                                    ? new Date(execution.finishedAt)
                                    : null,
                                durationMs: execution?.durationMs,
                                output: execution?.output,
                                error: execution?.error,
                            };
                        }),
                    },
                },
                include: {
                    nodeRuns: true,
                },
            });

            persistedRunId = createdRun.id;
        }

        return {
            triggerStatus: "completed",
            workflowId: payload.workflowId ?? null,
            persistedRunId,
            result,
        };
    },
});