import type { Edge, Node } from "@xyflow/react";

export type NodeRuntimeStatus = "idle" | "pending" | "running" | "success" | "failed";

export type NodeRuntimeData = {
    runStatus?: NodeRuntimeStatus;
    output?: string;
    error?: string;
    durationMs?: number;
};

export type PromptNodeData = NodeRuntimeData & {
    label?: string;
    content?: string;
    resolvedContent?: string;
    contentConnected?: boolean;
    onChange?: (value: string) => void;
};

export type ImageGeneratorNodeData = NodeRuntimeData & {
    label?: string;
    imageUrl?: string;
    model?: string;
    prompt?: string;
    resolvedPrompt?: string;
    promptConnected?: boolean;
    imagePromptConnected?: boolean;
    onPromptChange?: (value: string) => void;
};

export type TextNodeData = NodeRuntimeData & {
    label?: string;
    content?: string;
    resolvedContent?: string;
    contentConnected?: boolean;
    onChange?: (value: string) => void;
};

export type UploadImageNodeData = NodeRuntimeData & {
    label?: string;
    imageUrl?: string;
    onUpload?: (file: File) => void;
};

export type UploadVideoNodeData = NodeRuntimeData & {
    label?: string;
    videoUrl?: string;
    onUpload?: (file: File) => void;
};

export type LlmNodeData = NodeRuntimeData & {
    label?: string;
    model?: string;
    systemPrompt?: string;
    userMessage?: string;
    output?: string;
    resolvedSystemPrompt?: string;
    resolvedUserMessage?: string;
    systemPromptConnected?: boolean;
    userMessageConnected?: boolean;
    imagesConnected?: boolean;
    onSystemPromptChange?: (value: string) => void;
    onUserMessageChange?: (value: string) => void;
};

export type CropImageNodeData = NodeRuntimeData & {
    label?: string;
    imageUrl?: string;
    imageConnected?: boolean;
    xPercent?: string;
    yPercent?: string;
    widthPercent?: string;
    heightPercent?: string;
    onFieldChange?: (field: string, value: string) => void;
};

export type ExtractFrameNodeData = NodeRuntimeData & {
    label?: string;
    videoUrl?: string;
    videoConnected?: boolean;
    timestamp?: string;
    outputImageUrl?: string;
    onTimestampChange?: (value: string) => void;
};

export type PromptFlowNode = Node<PromptNodeData, "promptNode">;
export type ImageGeneratorFlowNode = Node<ImageGeneratorNodeData, "imageGeneratorNode">;
export type TextFlowNode = Node<TextNodeData, "textNode">;
export type UploadImageFlowNode = Node<UploadImageNodeData, "uploadImageNode">;
export type UploadVideoFlowNode = Node<UploadVideoNodeData, "uploadVideoNode">;
export type LlmFlowNode = Node<LlmNodeData, "llmNode">;
export type CropImageFlowNode = Node<CropImageNodeData, "cropImageNode">;
export type ExtractFrameFlowNode = Node<ExtractFrameNodeData, "extractFrameNode">;

export type AppFlowNode =
    | PromptFlowNode
    | ImageGeneratorFlowNode
    | TextFlowNode
    | UploadImageFlowNode
    | UploadVideoFlowNode
    | LlmFlowNode
    | CropImageFlowNode
    | ExtractFrameFlowNode;

export type WorkflowEdge = Edge;