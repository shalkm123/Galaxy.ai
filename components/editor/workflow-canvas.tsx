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
    type ReactFlowInstance,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
} from "@/lib/workflow-templates";
import { isConnectionAllowed } from "@/lib/connection-rules";
import { wouldCreateCycle } from "@/lib/graph-helpers";

import { useEditorStore } from "@/store/editor-store";

import type {
    AppFlowNode,
    CropImageFlowNode,
    ExtractFrameFlowNode,
    ImageGeneratorFlowNode,
    LlmFlowNode,
    WorkflowEdge,
} from "@/types/workflow";

const nodeTypes = {
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
    const setNodes = useEditorStore((state) => state.setNodes);
    const setEdges = useEditorStore((state) => state.setEdges);
    const resetWorkflow = useEditorStore((state) => state.resetWorkflow);
    const updateNodeData = useEditorStore((state) => state.updateNodeData);

    const [picker, setPicker] = useState<PickerState>(null);

    const reactFlowRef =
        useRef<ReactFlowInstance<AppFlowNode, WorkflowEdge> | null>(null);
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
                                formData.append("file", file);

                                const response = await fetch("/api/uploads", {
                                    method: "POST",
                                    body: formData,
                                });

                                if (!response.ok) {
                                    throw new Error("Image upload failed");
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
                                formData.append("file", file);

                                const response = await fetch("/api/uploads", {
                                    method: "POST",
                                    body: formData,
                                });

                                if (!response.ok) {
                                    throw new Error("Video upload failed");
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

                return node;
            });

            return withDragHandle(nodesWithActions);
        },
        [updateNodeData]
    );

    useEffect(() => {
        if (template === "templates") {
            initializedTemplateRef.current = null;
            return;
        }

        if (nodes.length > 0 || edges.length > 0) return;
        if (initializedTemplateRef.current === template) return;

        const next =
            template === "image-generator"
                ? getImageGeneratorWorkflow()
                : getEmptyWorkflow();

        initializedTemplateRef.current = template;
        resetWorkflow(attachNodeActions(next.nodes), next.edges);
    }, [template, nodes.length, edges.length, resetWorkflow, attachNodeActions]);

    const openPicker = useCallback((clientX: number, clientY: number) => {
        if (!reactFlowRef.current) return;

        const flowPosition = reactFlowRef.current.screenToFlowPosition({
            x: clientX,
            y: clientY,
        });

        setPicker({
            x: clientX,
            y: clientY,
            flowX: flowPosition.x,
            flowY: flowPosition.y,
        });
    }, []);

    const openPickerAtCanvasCenter = useCallback(() => {
        const bounds = canvasRef.current?.getBoundingClientRect();
        if (!bounds) return;

        openPicker(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    }, [openPicker]);

    useEffect(() => {
        const handleAddNodeEvent = () => {
            openPickerAtCanvasCenter();
        };

        window.addEventListener("editor:add-node", handleAddNodeEvent);
        return () => {
            window.removeEventListener("editor:add-node", handleAddNodeEvent);
        };
    }, [openPickerAtCanvasCenter]);

    const getNodeById = useCallback(
        (id: string) => nodes.find((node) => node.id === id),
        [nodes]
    );

    const getTextFromSourceNode = useCallback(
        (nodeId: string) => {
            const sourceNode = getNodeById(nodeId);
            if (!sourceNode) return "";

            if (sourceNode.type === "textNode") return sourceNode.data.content || "";
            if (sourceNode.type === "promptNode") return sourceNode.data.content || "";
            if (sourceNode.type === "llmNode") return sourceNode.data.output || "";

            return "";
        },
        [getNodeById]
    );

    const getIncomingEdge = useCallback(
        (targetNodeId: string, targetHandle: string) => {
            return edges.find(
                (edge) =>
                    edge.target === targetNodeId && edge.targetHandle === targetHandle
            );
        },
        [edges]
    );

    const isValidConnection = useCallback(
        (connection: Connection | WorkflowEdge) => {
            const sourceHandle = connection.sourceHandle ?? null;
            const targetHandle = connection.targetHandle ?? null;

            if (!connection.source || !connection.target) return false;
            if (connection.source === connection.target) return false;
            if (!isConnectionAllowed(sourceHandle, targetHandle)) return false;

            const candidateEdge: WorkflowEdge = {
                id: `preview-${connection.source}-${connection.sourceHandle ?? "none"}-${connection.target}-${connection.targetHandle ?? "none"}`,
                source: connection.source,
                target: connection.target,
                sourceHandle: connection.sourceHandle,
                targetHandle: connection.targetHandle,
            };

            return !wouldCreateCycle(nodes, edges, candidateEdge);
        },
        [nodes, edges]
    );

    const derivedNodes = useMemo<AppFlowNode[]>(() => {
        const mapped = nodes.map((node) => {
            if (node.type === "llmNode") {
                const systemPromptEdge = getIncomingEdge(node.id, "system_prompt");
                const userMessageEdge = getIncomingEdge(node.id, "user_message");
                const imagesEdge = getIncomingEdge(node.id, "images");

                return {
                    ...node,
                    data: {
                        ...node.data,
                        resolvedSystemPrompt: systemPromptEdge
                            ? getTextFromSourceNode(systemPromptEdge.source)
                            : node.data.systemPrompt,
                        resolvedUserMessage: userMessageEdge
                            ? getTextFromSourceNode(userMessageEdge.source)
                            : node.data.userMessage,
                        systemPromptConnected: !!systemPromptEdge,
                        userMessageConnected: !!userMessageEdge,
                        imagesConnected: !!imagesEdge,
                    },
                } as LlmFlowNode;
            }

            if (node.type === "imageGeneratorNode") {
                const promptEdge = getIncomingEdge(node.id, "prompt");
                const imagePromptEdge = getIncomingEdge(node.id, "imagePrompt");

                return {
                    ...node,
                    data: {
                        ...node.data,
                        resolvedPrompt: promptEdge
                            ? getTextFromSourceNode(promptEdge.source)
                            : node.data.prompt,
                        promptConnected: !!promptEdge,
                        imagePromptConnected: !!imagePromptEdge,
                    },
                } as ImageGeneratorFlowNode;
            }

            if (node.type === "cropImageNode") {
                const imageEdge = getIncomingEdge(node.id, "image_url");

                return {
                    ...node,
                    data: {
                        ...node.data,
                        imageConnected: !!imageEdge,
                    },
                } as CropImageFlowNode;
            }

            if (node.type === "extractFrameNode") {
                const videoEdge = getIncomingEdge(node.id, "video_url");

                return {
                    ...node,
                    data: {
                        ...node.data,
                        videoConnected: !!videoEdge,
                    },
                } as ExtractFrameFlowNode;
            }

            return node;
        });

        return attachNodeActions(mapped);
    }, [nodes, attachNodeActions, getIncomingEdge, getTextFromSourceNode]);

    const onNodesChange = useCallback(
        (changes: NodeChange<AppFlowNode>[]) => {
            const next = applyNodeChanges(changes, nodes) as AppFlowNode[];
            setNodes(
                next.map((node) => ({
                    ...node,
                    dragHandle: ".node-drag-handle",
                }))
            );
        },
        [nodes, setNodes]
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange<WorkflowEdge>[]) => {
            setEdges(applyEdgeChanges(changes, edges) as WorkflowEdge[]);
        },
        [edges, setEdges]
    );

    const onConnect = useCallback(
        (params: Connection) => {
            if (!params.source || !params.target) return;
            if (params.source === params.target) return;

            if (
                !isConnectionAllowed(
                    params.sourceHandle ?? null,
                    params.targetHandle ?? null
                )
            ) {
                return;
            }

            const candidateEdge: WorkflowEdge = {
                id: `e-${params.source}-${params.sourceHandle ?? "none"}-${params.target}-${params.targetHandle ?? "none"}`,
                source: params.source,
                target: params.target,
                sourceHandle: params.sourceHandle,
                targetHandle: params.targetHandle,
                animated: true,
                style: { stroke: "#c9a300", strokeWidth: 3 },
            };

            if (wouldCreateCycle(nodes, edges, candidateEdge)) {
                return;
            }

            setEdges(addEdge(candidateEdge, edges) as WorkflowEdge[]);
        },
        [nodes, edges, setEdges]
    );

    const handlePaneContextMenu = useCallback(
        (event: React.MouseEvent<Element, MouseEvent>) => {
            event.preventDefault();
            event.stopPropagation();
            openPicker(event.clientX, event.clientY);
        },
        [openPicker]
    );

    const handlePaneClick = useCallback(() => {
        setPicker(null);
    }, []);

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
                        content: "New prompt...",
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
                        label: "Text Node",
                        content: "New text...",
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
                        model: "gemini-2.5-flash",
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
                        prompt: "Prompt appears here...",
                        imageUrl:
                            "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1000&auto=format&fit=crop",
                        runStatus: "idle",
                    },
                };
            }

            setNodes([...nodes, ...attachNodeActions([newNode])]);
            setPicker(null);
        },
        [picker, nodes, setNodes, attachNodeActions]
    );

    return (
        <div ref={canvasRef} className="absolute inset-0">
            <ReactFlow
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
                        <div className="text-4xl font-semibold text-white/75">Add a node</div>
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