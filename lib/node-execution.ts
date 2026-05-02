import type { AppFlowNode, WorkflowEdge } from "@/types/workflow";
import type {
    ExecutionNodeResult,
    ExecutionResponse,
} from "@/types/execution";
import { runGeminiText } from "@/lib/gemini-executor";
import { withTimeout } from "@/lib/with-timeout";
import {
    WORKFLOW_NODE_TIMEOUT_MS,
    WORKFLOW_TIMEOUT_ERROR,
} from "@/lib/workflow-timeout";

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

function resolveInputValues(
    nodeId: string,
    targetHandle: string,
    nodes: AppFlowNode[],
    edges: WorkflowEdge[]
): string[] {
    const incomingEdges = edges.filter(
        (edge) => edge.target === nodeId && edge.targetHandle === targetHandle
    );

    return incomingEdges
        .map((edge) => {
            const sourceNode = nodes.find((node) => node.id === edge.source);
            return getSourceNodeOutput(sourceNode);
        })
        .filter((value): value is string => Boolean(value));
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

async function fetchApiJsonWithTimeout<T>(
    url: string,
    options: RequestInit,
    timeoutMs = WORKFLOW_NODE_TIMEOUT_MS
): Promise<{
    response: Response;
    result: T;
}> {
    const controller = new AbortController();

    const timer = setTimeout(() => {
        controller.abort();
    }, timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });

        const contentType = response.headers.get("content-type") ?? "";
        const text = await response.text();

        if (!contentType.toLowerCase().includes("application/json")) {
            const finalUrl = response.url && response.url !== url
                ? ` via ${response.url}`
                : "";
            const snippet = text.replace(/\s+/g, " ").trim().slice(0, 180);

            throw new Error(
                `Expected JSON from ${url}${finalUrl}, received ${response.status} ${response.statusText || "response"}${contentType ? ` (${contentType})` : ""}${snippet ? `: ${snippet}` : ""}`
            );
        }

        let result: T;

        try {
            result = (text ? JSON.parse(text) : {}) as T;
        } catch {
            const snippet = text.replace(/\s+/g, " ").trim().slice(0, 180);
            throw new Error(
                `Invalid JSON from ${url}: ${snippet || "empty response"}`
            );
        }

        return {
            response,
            result,
        };
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            throw new Error(WORKFLOW_TIMEOUT_ERROR);
        }

        throw error;
    } finally {
        clearTimeout(timer);
    }
}

async function executePromptNode(
    node: AppFlowNode,
    nodes: AppFlowNode[],
    edges: WorkflowEdge[]
) {
    if (node.type !== "promptNode") return {};

    const output =
        resolveInputValue(node.id, "content", nodes, edges) ||
        resolveInputValue(node.id, "prompt-input", nodes, edges) ||
        node.data.content ||
        "";

    return {
        content: output,
        output,
    };
}

