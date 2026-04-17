"use client";

import { Upload, Video } from "lucide-react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { UploadVideoFlowNode } from "@/types/workflow";
import { getRunClass } from "@/lib/node-run-style";

export function UploadVideoNode({ data }: NodeProps<UploadVideoFlowNode>) {
    return (
        <div
            className={`relative w-[280px] rounded-[16px] border border-[#ff9f1a] bg-[#1b1f26] ${getRunClass(
                data.runStatus
            )}`}
        >
            <div className="node-drag-handle flex cursor-grab items-center justify-between px-4 pt-3 text-[12px] text-white/55 active:cursor-grabbing">
                <span>{data.label || "Upload Video"}</span>
                <span>{data.runStatus === "running" ? "Running..." : "Video"}</span>
            </div>

            <div className="px-4 pb-4 pt-3">
                <label className="nodrag nopan flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[12px] border border-dashed border-white/15 bg-[#14181f] text-white/55 hover:bg-[#181d25]">
                    {data.videoUrl ? (
                        <video
                            src={data.videoUrl}
                            controls
                            className="h-full w-full rounded-[12px] object-cover"
                        />
                    ) : (
                        <>
                            <Video className="mb-3 h-8 w-8" />
                            <div className="text-sm">Upload video</div>
                            <div className="mt-1 text-xs text-white/35">
                                mp4, mov, webm, m4v
                            </div>
                        </>
                    )}

                    <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) data.onUpload?.(file);
                        }}
                    />
                </label>

                <div className="mt-3 flex items-center gap-2 text-xs text-white/45">
                    <Upload className="h-3.5 w-3.5" />
                    Output handle returns video URL
                </div>
            </div>

            <Handle
                id="video-output"
                type="source"
                position={Position.Right}
                className="!h-3.5 !w-3.5 !border-0 !bg-[#ff9f1a]"
            />
        </div>
    );
}