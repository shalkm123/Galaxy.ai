"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { PromptFlowNode } from "@/types/workflow";
import { getRunClass } from "@/lib/node-run-style";

export function PromptNode({ data }: NodeProps<PromptFlowNode>) {
    const value = data.resolvedContent ?? data.content ?? "";
    const disabled = !!data.contentConnected;

    return (
        <div
            className={`relative w-[260px] rounded-[16px] border border-[#e5b800] bg-[#1b1f26] ${getRunClass(
                data.runStatus
            )}`}
        >
            <div className="node-drag-handle flex cursor-grab items-center justify-between px-4 pt-3 text-[12px] text-white/55 active:cursor-grabbing">
                <span className="text-[#e5b800]">∫ {data.label || "Prompt"}</span>
                <span>{data.runStatus === "running" ? "Running..." : "Output"}</span>
            </div>

            <div className="px-4 pb-4 pt-2">
                <div className="mb-2 text-[12px] text-white/45">
                    Input {disabled ? "(connected)" : ""}
                </div>
                <textarea
                    value={value}
                    disabled={disabled}
                    onChange={(e) => data.onChange?.(e.target.value)}
                    placeholder="Enter prompt..."
                    className={`nodrag nopan min-h-[110px] w-full resize-none rounded-[12px] p-3 text-sm outline-none placeholder:text-white/35 ${
                        disabled ? "bg-[#10141a] text-white/35" : "bg-[#14181f] text-white"
                    }`}
                />
            </div>

            <Handle
                id="prompt-input"
                type="target"
                position={Position.Left}
                className="!h-3.5 !w-3.5 !border-0 !bg-[#e5b800]"
            />
            <Handle
                id="prompt-output"
                type="source"
                position={Position.Right}
                className="!h-3.5 !w-3.5 !border-0 !bg-[#e5b800]"
            />
        </div>
    );
}