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

import {
    EditorBottombar,
    type EditorToolMode,
} from "@/components/editor/editor-bottom-toolbar";

import { PromptNode } from "@/components/editor/nodes/prompt-node";
import { ImageGeneratorNode } from "@/components/editor/nodes/image-generator-node";
import { TextNode } from "@/components/editor/nodes/text-node";
import { UploadImageNode } from "@/components/editor/nodes/upload-image-node";
import { UploadVideoNode } from "@/components/editor/nodes/upload-video-node";
import { LlmNode } from "@/components/editor/nodes/llm-node";
import { CropImageNode } from "@/components/editor/nodes/crop-image-node";
import { ExtractFrameNode } from "@/components/editor/nodes/extract-frame-node";

import {
    NodePicker,
    NodeSidebar,
    type AddableNodeType,
} from "@/components/editor/node-picker";

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

type PaneMouseEvent = MouseEvent | React.MouseEvent<Element, MouseEvent>;

function withDragHandle(nodes: AppFlowNode[]): AppFlowNode[] {
    return nodes.map((node) => ({
        ...node,
        dragHandle: ".node-drag-handle",
    }));
}

function buildNewNode(
    type: AddableNodeType,
    id: string,
    position: { x: number; y: number }
): AppFlowNode {
    const base = { id, type, position, dragHandle: ".node-drag-handle" };

    switch (type) {
        case "promptNode":
            return {
                ...base,
                type: "promptNode",
                data: {
                    label: "Prompt",
                    content: "",
                    runStatus: "idle",
                },
            };

        case "textNode":
            return {
                ...base,
                type: "textNode",
                data: {
                    label: "Text",
                    content: "",
                    runStatus: "idle",
                },
            };

        case "uploadImageNode":
            return {
                ...base,
                type: "uploadImageNode",
                data: {
                    label: "Upload Image",
                    imageUrl: "",
                    runStatus: "idle",
                },
            };

        case "uploadVideoNode":
            return {
                ...base,
                type: "uploadVideoNode",
                data: {
                    label: "Upload Video",
                    videoUrl: "",
                    runStatus: "idle",
                },
            };

        case "llmNode":
            return {
                ...base,
                type: "llmNode",
                data: {
                    label: "Run Any LLM",
                    model: "gemini-2.0-flash",
                    systemPrompt: "",
                    userMessage: "",
                    output: "",
                    runStatus: "idle",
                },
            };

        case "cropImageNode":
            return {
                ...base,
                type: "cropImageNode",
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

        case "extractFrameNode":
            return {
                ...base,
                type: "extractFrameNode",
                data: {
                    label: "Extract Frame",
                    videoUrl: "",
                    timestamp: "0",
                    outputImageUrl: "",
                    runStatus: "idle",
                },
            };

        case "imageGeneratorNode":
        default:
            return {
                ...base,
                type: "imageGeneratorNode",
                data: {
                    label: "Krea-1",
                    model: "Krea1",
                    prompt: "",
                    imageUrl: "",
                    runStatus: "idle",
                },
            } as ImageGeneratorFlowNode;
    }
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
    const [activeTool, setActiveTool] = useState<EditorToolMode>("select");
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

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
                            onChange: (value: string) =>
                                updateNodeData(node.id, (data) => ({
                                    ...data,
                                    content: value,
                                })),
                        },
                    };
                }

                if (node.type === "textNode") {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            onChange: (value: string) =>
                                updateNodeData(node.id, (data) => ({
                                    ...data,
                                    content: value,
                                })),
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
                                        const data = await response.json();
                                        message = data.message || message;
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
                                        const data = await response.json();
                                        message = data.message || message;
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
                            onSystemPromptChange: (value: string) =>
                                updateNodeData(node.id, (data) => ({
                                    ...data,
                                    systemPrompt: value,
                                })),
                            onUserMessageChange: (value: string) =>
                                updateNodeData(node.id, (data) => ({
                                    ...data,
                                    userMessage: value,
                                })),
                        },
                    };
                }

                if (node.type === "cropImageNode") {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            onFieldChange: (field: string, value: string) =>
                                updateNodeData(node.id, (data) => ({
                                    ...data,
                                    [field]: value,
                                })),
                        },
                    };
                }

                if (node.type === "extractFrameNode") {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            onTimestampChange: (value: string) =>
                                updateNodeData(node.id, (data) => ({
                                    ...data,
                                    timestamp: value,
                                })),
                        },
                    };
                }

                if (node.type === "imageGeneratorNode") {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            onPromptChange: (value: string) =>
                                updateNodeData(node.id, (data) => ({
                                    ...data,
                                    prompt: value,
                                })),
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
    }, [
        template,
        nodes.length,
        edges.length,
        setNodes,
        setEdges,
        attachNodeActions,
    ]);

    const handleFitView = useCallback(() => {
        reactFlowRef.current?.fitView({
            padding: 0.2,
            duration: 300,
        });
    }, []);

    const handleDeleteSelected = useCallback(() => {
        if (selectedNodeId) {
            setNodes(nodes.filter((node) => node.id !== selectedNodeId));

            setEdges(
                edges.filter(
                    (edge) =>
                        edge.source !== selectedNodeId &&
                        edge.target !== selectedNodeId
                )
            );

            setSelectedNodeId(null);
            setSelectedEdgeId(null);
            setRunMode("full");
            return;
        }

        if (selectedEdgeId) {
            setEdges(edges.filter((edge) => edge.id !== selectedEdgeId));
            setSelectedEdgeId(null);
        }
    }, [
        selectedNodeId,
        selectedEdgeId,
        nodes,
        edges,
        setNodes,
        setEdges,
        setSelectedNodeId,
        setRunMode,
    ]);

    const handleToolChange = useCallback((tool: EditorToolMode) => {
        setActiveTool(tool);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const activeElement = document.activeElement;

            const isTypingInsideInput =
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement ||
                activeElement instanceof HTMLSelectElement ||
                activeElement?.getAttribute("contenteditable") === "true";

            if (isTypingInsideInput) return;

            const isDeleteKey =
                event.key === "Backspace" || event.key === "Delete";

            if (!isDeleteKey) return;
            if (!selectedNodeId && !selectedEdgeId) return;

            event.preventDefault();
            handleDeleteSelected();
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedNodeId, selectedEdgeId, handleDeleteSelected]);

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
            const { source, target, sourceHandle, targetHandle } = connection;

            if (!source || !target || !sourceHandle || !targetHandle) {
                return false;
            }

            if (source === target) return false;
            if (!isConnectionAllowed(sourceHandle, targetHandle)) return false;

            const nextEdge: WorkflowEdge = {
                id: `edge-${source}-${sourceHandle}-${target}-${targetHandle}`,
                source,
                target,
                sourceHandle,
                targetHandle,
            };

            if (wouldCreateCycle(nodes, edges, nextEdge)) return false;

            return true;
        },
        [nodes, edges]
    );

    const onConnect = useCallback(
        (connection: Connection) => {
            const { source, target, sourceHandle, targetHandle } = connection;

            if (!source || !target || !sourceHandle || !targetHandle) return;

            const nextEdge: WorkflowEdge = {
                id: `edge-${source}-${sourceHandle}-${target}-${targetHandle}`,
                source,
                target,
                sourceHandle,
                targetHandle,
                animated: true,
                style: {
                    stroke: "#c9a300",
                    strokeWidth: 3,
                },
            };

            if (!isValidConnection(nextEdge)) return;

            setEdges(addEdge(nextEdge, edges) as WorkflowEdge[]);
            setActiveTool("select");
        },
        [edges, setEdges, isValidConnection]
    );

    const handlePaneClick = useCallback(
        (_event: PaneMouseEvent) => {
            setPicker(null);
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
            setRunMode("full");
        },
        [setSelectedNodeId, setRunMode]
    );

    const handlePaneContextMenu = useCallback((event: PaneMouseEvent) => {
        event.preventDefault();

        if (!canvasRef.current || !reactFlowRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const flowPosition = reactFlowRef.current.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        setPicker({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
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

    const addNodeAtPosition = useCallback(
        (type: AddableNodeType, flowX: number, flowY: number) => {
            const id = `${type}-${Date.now()}`;
            const newNode = buildNewNode(type, id, {
                x: flowX,
                y: flowY,
            });

            setNodes([...nodes, ...attachNodeActions([newNode])]);
        },
        [nodes, setNodes, attachNodeActions]
    );

    const handlePickerSelect = useCallback(
        (type: AddableNodeType) => {
            if (!picker) return;

            addNodeAtPosition(type, picker.flowX, picker.flowY);
            setPicker(null);
        },
        [picker, addNodeAtPosition]
    );

    const handleSidebarAdd = useCallback(
        (type: AddableNodeType) => {
            if (!reactFlowRef.current || !canvasRef.current) return;

            const rect = canvasRef.current.getBoundingClientRect();

            const flowPos = reactFlowRef.current.screenToFlowPosition({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
            });

            addNodeAtPosition(
                type,
                flowPos.x + (Math.random() - 0.5) * 120,
                flowPos.y + (Math.random() - 0.5) * 80
            );
        },
        [addNodeAtPosition]
    );

    const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();

            if (!reactFlowRef.current || !canvasRef.current) return;

            const type = event.dataTransfer.getData(
                "application/reactflow-node-type"
            ) as AddableNodeType;

            if (!type) return;

            const flowPos = reactFlowRef.current.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            addNodeAtPosition(type, flowPos.x, flowPos.y);
        },
        [addNodeAtPosition]
    );

    const derivedNodes: AppFlowNode[] = useMemo(() => {
        const attachedNodes = attachNodeActions(nodes);

        return attachedNodes.map((node): AppFlowNode => {
            const selectedClass =
                node.id === selectedNodeId
                    ? "ring-2 ring-blue-500 ring-offset-0"
                    : undefined;

            if (node.type === "promptNode" || node.type === "textNode") {
                const incoming = edges.find(
                    (edge) =>
                        edge.target === node.id &&
                        edge.targetHandle === "content"
                );

                const resolvedContent = incoming
                    ? (() => {
                        const src = attachedNodes.find(
                            (n) => n.id === incoming.source
                        );

                        if (!src) return "";

                        if (
                            src.type === "promptNode" ||
                            src.type === "textNode"
                        ) {
                            return src.data.content ?? "";
                        }

                        if (src.type === "llmNode") {
                            return src.data.output ?? "";
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
                    (edge) =>
                        edge.target === node.id &&
                        edge.targetHandle === "prompt"
                );

                const resolvedPrompt = promptEdge
                    ? (() => {
                        const src = attachedNodes.find(
                            (n) => n.id === promptEdge.source
                        );

                        if (!src) return "";

                        if (
                            src.type === "promptNode" ||
                            src.type === "textNode"
                        ) {
                            return src.data.content ?? "";
                        }

                        if (src.type === "llmNode") {
                            return src.data.output ?? "";
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
                        edge.target === node.id &&
                        edge.targetHandle === "system_prompt"
                );

                const userMessageEdge = edges.find(
                    (edge) =>
                        edge.target === node.id &&
                        edge.targetHandle === "user_message"
                );

                const imagesEdge = edges.find(
                    (edge) =>
                        edge.target === node.id &&
                        edge.targetHandle === "images"
                );

                const resolveText = (edge?: WorkflowEdge) => {
                    if (!edge) return undefined;

                    const src = attachedNodes.find((n) => n.id === edge.source);

                    if (!src) return "";

                    if (src.type === "promptNode" || src.type === "textNode") {
                        return src.data.content ?? "";
                    }

                    if (src.type === "llmNode") {
                        return src.data.output ?? "";
                    }

                    return "";
                };

                return {
                    ...node,
                    className: selectedClass,
                    data: {
                        ...node.data,
                        resolvedSystemPrompt: resolveText(systemPromptEdge),
                        resolvedUserMessage: resolveText(userMessageEdge),
                        systemPromptConnected: Boolean(systemPromptEdge),
                        userMessageConnected: Boolean(userMessageEdge),
                        imagesConnected: Boolean(imagesEdge),
                    },
                } as AppFlowNode;
            }

            if (node.type === "cropImageNode") {
                const imageEdge = edges.find(
                    (edge) =>
                        edge.target === node.id &&
                        edge.targetHandle === "image_url"
                );

                const resolvedImageUrl = imageEdge
                    ? (() => {
                        const src = attachedNodes.find(
                            (n) => n.id === imageEdge.source
                        );

                        if (!src) return "";

                        if (src.type === "uploadImageNode") {
                            return src.data.imageUrl ?? "";
                        }

                        if (src.type === "imageGeneratorNode") {
                            return src.data.imageUrl ?? "";
                        }

                        if (src.type === "extractFrameNode") {
                            return src.data.outputImageUrl ?? "";
                        }

                        if (src.type === "cropImageNode") {
                            return src.data.imageUrl ?? "";
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
                    (edge) =>
                        edge.target === node.id &&
                        edge.targetHandle === "video_url"
                );

                const resolvedVideoUrl = videoEdge
                    ? (() => {
                        const src = attachedNodes.find(
                            (n) => n.id === videoEdge.source
                        );

                        if (!src) return "";

                        if (src.type === "uploadVideoNode") {
                            return src.data.videoUrl ?? "";
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

    return (
        <div className="flex h-full w-full overflow-hidden">
            <NodeSidebar onAdd={handleSidebarAdd} />

            <div
                ref={canvasRef}
                className="relative flex-1 overflow-hidden"
                onDrop={onDrop}
                onDragOver={onDragOver}
            >
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
                        if (activeTool === "cut") {
                            setNodes(nodes.filter((item) => item.id !== node.id));

                            setEdges(
                                edges.filter(
                                    (edge) =>
                                        edge.source !== node.id &&
                                        edge.target !== node.id
                                )
                            );

                            setSelectedNodeId(null);
                            setSelectedEdgeId(null);
                            setActiveTool("select");
                            setRunMode("full");
                            return;
                        }

                        setSelectedNodeId(node.id);
                        setSelectedEdgeId(null);
                        setRunMode("single");
                    }}
                    onEdgeClick={(_event, edge) => {
                        if (activeTool === "cut") {
                            setEdges(edges.filter((item) => item.id !== edge.id));
                            setSelectedEdgeId(null);
                            setActiveTool("select");
                            return;
                        }

                        setSelectedEdgeId(edge.id);
                        setSelectedNodeId(null);
                        setRunMode("full");
                    }}
                    onNodeContextMenu={(event, node) => {
                        event.preventDefault();
                        setSelectedNodeId(node.id);
                        setSelectedEdgeId(null);
                        setRunMode("single");
                    }}
                    isValidConnection={isValidConnection}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    proOptions={{ hideAttribution: true }}
                    defaultEdgeOptions={{
                        animated: true,
                        style: {
                            stroke: "#c9a300",
                            strokeWidth: 3,
                        },
                    }}
                    nodeDragThreshold={1}
                    panOnDrag={activeTool === "pan" ? true : [1, 2]}
                    selectionOnDrag={activeTool === "select"}
                    nodesDraggable={activeTool !== "pan"}
                    elementsSelectable={activeTool !== "pan"}
                    nodesConnectable={activeTool !== "pan"}
                    zoomOnScroll
                    zoomOnPinch
                    zoomOnDoubleClick={false}
                    panOnScroll={false}
                    minZoom={0.2}
                    maxZoom={2}
                >
                    <Background
                        gap={26}
                        size={1}
                        color="rgba(255,255,255,0.08)"
                    />

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
                        showZoom={true}
                        showFitView={true}
                        showInteractive={true}
                        className="galaxy-flow-controls"
                        style={{
                            marginBottom: 148,
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
                                Drag from the sidebar, right-click, or use the
                                button below
                            </div>

                            <button
                                type="button"
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
                        onSelect={handlePickerSelect}
                        onClose={() => setPicker(null)}
                    />
                ) : null}

                <EditorBottombar
                    activeTool={activeTool}
                    hasSelection={Boolean(selectedNodeId || selectedEdgeId)}
                    onToolChange={handleToolChange}
                    onAddNode={openPickerAtCanvasCenter}
                    onDeleteSelected={handleDeleteSelected}
                    onFitView={handleFitView}
                />
            </div>
        </div>
    );
}