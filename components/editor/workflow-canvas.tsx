"use client";

import {
    Background,
    Controls,
    MiniMap,
    ReactFlow,
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    type Connection,
    type EdgeChange,
    type NodeChange,
    type NodeTypes,
    type ReactFlowInstance,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";

import { PromptNode } from "@/components/editor/nodes/prompt-node";
import { ImageGeneratorNode } from "@/components/editor/nodes/image-generator-node";
import { TextNode } from "@/components/editor/nodes/text-node";
import { UploadImageNode } from "@/components/editor/nodes/upload-image-node";
import { UploadVideoNode } from "@/components/editor/nodes/upload-video-node";
import { LlmNode } from "@/components/editor/nodes/llm-node";
import { CropImageNode } from "@/components/editor/nodes/crop-image-node";
import { ExtractFrameNode } from "@/components/editor/nodes/extract-frame-node";
import { NodePicker } from "@/components/editor/node-picker";

import {
    getEmptyWorkflow,
    getImageGeneratorWorkflow,
    getMarketingWorkflow,
} from "@/lib/workflow-templates";
import { isConnectionAllowed } from "@/lib/connection-rules";
import { wouldCreateCycle } from "@/lib/graph-helpers";

import { useEditorStore } from "@/store/editor-store";

import type {
    AppFlowNode,
    CropImageFlowNode,
    ExtractFrameFlowNode,
    ImageGeneratorFlowNode,
    WorkflowEdge,
} from "@/types/workflow";

const nodeTypes: NodeTypes = {
    promptNode: PromptNode,
    imageGeneratorNode: ImageGeneratorNode,
    textNode: TextNode,
    uploadImageNode: UploadImageNode,
    uploadVideoNode: UploadVideoNode,
    llmNode: LlmNode,
    cropImageNode: CropImageNode,
    extractFrameNode: ExtractFrameNode,
};

type PickerState = {
    x: number;
    y: number;
    flowX: number;
    flowY: number;
} | null;

type AddableNodeType =
    | "promptNode"
    | "imageGeneratorNode"
    | "textNode"
    | "uploadImageNode"
    | "uploadVideoNode"
    | "llmNode"
    | "cropImageNode"
    | "extractFrameNode";

type PaneMouseEvent = MouseEvent | React.MouseEvent<Element, MouseEvent>;

function withDragHandle(nodes: AppFlowNode[]): AppFlowNode[] {
    return nodes.map((node) => ({
        ...node,
        dragHandle: ".node-drag-handle",
    }));
}

export function WorkflowCanvas() {
    const template = useEditorStore((state) => state.template);
    const nodes = useEditorStore((state) => state.nodes);
    const edges = useEditorStore((state) => state.edges);
    const selectedNodeId = useEditorStore((state) => state.selectedNodeId);

    const setNodes = useEditorStore((state) => state.setNodes);
    const setEdges = useEditorStore((state) => state.setEdges);
    const updateNodeData = useEditorStore((state) => state.updateNodeData);
    const setSelectedNodeId = useEditorStore((state) => state.setSelectedNodeId);
    const setRunMode = useEditorStore((state) => state.setRunMode);

    const [picker, setPicker] = useState<PickerState>(null);

    const reactFlowRef = useRef<ReactFlowInstance<AppFlowNode, WorkflowEdge> | null>(
        null
    );
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const initializedTemplateRef = useRef<string | null>(null);

    const attachNodeActions = useCallback(
        (rawNodes: AppFlowNode[]): AppFlowNode[] => {
            const nodesWithActions = rawNodes.map((node): AppFlowNode => {
                if (node.type === "promptNode") {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            onChange: (value: string) => {
                                updateNodeData(node.id, (data) => ({
                                    ...data,
                                    content: value,
                                }));
                            },
                        },
                    };
                }

                if (node.type === "textNode") {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            onChange: (value: string) => {
                                updateNodeData(node.id, (data) => ({
                                    ...data,
                                    content: value,
                                }));
                            },
                        },
                    };
                }

                if (node.type === "uploadImageNode") {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            onUpload: async (file: File) => {
                                const formData = new FormData();
                                formData.append("file", file, file.name);

                                const response = await fetch("/api/uploads", {
                                    method: "POST",
                                    body: formData,
                                });

                                if (!response.ok) {
                                    let message = "Image upload failed";

                                    try {
                                        const errorData = await response.json();
                                        message = errorData.message || message;
                                    } catch {
                                        try {
                                            message = await response.text();
                                        } catch { }
                                    }

                                    throw new Error(message);
                                }

                                const result = await response.json();

                                updateNodeData(node.id, (data) => ({
                                    ...data,
                                    imageUrl: result.url,
                                }));
                            },
                        },
                    };
                }

                if (node.type === "uploadVideoNode") {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            onUpload: async (file: File) => {
                                const formData = new FormData();
                                formData.append("file", file, file.name);

                                const response = await fetch("/api/uploads", {
                                    method: "POST",
                                    body: formData,
                                });

                                if (!response.ok) {
                                    let message = "Video upload failed";

                                    try {
                                        const errorData = await response.json();
                                        message = errorData.message || message;
                                    } catch {
                                        try {
                                            message = await response.text();
                                        } catch { }
                                    }

                                    throw new Error(message);
                                }

                                const result = await response.json();

                                updateNodeData(node.id, (data) => ({
                                    ...data,
                                    videoUrl: result.url,
                                }));
                            },
                        },
                    };
                }

                if (node.type === "llmNode") {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            onSystemPromptChange: (value: string) => {
                                updateNodeData(node.id, (data) => ({
                                    ...data,
                                    systemPrompt: value,
                                }));
                            },
                            onUserMessageChange: (value: string) => {
                                updateNodeData(node.id, (data) => ({
                                    ...data,
                                    userMessage: value,
                                }));
                            },
                        },
                    };
                }

                if (node.type === "cropImageNode") {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            onFieldChange: (field: string, value: string) => {
                                updateNodeData(node.id, (data) => ({
                                    ...data,
                                    [field]: value,
                                }));
                            },
                        },
                    };
                }

                if (node.type === "extractFrameNode") {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            onTimestampChange: (value: string) => {
                                updateNodeData(node.id, (data) => ({
                                    ...data,
                                    timestamp: value,
                                }));
                            },
                        },
                    };
                }

                if (node.type === "imageGeneratorNode") {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            onPromptChange: (value: string) => {
                                updateNodeData(node.id, (data) => ({
                                    ...data,
                                    prompt: value,
                                }));
                            },
                        },
                    };
                }

                return node;
            });

            return withDragHandle(nodesWithActions);
        },
        [updateNodeData]
    );

    useEffect(() => {
        if (template === "templates") return;
        if (initializedTemplateRef.current === template) return;
        if (nodes.length > 0 || edges.length > 0) return;

        initializedTemplateRef.current = template;

        if (template === "image-generator") {
            const workflow = getImageGeneratorWorkflow();
            setNodes(attachNodeActions(workflow.nodes as AppFlowNode[]));
            setEdges(workflow.edges as WorkflowEdge[]);
            return;
        }

        if (template === "marketing-workflow") {
            const workflow = getMarketingWorkflow();
            setNodes(attachNodeActions(workflow.nodes as AppFlowNode[]));
            setEdges(workflow.edges as WorkflowEdge[]);
            return;
        }

        const workflow = getEmptyWorkflow();
        setNodes(attachNodeActions(workflow.nodes as AppFlowNode[]));
        setEdges(workflow.edges as WorkflowEdge[]);
    }, [template, nodes.length, edges.length, setNodes, setEdges, attachNodeActions]);

    const onNodesChange = useCallback(
        (changes: NodeChange<AppFlowNode>[]) => {
            setNodes(applyNodeChanges(changes, nodes) as AppFlowNode[]);
        },
        [nodes, setNodes]
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange<WorkflowEdge>[]) => {
            setEdges(applyEdgeChanges(changes, edges) as WorkflowEdge[]);
        },
        [edges, setEdges]
    );

    const isValidConnection = useCallback(
        (connection: Connection | WorkflowEdge) => {
            const source = connection.source;
            const target = connection.target;
            const sourceHandle = connection.sourceHandle;
            const targetHandle = connection.targetHandle;

            if (!source || !target) return false;
            if (!sourceHandle || !targetHandle) return false;
            if (source === target) return false;

            if (!isConnectionAllowed(sourceHandle, targetHandle)) {
                return false;
            }

            const nextEdge: WorkflowEdge = {
                id: `edge-${source}-${sourceHandle}-${target}-${targetHandle}`,
                source,
                target,
                sourceHandle,
                targetHandle,
            };

            if (wouldCreateCycle(nodes, edges, nextEdge)) {
                return false;
            }

            return true;
        },
        [nodes, edges]
    );

    const onConnect = useCallback(
        (connection: Connection) => {
            const source = connection.source;
            const target = connection.target;
            const sourceHandle = connection.sourceHandle;
            const targetHandle = connection.targetHandle;

            if (!source || !target || !sourceHandle || !targetHandle) return;

            const nextEdge: WorkflowEdge = {
                id: `edge-${source}-${sourceHandle}-${target}-${targetHandle}`,
                source,
                target,
                sourceHandle,
                targetHandle,
                animated: true,
                style: { stroke: "#c9a300", strokeWidth: 3 },
            };

            if (!isValidConnection(nextEdge)) return;

            setEdges(addEdge(nextEdge, edges) as WorkflowEdge[]);
        },
        [edges, setEdges, isValidConnection]
    );

    const handlePaneClick = useCallback((_event: PaneMouseEvent) => {
        setPicker(null);
        setSelectedNodeId(null);
        setRunMode("full");
    }, [setSelectedNodeId, setRunMode]);

    const handlePaneContextMenu = useCallback((event: PaneMouseEvent) => {
        event.preventDefault();

        if (!canvasRef.current || !reactFlowRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const flowPosition = reactFlowRef.current.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        setPicker({
            x,
            y,
            flowX: flowPosition.x,
            flowY: flowPosition.y,
        });
    }, []);

    const openPickerAtCanvasCenter = useCallback(() => {
        if (!canvasRef.current || !reactFlowRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const centerScreenX = rect.left + rect.width / 2;
        const centerScreenY = rect.top + rect.height / 2;

        const flowPosition = reactFlowRef.current.screenToFlowPosition({
            x: centerScreenX,
            y: centerScreenY,
        });

        setPicker({
            x: rect.width / 2,
            y: rect.height / 2,
            flowX: flowPosition.x,
            flowY: flowPosition.y,
        });
    }, []);

    const derivedNodes: AppFlowNode[] = useMemo(() => {
        const attachedNodes = attachNodeActions(nodes);

        return attachedNodes.map((node): AppFlowNode => {
            const selectedClass =
                node.id === selectedNodeId
                    ? "ring-2 ring-blue-500 ring-offset-0"
                    : undefined;

            if (node.type === "promptNode" || node.type === "textNode") {
                const incoming = edges.find(
                    (edge) => edge.target === node.id && edge.targetHandle === "content"
                );

                const resolvedContent = incoming
                    ? (() => {
                        const sourceNode = attachedNodes.find(
                            (candidate) => candidate.id === incoming.source
                        );
                        if (!sourceNode) return "";

                        if (
                            sourceNode.type === "promptNode" ||
                            sourceNode.type === "textNode"
                        ) {
                            return sourceNode.data.content ?? "";
                        }

                        if (sourceNode.type === "llmNode") {
                            return sourceNode.data.output ?? "";
                        }

                        return "";
                    })()
                    : undefined;

                return {
                    ...node,
                    className: selectedClass,
                    data: {
                        ...node.data,
                        resolvedContent,
                        contentConnected: Boolean(incoming),
                    },
                } as AppFlowNode;
            }

            if (node.type === "imageGeneratorNode") {
                const promptEdge = edges.find(
                    (edge) => edge.target === node.id && edge.targetHandle === "prompt"
                );

                const resolvedPrompt = promptEdge
                    ? (() => {
                        const sourceNode = attachedNodes.find(
                            (candidate) => candidate.id === promptEdge.source
                        );
                        if (!sourceNode) return "";

                        if (
                            sourceNode.type === "promptNode" ||
                            sourceNode.type === "textNode"
                        ) {
                            return sourceNode.data.content ?? "";
                        }

                        if (sourceNode.type === "llmNode") {
                            return sourceNode.data.output ?? "";
                        }

                        return "";
                    })()
                    : undefined;

                return {
                    ...node,
                    className: selectedClass,
                    data: {
                        ...node.data,
                        resolvedPrompt,
                        promptConnected: Boolean(promptEdge),
                    },
                } as AppFlowNode;
            }

            if (node.type === "llmNode") {
                const systemPromptEdge = edges.find(
                    (edge) =>
                        edge.target === node.id && edge.targetHandle === "system_prompt"
                );
                const userMessageEdge = edges.find(
                    (edge) =>
                        edge.target === node.id && edge.targetHandle === "user_message"
                );
                const imagesEdge = edges.find(
                    (edge) => edge.target === node.id && edge.targetHandle === "images"
                );

                const resolveTextFromEdge = (edge?: WorkflowEdge) => {
                    if (!edge) return undefined;

                    const sourceNode = attachedNodes.find(
                        (candidate) => candidate.id === edge.source
                    );
                    if (!sourceNode) return "";

                    if (
                        sourceNode.type === "promptNode" ||
                        sourceNode.type === "textNode"
                    ) {
                        return sourceNode.data.content ?? "";
                    }

                    if (sourceNode.type === "llmNode") {
                        return sourceNode.data.output ?? "";
                    }

                    return "";
                };

                return {
                    ...node,
                    className: selectedClass,
                    data: {
                        ...node.data,
                        resolvedSystemPrompt: resolveTextFromEdge(systemPromptEdge),
                        resolvedUserMessage: resolveTextFromEdge(userMessageEdge),
                        systemPromptConnected: Boolean(systemPromptEdge),
                        userMessageConnected: Boolean(userMessageEdge),
                        imagesConnected: Boolean(imagesEdge),
                    },
                } as AppFlowNode;
            }

            if (node.type === "cropImageNode") {
                const imageEdge = edges.find(
                    (edge) => edge.target === node.id && edge.targetHandle === "image_url"
                );

                const resolvedImageUrl = imageEdge
                    ? (() => {
                        const sourceNode = attachedNodes.find(
                            (candidate) => candidate.id === imageEdge.source
                        );
                        if (!sourceNode) return "";

                        if (sourceNode.type === "uploadImageNode") {
                            return sourceNode.data.imageUrl ?? "";
                        }

                        if (sourceNode.type === "imageGeneratorNode") {
                            return sourceNode.data.imageUrl ?? "";
                        }

                        if (sourceNode.type === "extractFrameNode") {
                            return sourceNode.data.outputImageUrl ?? "";
                        }

                        if (sourceNode.type === "cropImageNode") {
                            return sourceNode.data.imageUrl ?? "";
                        }

                        return "";
                    })()
                    : node.data.imageUrl;

                return {
                    ...node,
                    className: selectedClass,
                    data: {
                        ...node.data,
                        imageUrl: resolvedImageUrl,
                        imageConnected: Boolean(imageEdge),
                    },
                } as CropImageFlowNode;
            }

            if (node.type === "extractFrameNode") {
                const videoEdge = edges.find(
                    (edge) => edge.target === node.id && edge.targetHandle === "video_url"
                );

                const resolvedVideoUrl = videoEdge
                    ? (() => {
                        const sourceNode = attachedNodes.find(
                            (candidate) => candidate.id === videoEdge.source
                        );
                        if (!sourceNode) return "";

                        if (sourceNode.type === "uploadVideoNode") {
                            return sourceNode.data.videoUrl ?? "";
                        }

                        return "";
                    })()
                    : node.data.videoUrl;

                return {
                    ...node,
                    className: selectedClass,
                    data: {
                        ...node.data,
                        videoUrl: resolvedVideoUrl,
                        videoConnected: Boolean(videoEdge),
                    },
                } as ExtractFrameFlowNode;
            }

            return {
                ...node,
                className: selectedClass,
            };
        });
    }, [nodes, edges, attachNodeActions, selectedNodeId]);

    const handleAddNode = useCallback(
        (type: AddableNodeType) => {
            if (!picker) return;

            const id = `${type}-${Date.now()}`;
            let newNode: AppFlowNode;

            if (type === "promptNode") {
                newNode = {
                    id,
                    type: "promptNode",
                    position: { x: picker.flowX, y: picker.flowY },
                    dragHandle: ".node-drag-handle",
                    data: {
                        label: "Prompt",
                        content: "",
                        runStatus: "idle",
                    },
                };
            } else if (type === "textNode") {
                newNode = {
                    id,
                    type: "textNode",
                    position: { x: picker.flowX, y: picker.flowY },
                    dragHandle: ".node-drag-handle",
                    data: {
                        label: "Text",
                        content: "",
                        runStatus: "idle",
                    },
                };
            } else if (type === "uploadImageNode") {
                newNode = {
                    id,
                    type: "uploadImageNode",
                    position: { x: picker.flowX, y: picker.flowY },
                    dragHandle: ".node-drag-handle",
                    data: {
                        label: "Upload Image",
                        imageUrl: "",
                        runStatus: "idle",
                    },
                };
            } else if (type === "uploadVideoNode") {
                newNode = {
                    id,
                    type: "uploadVideoNode",
                    position: { x: picker.flowX, y: picker.flowY },
                    dragHandle: ".node-drag-handle",
                    data: {
                        label: "Upload Video",
                        videoUrl: "",
                        runStatus: "idle",
                    },
                };
            } else if (type === "llmNode") {
                newNode = {
                    id,
                    type: "llmNode",
                    position: { x: picker.flowX, y: picker.flowY },
                    dragHandle: ".node-drag-handle",
                    data: {
                        label: "Run Any LLM",
                        model: "gemini-2.0-flash",
                        systemPrompt: "",
                        userMessage: "",
                        output: "",
                        runStatus: "idle",
                    },
                };
            } else if (type === "cropImageNode") {
                newNode = {
                    id,
                    type: "cropImageNode",
                    position: { x: picker.flowX, y: picker.flowY },
                    dragHandle: ".node-drag-handle",
                    data: {
                        label: "Crop Image",
                        imageUrl: "",
                        xPercent: "0",
                        yPercent: "0",
                        widthPercent: "100",
                        heightPercent: "100",
                        runStatus: "idle",
                    },
                };
            } else if (type === "extractFrameNode") {
                newNode = {
                    id,
                    type: "extractFrameNode",
                    position: { x: picker.flowX, y: picker.flowY },
                    dragHandle: ".node-drag-handle",
                    data: {
                        label: "Extract Frame",
                        videoUrl: "",
                        timestamp: "0",
                        outputImageUrl: "",
                        runStatus: "idle",
                    },
                };
            } else {
                newNode = {
                    id,
                    type: "imageGeneratorNode",
                    position: { x: picker.flowX, y: picker.flowY },
                    dragHandle: ".node-drag-handle",
                    data: {
                        label: "Krea-1",
                        model: "Krea1",
                        prompt: "",
                        imageUrl: "",
                        runStatus: "idle",
                    },
                } as ImageGeneratorFlowNode;
            }

            setNodes([...nodes, ...attachNodeActions([newNode])]);
            setPicker(null);
        },
        [picker, nodes, setNodes, attachNodeActions]
    );

    return (
        <div ref={canvasRef} className="absolute inset-0">
            <ReactFlow<AppFlowNode, WorkflowEdge>
                nodes={derivedNodes}
                edges={edges}
                onInit={(instance) => {
                    reactFlowRef.current = instance;
                }}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onPaneClick={handlePaneClick}
                onPaneContextMenu={handlePaneContextMenu}
                onNodeClick={(_event, node) => {
                    setSelectedNodeId(node.id);
                    setRunMode("single");
                }}
                onNodeContextMenu={(event, node) => {
                    event.preventDefault();
                    setSelectedNodeId(node.id);
                    setRunMode("single");


                    setTimeout(() => {
                        useEditorStore.getState().runWorkflow();
                    }, 0);
                }}
                isValidConnection={isValidConnection}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                proOptions={{ hideAttribution: true }}
                defaultEdgeOptions={{
                    animated: true,
                    style: { stroke: "#c9a300", strokeWidth: 3 },
                }}
                nodeDragThreshold={1}
                panOnDrag={[1, 2]}
                selectionOnDrag={false}
                zoomOnScroll
                zoomOnPinch
                zoomOnDoubleClick={false}
                panOnScroll={false}
                minZoom={0.2}
                maxZoom={2}
                nodesDraggable
                elementsSelectable
            >
                <Background gap={26} size={1} color="rgba(255,255,255,0.08)" />
                <MiniMap
                    pannable
                    zoomable
                    position="bottom-right"
                    style={{
                        width: 180,
                        height: 120,
                        backgroundColor: "#0f1115",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 12,
                    }}
                    nodeColor={() => "#1e7bff"}
                />
                <Controls
                    position="bottom-right"
                    style={{
                        marginBottom: 140,
                        backgroundColor: "#111",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 12,
                    }}
                />
            </ReactFlow>

            {nodes.length === 0 && !picker && template !== "templates" ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="pointer-events-auto text-center text-white/55">
                        <div className="text-4xl font-semibold text-white/75">
                            Add a node
                        </div>
                        <div className="mt-4 text-xl">
                            Right click, or use the button below
                        </div>
                        <button
                            onClick={openPickerAtCanvasCenter}
                            className="mt-6 rounded-xl bg-white/10 px-4 py-3 text-white hover:bg-white/15"
                        >
                            Open Node Picker
                        </button>
                    </div>
                </div>
            ) : null}

            {picker ? (
                <NodePicker
                    x={picker.x}
                    y={picker.y}
                    onSelect={handleAddNode}
                    onClose={() => setPicker(null)}
                />
            ) : null}
        </div>
    );
}