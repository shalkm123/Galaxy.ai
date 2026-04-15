"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { PromptFlowNode } from "@/types/workflow";

export function PromptNode({ data }: NodeProps<PromptFlowNode>) {
    return (
        <div className="relative w-[260px] rounded-[16px] border border-[#e5b800] bg-[#1b1f26] shadow-[0_0_0_1px_rgba(229,184,0,0.25)]">
            <div className="flex items-center justify-between px-4 pt-3 text-[12px] text-white/55">
                <span className="text-[#e5b800]">∫ {data.label || "Prompt"}</span>
                <span>Output</span>
            </div>

            <div className="px-4 pb-4 pt-2">
                <div className="mb-2 text-[12px] text-white/45">Input</div>

                <textarea
                    value={data.content || ""}
                    onChange={(e) => data.onChange?.(e.target.value)}
                    placeholder="Enter prompt..."
                    className="min-h-[110px] w-full resize-none rounded-[12px] bg-[#14181f] p-3 text-sm text-white outline-none placeholder:text-white/35"
                />
            </div>

            <Handle
                type="target"
                position={Position.Left}
                className="!h-3.5 !w-3.5 !border-0 !bg-[#e5b800]"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="!h-3.5 !w-3.5 !border-0 !bg-[#e5b800]"
            />
        </div>
    );
}