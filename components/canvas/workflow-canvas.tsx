"use client";

import {
    Background,
    Controls,
    MiniMap,
    ReactFlow,
    type Edge,
    type Node,
} from "@xyflow/react";

const initialNodes: Node[] = [
    {
        id: "1",
        position: { x: 100, y: 100 },
        data: { label: "Text Node" },
        type: "default",
    },
    {
        id: "2",
        position: { x: 420, y: 100 },
        data: { label: "LLM Node" },
        type: "default",
    },
];

const initialEdges: Edge[] = [
    {
        id: "e1-2",
        source: "1",
        target: "2",
    },
];

export function WorkflowCanvas() {
    return (
        <div className="h-screen w-full bg-[#050505]">
            <ReactFlow nodes={initialNodes} edges={initialEdges} fitView>
                <Background gap={24} size={1} />
                <MiniMap />
                <Controls />
            </ReactFlow>
        </div>
    );
}