"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { UploadVideoFlowNode } from "@/types/workflow";
import { getRunClass } from "@/lib/node-run-style";

export function UploadVideoNode({ data }: NodeProps<UploadVideoFlowNode>) {
    return (
        <div
            className={`relative w-[300px] rounded-[18px] border border-[#ff9f1a] bg-[#1b1f26] ${getRunClass(
                data.runStatus
            )}`}
        >
            <div className="node-drag-handle flex cursor-grab items-center justify-between px-4 pt-3 text-[12px] text-white/55 active:cursor-grabbing">
                <span>{data.label || "Upload Video"}</span>
                <span>{data.runStatus === "running" ? "Running..." : "Video"}</span>
            </div>

            <div className="px-4 pb-4 pt-3">
                <label className="block cursor-pointer rounded-[12px] bg-[#14181f] p-4 text-sm text-white/60 hover:bg-[#1a2028]">
                    <div>Choose video</div>
                    <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                data.onUpload?.(file);
                            }
                        }}
                    />
                </label>

                {data.videoUrl ? (
                    <div className="mt-4 overflow-hidden rounded-[12px] bg-[#14181f] p-2">
                        <video
                            src={data.videoUrl}
                            controls
                            className="w-full rounded-[10px]"
                        />
                    </div>
                ) : (
                    <div className="mt-4 rounded-[12px] bg-[#14181f] p-3 text-sm text-white/35">
                        Uploaded video preview will appear here...
                    </div>
                )}
            </div>

            <Handle
                id="video-output"
                type="source"
                position={Position.Right}
                className="!h-3.5 !w-3.5 !border-0 !bg-[#ff9f1a]"
                style={{ top: 78 }}
            />
        </div>
    );
}