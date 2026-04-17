import type { AppFlowNode, WorkflowEdge } from "@/types/workflow";
import type { ExecutionNodeResult, ExecutionResponse } from "@/types/execution";

import { runGeminiText } from "@/lib/gemini-executor";

/**
 * Build adjacency and in-degree for topological sort
 */
function buildGraph(nodes: AppFlowNode[], edges: WorkflowEdge[]) {
    const adj = new Map<string, string[]>();
    const indegree = new Map<string, number>();

    for (const node of nodes) {
        adj.set(node.id, []);
        indegree.set(node.id, 0);
    }

    for (const edge of edges) {
        adj.get(edge.source)?.push(edge.target);
        indegree.set(edge.target, (indegree.get(edge.target) || 0) + 1);
    }

    return { adj, indegree };
}

/**
 * Kahn's algorithm (topological sort)
 */
function topologicalSort(nodes: AppFlowNode[], edges: WorkflowEdge[]) {
    const { adj, indegree } = buildGraph(nodes, edges);

    const queue: string[] = [];
    const order: string[] = [];

    for (const [id, deg] of indegree.entries()) {
        if (deg === 0) queue.push(id);
    }

    while (queue.length) {
        const current = queue.shift()!;
        order.push(current);

        for (const next of adj.get(current) || []) {
            indegree.set(next, (indegree.get(next) || 0) - 1);
            if (indegree.get(next) === 0) {
                queue.push(next);
            }
        }
    }

    return order;
}

/**
 * Get value from upstream node based on handle
 */
function getNodeOutputValue(node: AppFlowNode, handle?: string | null): string {
    if (!handle) return "";

    // TEXT
    if (handle === "text-output" || handle === "prompt-output") {
        if (node.type === "promptNode") {
            return node.data.content ?? "";
        }
        if (node.type === "textNode") {
            return node.data.content ?? "";
        }
        if (node.type === "llmNode") {
            return node.data.output ?? "";
        }
        return node.data.output ?? "";
    }

    // IMAGE
    if (handle === "image-output") {
        if (node.type === "uploadImageNode") return node.data.imageUrl ?? "";
        if (node.type === "imageGeneratorNode") return node.data.imageUrl ?? "";
        if (node.type === "cropImageNode") return node.data.imageUrl ?? "";
        if (node.type === "extractFrameNode") return node.data.outputImageUrl ?? "";
        return "";
    }

    // VIDEO
    if (handle === "video-output") {
        if (node.type === "uploadVideoNode") return node.data.videoUrl ?? "";
        return "";
    }

    return "";
}

/**
 * Resolve inputs from edges
 */
function resolveInputs(
    node: AppFlowNode,
    edges: WorkflowEdge[],
    nodeMap: Map<string, AppFlowNode>
) {
    const incoming = edges.filter((e) => e.target === node.id);

    let resolved: Record<string, string> = {};

    for (const edge of incoming) {
        const sourceNode = nodeMap.get(edge.source);
        if (!sourceNode) continue;

        const value = getNodeOutputValue(sourceNode, edge.sourceHandle);

        if (!edge.targetHandle) continue;

        resolved[edge.targetHandle] = value;
    }

    return resolved;
}

/**
 * Execute one node
 */
async function executeNode(
    node: AppFlowNode,
    inputs: Record<string, string>
): Promise<{ output?: string; extra?: any }> {
    switch (node.type) {
        case "llmNode": {
            const output = await runGeminiText({
                model: node.data.model,
                systemPrompt: inputs["system_prompt"] ?? node.data.systemPrompt ?? "",
                userMessage: inputs["user_message"] ?? node.data.userMessage ?? "",
            });

            return { output };
        }

        const response = await fetch("http://localhost:3000/api/media/extract-frame", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoUrl, timestamp }),
});

       case "cropImageNode": {
    const imageUrl = inputs["image_url"] ?? node.data.imageUrl;

    if (!imageUrl) {
        throw new Error("Missing image input");
    }

    const response = await fetch("http://localhost:3000/api/media/crop-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            imageUrl,
            xPercent: node.data.xPercent ?? "0",
            yPercent: node.data.yPercent ?? "0",
            widthPercent: node.data.widthPercent ?? "100",
            heightPercent: node.data.heightPercent ?? "100",
        }),
    });

    if (!response.ok) {
        throw new Error("Crop image failed");
    }

    const data = await response.json();

    return {
        extra: {
            imageUrl: data.imageUrl,
        },
    };
}
        case "imageGeneratorNode": {
            // placeholder for now
            return {
                extra: {
                    imageUrl: node.data.imageUrl,
                },
            };
        }

        default:
            return {};
    }
}

/**
 * Main executor
 */
export async function executeWorkflowGraph(
    nodes: AppFlowNode[],
    edges: WorkflowEdge[]
): Promise<ExecutionResponse> {
    const start = Date.now();

    const nodeMap = new Map<string, AppFlowNode>();
    for (const n of nodes) nodeMap.set(n.id, { ...n });

    const order = topologicalSort(nodes, edges);

    const nodeResults: ExecutionNodeResult[] = [];

    for (const nodeId of order) {
        const node = nodeMap.get(nodeId);
        if (!node) continue;

        const nodeStart = Date.now();

        try {
            const inputs = resolveInputs(node, edges, nodeMap);

            const result = await executeNode(node, inputs);

            const updatedNode = {
                ...node,
                data: {
                    ...node.data,
                    ...(result.output !== undefined ? { output: result.output } : {}),
                    ...(result.extra ?? {}),
                },
            };

            nodeMap.set(nodeId, updatedNode);

            nodeResults.push({
                nodeId,
                status: "success",
                output: result.output,
                durationMs: Date.now() - nodeStart,
            });
        } catch (error) {
            nodeResults.push({
                nodeId,
                status: "failed",
                error: error instanceof Error ? error.message : "Unknown error",
                durationMs: Date.now() - nodeStart,
            });
        }
    }

    const updatedNodes = Array.from(nodeMap.values());

    const durationMs = Date.now() - start;

    return {
        status: "success",
        durationMs,
        nodeResults,
        updatedNodes,
    };
}