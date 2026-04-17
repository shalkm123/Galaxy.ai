"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { TextFlowNode } from "@/types/workflow";
import { getRunClass } from "@/lib/node-run-style";

export function TextNode({ data }: NodeProps<TextFlowNode>) {
    const value = data.resolvedContent ?? data.content ?? "";
    const disabled = !!data.contentConnected;

    return (
        <div
            className={`relative w-[260px] rounded-[16px] border border-white/15 bg-[#1b1f26] ${getRunClass(
                data.runStatus
            )}`}
        >
            <div className="node-drag-handle flex cursor-grab items-center justify-between px-4 pt-3 text-[12px] text-white/55 active:cursor-grabbing">
                <span>{data.label || "Text Node"}</span>
                <span>{data.runStatus === "running" ? "Running..." : "Output"}</span>
            </div>

            <div className="px-4 pb-4 pt-2">
                <textarea
                    value={value}
                    disabled={disabled}
                    onChange={(e) => data.onChange?.(e.target.value)}
                    placeholder="Enter text..."
                    className={`nodrag nopan min-h-[120px] w-full resize-none rounded-[12px] p-3 text-sm outline-none placeholder:text-white/35 ${
                        disabled ? "bg-[#10141a] text-white/35" : "bg-[#14181f] text-white"
                    }`}
                />
            </div>

            <Handle
                id="text-output"
                type="source"
                position={Position.Right}
                className="!h-3.5 !w-3.5 !border-0 !bg-white"
            />
        </div>
    );
}