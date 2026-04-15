"use client";

import {
    Background,
    Controls,
    MiniMap,
    ReactFlow,
    addEdge,
    useEdgesState,
    useNodesState,
    type Connection,
    type ReactFlowInstance,
} from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { PromptNode } from "@/components/editor/nodes/prompt-node";
import { ImageGeneratorNode } from "@/components/editor/nodes/image-generator-node";
import { NodePicker } from "@/components/editor/node-picker";
import {
    getEmptyWorkflow,
    getImageGeneratorWorkflow,
} from "@/lib/workflow-templates";
import type {
    AppFlowNode,
    ImageGeneratorFlowNode,
    PromptFlowNode,
    WorkflowEdge,
} from "@/types/workflow";

const nodeTypes = {
    promptNode: PromptNode,
    imageGeneratorNode: ImageGeneratorNode,
};

type WorkflowCanvasProps = {
    template: "empty" | "image-generator";
};

type PickerState = {
    x: number;
    y: number;
    flowX: number;
    flowY: number;
} | null;

export function WorkflowCanvas({ template }: WorkflowCanvasProps) {
    const initial =
        template === "image-generator"
            ? getImageGeneratorWorkflow()
            : getEmptyWorkflow();

    const [nodes, setNodes, onNodesChange] = useNodesState<AppFlowNode>(
        initial.nodes
    );
    const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowEdge>(
        initial.edges
    );

    const [picker, setPicker] = useState<PickerState>(null);
    const reactFlowRef =
        useRef<ReactFlowInstance<AppFlowNode, WorkflowEdge> | null>(null);

    const attachNodeActions = useCallback((rawNodes: AppFlowNode[]) => {
        return rawNodes.map((node) => {
            if (node.type === "promptNode") {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        onChange: (value: string) => {
                            setNodes((currentNodes) =>
                                currentNodes.map((n) => {
                                    if (n.id === node.id && n.type === "promptNode") {
                                        return {
                                            ...n,
                                            data: {
                                                ...n.data,
                                                content: value,
                                            },
                                        } satisfies PromptFlowNode;
                                    }

                                    if (n.type === "imageGeneratorNode") {
                                        return {
                                            ...n,
                                            data: {
                                                ...n.data,
                                                prompt: value,
                                            },
                                        } satisfies ImageGeneratorFlowNode;
                                    }

                                    return n;
                                })
                            );
                        },
                    },
                } satisfies PromptFlowNode;
            }

            return node;
        });
    }, [setNodes]);

    useEffect(() => {
        const next =
            template === "image-generator"
                ? getImageGeneratorWorkflow()
                : getEmptyWorkflow();

        setNodes(attachNodeActions(next.nodes));
        setEdges(next.edges);
    }, [template, setNodes, setEdges, attachNodeActions]);

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

    const onConnect = useCallback(
        (params: Connection) => {
            setEdges((eds) =>
                addEdge(
                    {
                        ...params,
                        style: { stroke: "#c9a300", strokeWidth: 3 },
                    },
                    eds
                )
            );
        },
        [setEdges]
    );

    const handlePaneContextMenu = useCallback(
        (event: MouseEvent | React.MouseEvent<Element, MouseEvent>) => {
            event.preventDefault();
            event.stopPropagation();
            openPicker(event.clientX, event.clientY);
        },
        [openPicker]
    );

    const handleAddNode = useCallback(
        (type: "promptNode" | "imageGeneratorNode") => {
            if (!picker) return;

            const id = `${type}-${Date.now()}`;

            const newNode: AppFlowNode =
                type === "promptNode"
                    ? {
                        id,
                        type: "promptNode",
                        position: { x: picker.flowX, y: picker.flowY },
                        data: {
                            label: "Prompt",
                            content: "New prompt...",
                            onChange: (value: string) => {
                                setNodes((currentNodes) =>
                                    currentNodes.map((n) => {
                                        if (n.id === id && n.type === "promptNode") {
                                            return {
                                                ...n,
                                                data: {
                                                    ...n.data,
                                                    content: value,
                                                },
                                            } satisfies PromptFlowNode;
                                        }

                                        if (n.type === "imageGeneratorNode") {
                                            return {
                                                ...n,
                                                data: {
                                                    ...n.data,
                                                    prompt: value,
                                                },
                                            } satisfies ImageGeneratorFlowNode;
                                        }

                                        return n;
                                    })
                                );
                            },
                        },
                    }
                    : {
                        id,
                        type: "imageGeneratorNode",
                        position: { x: picker.flowX, y: picker.flowY },
                        data: {
                            label: "Krea-1",
                            model: "Krea1",
                            prompt: "Prompt appears here...",
                            imageUrl:
                                "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1000&auto=format&fit=crop",
                        },
                    };

            setNodes((nds) => [...nds, newNode]);
            setPicker(null);
        },
        [picker, setNodes]
    );

    return (
        <div className="absolute inset-0">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onInit={(instance) => {
                    reactFlowRef.current = instance;
                }}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onPaneContextMenu={handlePaneContextMenu}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                proOptions={{ hideAttribution: true }}
                defaultEdgeOptions={{
                    style: { stroke: "#c9a300", strokeWidth: 3 },
                }}
            >
                <Background gap={26} size={1} color="rgba(255,255,255,0.08)" />
                <MiniMap
                    pannable
                    zoomable
                    style={{
                        backgroundColor: "#0f1115",
                        border: "1px solid rgba(255,255,255,0.08)",
                    }}
                />
                <Controls
                    style={{
                        backgroundColor: "#111",
                        border: "1px solid rgba(255,255,255,0.08)",
                    }}
                />
            </ReactFlow>

            {nodes.length === 0 && !picker && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="pointer-events-auto text-center text-white/55">
                        <div className="text-4xl font-semibold text-white/75">Add a node</div>
                        <div className="mt-4 text-xl">
                            Right click, or use the button below
                        </div>
                        <button
                            onClick={() => openPicker(window.innerWidth / 2, window.innerHeight / 2)}
                            className="mt-6 rounded-xl bg-white/10 px-4 py-3 text-white hover:bg-white/15"
                        >
                            Open Node Picker
                        </button>
                    </div>
                </div>
            )}

            {picker && (
                <NodePicker
                    x={picker.x}
                    y={picker.y}
                    onSelect={handleAddNode}
                    onClose={() => setPicker(null)}
                />
            )}
        </div>
    );
}