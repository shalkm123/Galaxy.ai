import type { AppFlowNode, WorkflowEdge } from "@/types/workflow";
import type {
    ExecutionNodeResult,
    ExecutionResponse,
} from "@/types/execution";
import { runGeminiText } from "@/lib/gemini-executor";

function getNodeById(nodes: AppFlowNode[], nodeId: string) {
    return nodes.find((node) => node.id === nodeId);
}

function getUpstreamNodeIds(
    targetNodeId: string,
    edges: WorkflowEdge[]
): Set<string> {
    const visited = new Set<string>();
    const stack = [targetNodeId];

    while (stack.length > 0) {
        const current = stack.pop()!;
        if (visited.has(current)) continue;

        visited.add(current);

        const incomingEdges = edges.filter((edge) => edge.target === current);
        for (const edge of incomingEdges) {
            stack.push(edge.source);
        }
    }

    return visited;
}

function topologicalSort(nodes: AppFlowNode[], edges: WorkflowEdge[]) {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const node of nodes) {
        inDegree.set(node.id, 0);
        adjacency.set(node.id, []);
    }

    for (const edge of edges) {
        adjacency.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }

    const queue: string[] = [];

    for (const [nodeId, degree] of inDegree.entries()) {
        if (degree === 0) {
            queue.push(nodeId);
        }
    }

    const orderedIds: string[] = [];

    while (queue.length > 0) {
        const current = queue.shift()!;
        orderedIds.push(current);

        for (const neighbor of adjacency.get(current) ?? []) {
            const nextDegree = (inDegree.get(neighbor) ?? 0) - 1;
            inDegree.set(neighbor, nextDegree);

            if (nextDegree === 0) {
                queue.push(neighbor);
            }
        }
    }

    return orderedIds
        .map((id) => getNodeById(nodes, id))
        .filter((node): node is AppFlowNode => Boolean(node));
}

function getSourceNodeOutput(sourceNode: AppFlowNode | undefined): string {
    if (!sourceNode) return "";

    if (sourceNode.type === "promptNode" || sourceNode.type === "textNode") {
        return sourceNode.data.output ?? sourceNode.data.content ?? "";
    }

    if (sourceNode.type === "llmNode") {
        return sourceNode.data.output ?? "";
    }

    if (sourceNode.type === "uploadImageNode") {
        return sourceNode.data.imageUrl ?? "";
    }

    if (sourceNode.type === "uploadVideoNode") {
        return sourceNode.data.videoUrl ?? "";
    }

    if (sourceNode.type === "extractFrameNode") {
        return sourceNode.data.outputImageUrl ?? "";
    }

    if (sourceNode.type === "imageGeneratorNode") {
        return sourceNode.data.imageUrl ?? "";
    }

    if (sourceNode.type === "cropImageNode") {
        return sourceNode.data.imageUrl ?? "";
    }

    return "";
}

function resolveInputValue(
    nodeId: string,
    targetHandle: string,
    nodes: AppFlowNode[],
    edges: WorkflowEdge[]
): string {
    const incoming = edges.find(
        (edge) => edge.target === nodeId && edge.targetHandle === targetHandle
    );

    if (!incoming) return "";

    const sourceNode = nodes.find((node) => node.id === incoming.source);
    return getSourceNodeOutput(sourceNode);
}

function getExecutionOutput(
    partial: Partial<AppFlowNode["data"]>
): string | undefined {
    if (typeof partial.output === "string") {
        return partial.output;
    }

    if ("imageUrl" in partial && typeof partial.imageUrl === "string") {
        return partial.imageUrl;
    }

    if (
        "outputImageUrl" in partial &&
        typeof partial.outputImageUrl === "string"
    ) {
        return partial.outputImageUrl;
    }

    return undefined;
}

function getInternalHeaders(internalExecutionKey: string) {
    return {
        "Content-Type": "application/json",
        "x-internal-execution-key": internalExecutionKey,
    };
}

