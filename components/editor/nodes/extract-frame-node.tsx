"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ExtractFrameFlowNode } from "@/types/workflow";
import { getRunClass } from "@/lib/node-run-style";

export function ExtractFrameNode({ data }: NodeProps<ExtractFrameFlowNode>) {
    return (
        <div
            className={`relative w-[300px] rounded-[18px] border border-[#f59e0b] bg-[#1b1f26] ${getRunClass(
                data.runStatus
            )}`}
        >
            <div className="node-drag-handle flex cursor-grab items-center justify-between px-4 pt-3 text-[12px] text-white/55 active:cursor-grabbing">
                <span>{data.label || "Extract Frame"}</span>
                <span>{data.runStatus === "running" ? "Running..." : "Image"}</span>
            </div>

            <div className="px-4 pb-4 pt-3">
                <div className="rounded-[12px] bg-[#14181f] p-3 text-sm text-white/45">
                    {data.videoConnected ? "Video connected" : "Waiting for video input..."}
                </div>

                <div className="mt-4">
                    <div className="mb-1 text-[12px] text-white/55">Timestamp</div>
                    <input
                        value={data.timestamp || "0"}
                        onChange={(e) => data.onTimestampChange?.(e.target.value)}
                        className="nodrag nopan w-full rounded-[10px] bg-[#14181f] px-3 py-2 text-sm text-white outline-none"
                    />
                </div>

                <div className="mt-4 rounded-[12px] bg-[#14181f] p-3 text-sm text-white/45">
                    {data.outputImageUrl ? (
                        <img
                            src={data.outputImageUrl}
                            alt="Extracted frame"
                            className="w-full rounded-[10px] object-cover"
                        />
                    ) : (
                        "Output frame preview will appear here..."
                    )}
                </div>
            </div>

            <Handle
                id="video_url"
                type="target"
                position={Position.Left}
                className="!h-3.5 !w-3.5 !border-0 !bg-[#ff9f1a]"
                style={{ top: 70 }}
            />
            <Handle
                id="image-output"
                type="source"
                position={Position.Right}
                className="!h-3.5 !w-3.5 !border-0 !bg-[#f59e0b]"
                style={{ top: 70 }}
            />
        </div>
    );
}