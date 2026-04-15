"use client";

type NodePickerProps = {
    x: number;
    y: number;
    onSelect: (type: "promptNode" | "imageGeneratorNode") => void;
    onClose: () => void;
};

const nodeOptions = [
    {
        type: "promptNode" as const,
        title: "Prompt Node",
        subtitle: "Text prompt input node",
    },
    {
        type: "imageGeneratorNode" as const,
        title: "Image Generator Node",
        subtitle: "Generate image output",
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
            className="absolute z-30 w-[260px] rounded-2xl border border-white/10 bg-[#111] p-3 shadow-2xl"
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