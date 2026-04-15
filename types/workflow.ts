import type { Edge, Node } from "@xyflow/react";

export type PromptNodeData = {
    label?: string;
    content?: string;
    onChange?: (value: string) => void;
};

export type ImageGeneratorNodeData = {
    label?: string;
    imageUrl?: string;
    model?: string;
    prompt?: string;
};

export type PromptFlowNode = Node<PromptNodeData, "promptNode">;
export type ImageGeneratorFlowNode = Node<
    ImageGeneratorNodeData,
    "imageGeneratorNode"
>;

export type AppFlowNode = PromptFlowNode | ImageGeneratorFlowNode;
export type WorkflowEdge = Edge;