async function executePromptNode(node: AppFlowNode) {
    if (node.type !== "promptNode") return {};

    const output = node.data.content ?? "";

    return {
        output,
    };
}

async function executeTextNode(node: AppFlowNode) {
    if (node.type !== "textNode") return {};

    const output = node.data.content ?? "";

    return {
        output,
    };
}

async function executeLlmNode(
    node: AppFlowNode,
    nodes: AppFlowNode[],
    edges: WorkflowEdge[]
) {
    if (node.type !== "llmNode") return {};

    const systemPrompt =
        resolveInputValue(node.id, "system_prompt", nodes, edges) ||
        node.data.systemPrompt ||
        "";

    const userMessage =
        resolveInputValue(node.id, "user_message", nodes, edges) ||
        node.data.userMessage ||
        "";

    const output = await runGeminiText({
        model: node.data.model,
        systemPrompt,
        userMessage,
    });

    return {
        systemPrompt,
        userMessage,
        output,
    };
}

async function executeCropImageNode(
    node: AppFlowNode,
    nodes: AppFlowNode[],
    edges: WorkflowEdge[],
    baseUrl: string,
    internalExecutionKey: string
) {
    if (node.type !== "cropImageNode") return {};

    const imageUrl =
        resolveInputValue(node.id, "image_url", nodes, edges) ||
        node.data.imageUrl ||
        "";

    const response = await fetch(`${baseUrl}/api/media/crop-image`, {
        method: "POST",
        headers: getInternalHeaders(internalExecutionKey),
        body: JSON.stringify({
            imageUrl,
            xPercent: node.data.xPercent ?? "0",
            yPercent: node.data.yPercent ?? "0",
            widthPercent: node.data.widthPercent ?? "100",
            heightPercent: node.data.heightPercent ?? "100",
        }),
    });

    const result = (await response.json()) as {
        imageUrl?: string;
        message?: string;
    };

    if (!response.ok) {
        throw new Error(result.message || "Crop image failed");
    }

    return {
        imageUrl: result.imageUrl ?? "",
    };
}

async function executeExtractFrameNode(
    node: AppFlowNode,
    nodes: AppFlowNode[],
    edges: WorkflowEdge[],
    baseUrl: string,
    internalExecutionKey: string
) {
    if (node.type !== "extractFrameNode") return {};

    const videoUrl =
        resolveInputValue(node.id, "video_url", nodes, edges) ||
        node.data.videoUrl ||
        "";

    const response = await fetch(`${baseUrl}/api/media/extract-frame`, {
        method: "POST",
        headers: getInternalHeaders(internalExecutionKey),
        body: JSON.stringify({
            videoUrl,
            timestamp: node.data.timestamp ?? "0",
        }),
    });

    const result = (await response.json()) as {
        imageUrl?: string;
        message?: string;
    };

    if (!response.ok) {
        throw new Error(result.message || "Extract frame failed");
    }

    return {
        videoUrl,
        outputImageUrl: result.imageUrl ?? "",
    };
}

async function executeImageGeneratorNode(
    node: AppFlowNode,
    nodes: AppFlowNode[],
    edges: WorkflowEdge[],
    baseUrl: string,
    internalExecutionKey: string
) {
    if (node.type !== "imageGeneratorNode") return {};

    const prompt =
        resolveInputValue(node.id, "prompt", nodes, edges) ||
        node.data.prompt ||
        "";

    const response = await fetch(`${baseUrl}/api/media/generate-image`, {
        method: "POST",
        headers: getInternalHeaders(internalExecutionKey),
        body: JSON.stringify({
            prompt,
            model: node.data.model,
        }),
    });

    const result = (await response.json()) as {
        imageUrl?: string;
        message?: string;
    };

    if (!response.ok) {
        throw new Error(result.message || "Image generation failed");
    }

    return {
        prompt,
        imageUrl: result.imageUrl ?? "",
    };
}

