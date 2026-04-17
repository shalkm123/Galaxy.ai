"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ImageGeneratorFlowNode } from "@/types/workflow";
import { getRunClass } from "@/lib/node-run-style";

export function ImageGeneratorNode({ data }: NodeProps<ImageGeneratorFlowNode>) {
    const prompt = data.resolvedPrompt ?? data.prompt ?? "";
    const promptDisabled = !!data.promptConnected;

    return (
        <div
            className={`relative w-[285px] overflow-hidden rounded-[18px] border border-[#1e7bff] bg-[#1b1f26] ${getRunClass(
                data.runStatus
            )}`}
        >
            <div className="node-drag-handle flex cursor-grab items-center justify-between px-4 pt-3 text-[12px] text-white/55 active:cursor-grabbing">
                <span>{data.label || "Krea-1"}</span>
                <span>{data.runStatus === "running" ? "Running..." : "Image"}</span>
            </div>

            <div className="px-4 pb-4 pt-2">
                <div className="overflow-hidden rounded-[12px] bg-[#14181f]">
                    {data.imageUrl ? (
                        <img
                            src={data.imageUrl}
                            alt="Generated output"
                            className="h-[190px] w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-[190px] items-center justify-center text-sm text-white/35">
                            Generated image preview
                        </div>
                    )}
                </div>

                <div className="mt-3 rounded-[10px] bg-[#20252d] p-3">
                    <div className="mb-2 flex items-center justify-between text-[12px] text-white/55">
                        <span>Model</span>
                        <span>Image</span>
                    </div>

                    <button className="nodrag nopan w-full rounded-[8px] bg-[#11151b] px-3 py-2 text-left text-sm text-white">
                        {data.model || "Krea1"}
                    </button>

                    <div className="mt-3 text-[12px] text-white/55">
                        Prompt {promptDisabled ? "(connected)" : ""}
                    </div>

                    <textarea
                        value={prompt}
                        disabled={promptDisabled}
                        onChange={(e) => data.onPromptChange?.(e.target.value)}
                        placeholder="Describe the image you want to generate..."
                        className={`nodrag nopan mt-2 min-h-[88px] w-full resize-none rounded-[10px] p-3 text-sm outline-none placeholder:text-white/35 ${
                            promptDisabled
                                ? "bg-[#10141a] text-white/35"
                                : "bg-[#14181f] text-white"
                        }`}
                    />

                    <div className="mt-3 text-[12px] text-white/35">› Settings</div>
                </div>
            </div>

            <Handle
                id="prompt"
                type="target"
                position={Position.Left}
                className="!h-3.5 !w-3.5 !border-0 !bg-[#e5b800]"
                style={{ top: 230 }}
            />
            <Handle
                id="image-output"
                type="source"
                position={Position.Right}
                className="!h-3.5 !w-3.5 !border-0 !bg-[#1e7bff]"
                style={{ top: 230 }}
            />
        </div>
    );
}