async function executeTextNode(
    node: AppFlowNode,
    nodes: AppFlowNode[],
    edges: WorkflowEdge[]
) {
    if (node.type !== "textNode") return {};

    const output =
        resolveInputValue(node.id, "content", nodes, edges) ||
        node.data.content ||
        "";

    return {
        content: output,
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

    const imageUrls = resolveInputValues(node.id, "images", nodes, edges);

    const output = await withTimeout(
        runGeminiText({
            model: node.data.model,
            systemPrompt,
            userMessage,
            imageUrls,
        }),
        WORKFLOW_NODE_TIMEOUT_MS,
        WORKFLOW_TIMEOUT_ERROR
    );

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

    const { response, result } = await fetchApiJsonWithTimeout<{
        imageUrl?: string;
        message?: string;
    }>(`${baseUrl}/api/media/crop-image`, {
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

    const { response, result } = await fetchApiJsonWithTimeout<{
        imageUrl?: string;
        message?: string;
    }>(`${baseUrl}/api/media/extract-frame`, {
        method: "POST",
        headers: getInternalHeaders(internalExecutionKey),
        body: JSON.stringify({
            videoUrl,
            timestamp: node.data.timestamp ?? "0",
        }),
    });

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

    const { response, result } = await fetchApiJsonWithTimeout<{
        imageUrl?: string;
        message?: string;
    }>(`${baseUrl}/api/media/generate-image`, {
        method: "POST",
        headers: getInternalHeaders(internalExecutionKey),
        body: JSON.stringify({
            prompt,
            model: node.data.model,
        }),
    });

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
    if (node.type === "promptNode") return executePromptNode(node, nodes, edges);
    if (node.type === "textNode") return executeTextNode(node, nodes, edges);
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

    const incomingMap = new Map<string, string[]>();
    const outgoingMap = new Map<string, string[]>();

    for (const node of executionNodes) {
        incomingMap.set(node.id, []);
        outgoingMap.set(node.id, []);
    }

    for (const edge of executionEdges) {
        incomingMap.get(edge.target)?.push(edge.source);
        outgoingMap.get(edge.source)?.push(edge.target);
    }

    const orderedNodes = topologicalSort(executionNodes, executionEdges);

    const updatedNodes: AppFlowNode[] = nodes.map((node) => ({
        ...node,
        data: {
            ...node.data,
            runStatus: "idle",
            error: undefined,
            durationMs: undefined,
        },
    }));

    const nodeResults: ExecutionNodeResult[] = [];
    const completed = new Set<string>();
    const running = new Set<string>();
    const failed = new Set<string>();

    const isReady = (nodeId: string) => {
        const deps = incomingMap.get(nodeId) ?? [];
        return deps.every((depId) => completed.has(depId));
    };

    const hasFailedDependency = (nodeId: string) => {
        const deps = incomingMap.get(nodeId) ?? [];
        return deps.some((depId) => failed.has(depId));
    };

    while (completed.size < orderedNodes.length) {
        const readyNodes = orderedNodes.filter(
            (node) =>
                !completed.has(node.id) &&
                !running.has(node.id) &&
                isReady(node.id) &&
                !hasFailedDependency(node.id)
        );

        if (readyNodes.length === 0) {
            const blockedNodes = orderedNodes.filter(
                (node) =>
                    !completed.has(node.id) &&
                    !running.has(node.id) &&
                    hasFailedDependency(node.id)
            );

            if (blockedNodes.length > 0) {
                for (const node of blockedNodes) {
                    const currentNodeIndex = updatedNodes.findIndex((n) => n.id === node.id);
                    const message = "Skipped because an upstream dependency failed";
                    const nowIso = new Date().toISOString();

                    if (currentNodeIndex !== -1) {
                        updatedNodes[currentNodeIndex] = {
                            ...updatedNodes[currentNodeIndex],
                            data: {
                                ...updatedNodes[currentNodeIndex].data,
                                runStatus: "failed",
                                error: message,
                            },
                        };
                    }

                    nodeResults.push({
                        nodeId: node.id,
                        nodeLabel:
                            currentNodeIndex !== -1 &&
                                "label" in updatedNodes[currentNodeIndex].data &&
                                updatedNodes[currentNodeIndex].data.label
                                ? updatedNodes[currentNodeIndex].data.label
                                : node.type,
                        nodeType: node.type,
                        status: "failed",
                        startedAt: nowIso,
                        finishedAt: nowIso,
                        error: message,
                        durationMs: 0,
                    });

                    failed.add(node.id);
                    completed.add(node.id);
                }

                continue;
            }

            throw new Error("Deadlock detected during workflow execution");
        }

        await Promise.all(
            readyNodes.map(async (node) => {
                const nodeStart = Date.now();
                const nodeStartedAtIso = new Date(nodeStart).toISOString();

                running.add(node.id);

                try {
                    const currentNodeIndex = updatedNodes.findIndex((n) => n.id === node.id);
                    if (currentNodeIndex === -1) {
                        completed.add(node.id);
                        running.delete(node.id);
                        return;
                    }

                    updatedNodes[currentNodeIndex] = {
                        ...updatedNodes[currentNodeIndex],
                        data: {
                            ...updatedNodes[currentNodeIndex].data,
                            runStatus: "running",
                            error: undefined,
                        },
                    };

                    const partial = await withTimeout(
                        executeNode(
                            updatedNodes[currentNodeIndex],
                            updatedNodes,
                            executionEdges,
                            baseUrl,
                            internalExecutionKey
                        ),
                        WORKFLOW_NODE_TIMEOUT_MS,
                        WORKFLOW_TIMEOUT_ERROR
                    );

                    const nodeFinishedAt = Date.now();
                    const nodeFinishedAtIso = new Date(nodeFinishedAt).toISOString();
                    const nodeDurationMs = nodeFinishedAt - nodeStart;

                    updatedNodes[currentNodeIndex] = {
                        ...updatedNodes[currentNodeIndex],
                        data: {
                            ...updatedNodes[currentNodeIndex].data,
                            ...partial,
                            runStatus: "success",
                            durationMs: nodeDurationMs,
                            error: undefined,
                        },
                    };

                    nodeResults.push({
                        nodeId: node.id,
                        nodeLabel:
                            "label" in updatedNodes[currentNodeIndex].data &&
                                updatedNodes[currentNodeIndex].data.label
                                ? updatedNodes[currentNodeIndex].data.label
                                : node.type,
                        nodeType: node.type,
                        status: "success",
                        startedAt: nodeStartedAtIso,
                        finishedAt: nodeFinishedAtIso,
                        output: getExecutionOutput(partial),
                        durationMs: nodeDurationMs,
                    });
                } catch (error) {
                    const currentNodeIndex = updatedNodes.findIndex((n) => n.id === node.id);
                    const message =
                        error instanceof Error ? error.message : "Node execution failed";
                    const nodeFinishedAt = Date.now();
                    const nodeFinishedAtIso = new Date(nodeFinishedAt).toISOString();
                    const nodeDurationMs = nodeFinishedAt - nodeStart;

                    if (currentNodeIndex !== -1) {
                        updatedNodes[currentNodeIndex] = {
                            ...updatedNodes[currentNodeIndex],
                            data: {
                                ...updatedNodes[currentNodeIndex].data,
                                runStatus: "failed",
                                error: message,
                                durationMs: nodeDurationMs,
                            },
                        };
                    }

                    nodeResults.push({
                        nodeId: node.id,
                        nodeLabel:
                            currentNodeIndex !== -1 &&
                                "label" in updatedNodes[currentNodeIndex].data &&
                                updatedNodes[currentNodeIndex].data.label
                                ? updatedNodes[currentNodeIndex].data.label
                                : node.type,
                        nodeType: node.type,
                        status: "failed",
                        startedAt: nodeStartedAtIso,
                        finishedAt: nodeFinishedAtIso,
                        error: message,
                        durationMs: nodeDurationMs,
                    });

                    failed.add(node.id);
                } finally {
                    completed.add(node.id);
                    running.delete(node.id);
                }
            })
        );
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