async function executeNode(
    node: AppFlowNode,
    nodes: AppFlowNode[],
    edges: WorkflowEdge[],
    baseUrl: string,
    internalExecutionKey: string
): Promise<Partial<AppFlowNode["data"]>> {
    if (node.type === "promptNode") return executePromptNode(node);
    if (node.type === "textNode") return executeTextNode(node);
    if (node.type === "llmNode") return executeLlmNode(node, nodes, edges);

    if (node.type === "cropImageNode") {
        return executeCropImageNode(
            node,
            nodes,
            edges,
            baseUrl,
            internalExecutionKey
        );
    }

    if (node.type === "extractFrameNode") {
        return executeExtractFrameNode(
            node,
            nodes,
            edges,
            baseUrl,
            internalExecutionKey
        );
    }

    if (node.type === "imageGeneratorNode") {
        return executeImageGeneratorNode(
            node,
            nodes,
            edges,
            baseUrl,
            internalExecutionKey
        );
    }

    return {};
}

export async function executeWorkflowGraph(
    nodes: AppFlowNode[],
    edges: WorkflowEdge[],
    baseUrl: string,
    internalExecutionKey: string,
    options?: {
        mode?: "full" | "single";
        selectedNodeId?: string | null;
    }
): Promise<ExecutionResponse> {
    const startedAt = Date.now();

    let executionNodes = nodes;
    let executionEdges = edges;

    if (options?.mode === "single" && options.selectedNodeId) {
        const allowedIds = getUpstreamNodeIds(options.selectedNodeId, edges);

        executionNodes = nodes.filter((node) => allowedIds.has(node.id));
        executionEdges = edges.filter(
            (edge) => allowedIds.has(edge.source) && allowedIds.has(edge.target)
        );
    }

    const orderedNodes = topologicalSort(executionNodes, executionEdges);

    const updatedNodes: AppFlowNode[] = [...nodes];
    const nodeResults: ExecutionNodeResult[] = [];

    for (const node of orderedNodes) {
        const nodeStart = Date.now();

        try {
            const currentNodeIndex = updatedNodes.findIndex((n) => n.id === node.id);
            if (currentNodeIndex === -1) continue;

            updatedNodes[currentNodeIndex] = {
                ...updatedNodes[currentNodeIndex],
                data: {
                    ...updatedNodes[currentNodeIndex].data,
                    runStatus: "running",
                    error: undefined,
                },
            };

            const partial = await executeNode(
                updatedNodes[currentNodeIndex],
                updatedNodes,
                executionEdges,
                baseUrl,
                internalExecutionKey
            );

            updatedNodes[currentNodeIndex] = {
                ...updatedNodes[currentNodeIndex],
                data: {
                    ...updatedNodes[currentNodeIndex].data,
                    ...partial,
                    runStatus: "success",
                    durationMs: Date.now() - nodeStart,
                },
            };

            nodeResults.push({
                nodeId: node.id,
                status: "success",
                output: getExecutionOutput(partial),
                durationMs: Date.now() - nodeStart,
            });
        } catch (error) {
            const currentNodeIndex = updatedNodes.findIndex((n) => n.id === node.id);
            const message =
                error instanceof Error ? error.message : "Node execution failed";

            if (currentNodeIndex !== -1) {
                updatedNodes[currentNodeIndex] = {
                    ...updatedNodes[currentNodeIndex],
                    data: {
                        ...updatedNodes[currentNodeIndex].data,
                        runStatus: "failed",
                        error: message,
                        durationMs: Date.now() - nodeStart,
                    },
                };
            }

            nodeResults.push({
                nodeId: node.id,
                status: "failed",
                error: message,
                durationMs: Date.now() - nodeStart,
            });
        }
    }

    const hasFailed = nodeResults.some((result) => result.status === "failed");
    const hasSuccess = nodeResults.some((result) => result.status === "success");

    return {
        status: hasFailed ? (hasSuccess ? "partial" : "failed") : "success",
        durationMs: Date.now() - startedAt,
        nodeResults,
        updatedNodes,
    };
}