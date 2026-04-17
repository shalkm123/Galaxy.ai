import type { AppFlowNode, WorkflowEdge } from "@/types/workflow";
import { getExecutionOrder, hasCycle } from "@/lib/graph-helpers";
import type { ExecutionNodeResult } from "@/types/execution";
import { runGeminiText } from "@/lib/gemini-executor";

function getIncomingEdges(nodeId: string, edges: WorkflowEdge[]) {
    return edges.filter((edge) => edge.target === nodeId);
}

function getNodeById(nodeId: string, nodes: AppFlowNode[]) {
    return nodes.find((node) => node.id === nodeId);
}

function getTextOutputFromNode(node: AppFlowNode | undefined): string {
    if (!node) return "";

    if (node.type === "textNode") return node.data.content ?? node.data.output ?? "";
    if (node.type === "promptNode") return node.data.content ?? node.data.output ?? "";
    if (node.type === "llmNode") return node.data.output ?? "";

    return "";
}

function getImageOutputFromNode(node: AppFlowNode | undefined): string {
    if (!node) return "";

    if (node.type === "uploadImageNode") return node.data.imageUrl ?? "";
    if (node.type === "imageGeneratorNode") return node.data.imageUrl ?? "";
    if (node.type === "extractFrameNode") return node.data.outputImageUrl ?? "";

    return "";
}

function getVideoOutputFromNode(node: AppFlowNode | undefined): string {
    if (!node) return "";

    if (node.type === "uploadVideoNode") return node.data.videoUrl ?? "";

    return "";
}

async function extractFrameFromVideo(params: {
    videoUrl: string;
    timestamp?: string;
}) {
    const response = await fetch("http://localhost:3000/api/media/extract-frame", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            videoUrl: params.videoUrl,
            timestamp: params.timestamp ?? "0",
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to extract frame");
    }

    return response.json() as Promise<{ imageUrl: string }>;
}

async function executeSingleNode(
    node: AppFlowNode,
    nodes: AppFlowNode[],
    edges: WorkflowEdge[]
): Promise<ExecutionNodeResult> {
    const startedAt = Date.now();

    try {
        const incoming = getIncomingEdges(node.id, edges);

        if (node.type === "promptNode") {
            return {
                nodeId: node.id,
                status: "success",
                output: node.data.content ?? "",
                durationMs: Date.now() - startedAt,
            };
        }

        if (node.type === "textNode") {
            return {
                nodeId: node.id,
                status: "success",
                output: node.data.content ?? "",
                durationMs: Date.now() - startedAt,
            };
        }

        if (node.type === "uploadImageNode") {
            return {
                nodeId: node.id,
                status: node.data.imageUrl ? "success" : "failed",
                output: node.data.imageUrl,
                error: node.data.imageUrl ? undefined : "No image uploaded",
                durationMs: Date.now() - startedAt,
            };
        }

        if (node.type === "uploadVideoNode") {
            return {
                nodeId: node.id,
                status: node.data.videoUrl ? "success" : "failed",
                output: node.data.videoUrl,
                error: node.data.videoUrl ? undefined : "No video uploaded",
                durationMs: Date.now() - startedAt,
            };
        }

        if (node.type === "llmNode") {
    const systemPromptEdge = incoming.find((e) => e.targetHandle === "system_prompt");
    const userMessageEdge = incoming.find((e) => e.targetHandle === "user_message");

    const systemPrompt = systemPromptEdge
        ? getTextOutputFromNode(getNodeById(systemPromptEdge.source, nodes))
        : node.data.systemPrompt ?? "";

    const userMessage = userMessageEdge
        ? getTextOutputFromNode(getNodeById(userMessageEdge.source, nodes))
        : node.data.userMessage ?? "";

    if (!userMessage.trim()) {
        return {
            nodeId: node.id,
            status: "failed",
            error: "User message is empty",
            durationMs: Date.now() - startedAt,
        };
    }

    const output = await runGeminiText({
        model: node.data.model || "gemini-2.5-flash",
        systemPrompt,
        userMessage,
    });

    return {
        nodeId: node.id,
        status: "success",
        output,
        durationMs: Date.now() - startedAt,
    };
}

        if (node.type === "imageGeneratorNode") {
            const promptEdge = incoming.find((e) => e.targetHandle === "prompt");
            const prompt = promptEdge
                ? getTextOutputFromNode(getNodeById(promptEdge.source, nodes))
                : node.data.prompt ?? "";

            return {
                nodeId: node.id,
                status: "success",
                output: `Generated image from prompt: ${prompt || "empty prompt"}`,
                durationMs: Date.now() - startedAt,
            };
        }

        if (node.type === "cropImageNode") {
            const imageEdge = incoming.find((e) => e.targetHandle === "image_url");
            const imageUrl = imageEdge
                ? getImageOutputFromNode(getNodeById(imageEdge.source, nodes))
                : node.data.imageUrl ?? "";

            if (!imageUrl) {
                return {
                    nodeId: node.id,
                    status: "failed",
                    error: "No image connected",
                    durationMs: Date.now() - startedAt,
                };
            }

            return {
                nodeId: node.id,
                status: "success",
                output: `Cropped image from source`,
                durationMs: Date.now() - startedAt,
            };
        }

        if (node.type === "extractFrameNode") {
    const videoEdge = incoming.find((e) => e.targetHandle === "video_url");
    const videoUrl = videoEdge
        ? getVideoOutputFromNode(getNodeById(videoEdge.source, nodes))
        : node.data.videoUrl ?? "";

    if (!videoUrl) {
        return {
            nodeId: node.id,
            status: "failed",
            error: "No video connected",
            durationMs: Date.now() - startedAt,
        };
    }

    const result = await extractFrameFromVideo({
        videoUrl,
        timestamp: node.data.timestamp ?? "0",
    });

    return {
        nodeId: node.id,
        status: "success",
        output: result.imageUrl,
        durationMs: Date.now() - startedAt,
    };
}

        return {
            nodeId: node.id,
            status: "failed",
            error: "Unsupported node type",
            durationMs: Date.now() - startedAt,
        };
    } catch (error) {
        return {
            nodeId: node.id,
            status: "failed",
            error: error instanceof Error ? error.message : "Execution failed",
            durationMs: Date.now() - startedAt,
        };
    }
}

