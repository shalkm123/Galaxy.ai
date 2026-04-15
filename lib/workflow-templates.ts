import type {
    AppFlowNode,
    WorkflowEdge,
} from "@/types/workflow";

export function getEmptyWorkflow() {
    return {
        nodes: [] as AppFlowNode[],
        edges: [] as WorkflowEdge[],
    };
}

export function getImageGeneratorWorkflow() {
    const nodes: AppFlowNode[] = [
        {
            id: "prompt-1",
            type: "promptNode",
            position: { x: 120, y: 140 },
            data: {
                label: "Prompt",
                content: "A serene landscape with mountains",
            },
        },
        {
            id: "image-gen-1",
            type: "imageGeneratorNode",
            position: { x: 520, y: 140 },
            data: {
                label: "Krea-1",
                model: "Krea1",
                prompt: "A serene landscape with mountains",
                imageUrl:
                    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1000&auto=format&fit=crop",
            },
        },
    ];

    const edges: WorkflowEdge[] = [
        {
            id: "e-prompt-image",
            source: "prompt-1",
            target: "image-gen-1",
            animated: false,
            style: { stroke: "#c9a300", strokeWidth: 3 },
        },
    ];

    return { nodes, edges };
}