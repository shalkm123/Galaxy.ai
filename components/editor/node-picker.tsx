"use client";

type NodePickerProps = {
    x: number;
    y: number;
    onSelect: (
        type:
            | "promptNode"
            | "imageGeneratorNode"
            | "textNode"
            | "uploadImageNode"
            | "uploadVideoNode"
            | "llmNode"
            | "cropImageNode"
            | "extractFrameNode"
    ) => void;
    onClose: () => void;
};

const nodeOptions = [
    {
        type: "textNode" as const,
        title: "Text Node",
        subtitle: "Simple text node",
    },
    {
        type: "uploadImageNode" as const,
        title: "Upload Image Node",
        subtitle: "Upload and preview image",
    },
    {
        type: "uploadVideoNode" as const,
        title: "Upload Video Node",
        subtitle: "Upload and preview video",
    },
    {
        type: "llmNode" as const,
        title: "Run Any LLM Node",
        subtitle: "System prompt + user message + images",
    },
    {
        type: "cropImageNode" as const,
        title: "Crop Image Node",
        subtitle: "Crop image with x/y/width/height %",
    },
    {
        type: "extractFrameNode" as const,
        title: "Extract Frame Node",
        subtitle: "Extract single frame from video",
    },
    {
        type: "imageGeneratorNode" as const,
        title: "Image Generator Node",
        subtitle: "Generate image output",
    },
    {
        type: "promptNode" as const,
        title: "Prompt Node",
        subtitle: "Prompt input node",
    },
];

export function NodePicker({
    x,
    y,
    onSelect,
    onClose,
}: NodePickerProps) {
    return (
        <div
            className="absolute z-30 w-[300px] rounded-2xl border border-white/10 bg-[#111] p-3 shadow-2xl"
            style={{ left: x, top: y }}
        >
            <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium text-white">Add node</div>
                <button
                    onClick={onClose}
                    className="text-sm text-white/50 hover:text-white"
                >
                    ✕
                </button>
            </div>

            <div className="space-y-2">
                {nodeOptions.map((node) => (
                    <button
                        key={node.type}
                        onClick={() => onSelect(node.type)}
                        className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-3 text-left transition hover:bg-white/10"
                    >
                        <div className="text-sm font-medium text-white">{node.title}</div>
                        <div className="mt-1 text-xs text-white/45">{node.subtitle}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}