export async function executeWorkflowGraph(
    nodes: AppFlowNode[],
    edges: WorkflowEdge[]
) {
    if (hasCycle(nodes, edges)) {
        return {
            status: "failed" as const,
            durationMs: 0,
            nodeResults: nodes.map((node) => ({
                nodeId: node.id,
                status: "failed" as const,
                error: "Execution blocked: graph contains a cycle.",
                durationMs: 0,
            })),
            updatedNodes: nodes,
        };
    }

    const startedAt = Date.now();
    const orderedNodes = getExecutionOrder(nodes, edges);

    const nodeResults: ExecutionNodeResult[] = [];
    let updatedNodes = [...nodes];

    for (const node of orderedNodes) {
        const result = await executeSingleNode(node, updatedNodes, edges);
        nodeResults.push(result);

        updatedNodes = updatedNodes.map((n) => {
            if (n.id !== result.nodeId) return n;

            if (n.type === "llmNode") {
                return {
                    ...n,
                    data: {
                        ...n.data,
                        output: result.output,
                    },
                };
            }

            if (n.type === "imageGeneratorNode") {
                return {
                    ...n,
                    data: {
                        ...n.data,
                        imageUrl:
                            result.status === "success"
                                ? "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1000&auto=format&fit=crop"
                                : n.data.imageUrl,
                        output: result.output,
                    },
                };
            }

            if (n.type === "extractFrameNode") {
    return {
        ...n,
        data: {
            ...n.data,
            outputImageUrl: result.status === "success" ? result.output : "",
            output: result.output,
        },
    };
}

            return {
                ...n,
                data: {
                    ...n.data,
                    output: result.output,
                },
            };
        });
    }

    const statuses = nodeResults.map((r) => r.status);
    const finalStatus =
        statuses.every((s) => s === "success")
            ? "success"
            : statuses.every((s) => s === "failed")
            ? "failed"
            : "partial";

    return {
        status: finalStatus as "success" | "failed" | "partial",
        durationMs: Date.now() - startedAt,
        nodeResults,
        updatedNodes,
    };
}