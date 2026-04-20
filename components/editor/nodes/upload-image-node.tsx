"use client";

import { ImageIcon, Upload } from "lucide-react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { UploadImageFlowNode } from "@/types/workflow";
import { getRunClass } from "@/lib/node-run-style";

export function UploadImageNode({ data }: NodeProps<UploadImageFlowNode>) {
    return (
        <div
            className={`relative w-[280px] rounded-[16px] border border-[#1e7bff] bg-[#1b1f26] ${getRunClass(
                data.runStatus
            )}`}
        >

            <div className="node-drag-handle flex cursor-grab items-center justify-between px-4 pt-3 text-[12px] text-white/55 active:cursor-grabbing">
                <span>{data.label || "Upload Image"}</span>
                <span>{data.runStatus === "running" ? "Running..." : "Image"}</span>
            </div>

            <div className="px-4 pb-4 pt-3">
                <label className="nodrag nopan flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[12px] border border-dashed border-white/15 bg-[#14181f] text-white/55 hover:bg-[#181d25]">
                    {data.imageUrl ? (
                        <img
                            src={data.imageUrl}
                            alt="Uploaded preview"
                            className="h-full w-full rounded-[12px] object-cover"
                        />
                    ) : (
                        <>
                            <ImageIcon className="mb-3 h-8 w-8" />
                            <div className="text-sm">Upload image</div>
                            <div className="mt-1 text-xs text-white/35">
                                jpg, jpeg, png, webp, gif
                            </div>
                        </>
                    )}

                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) data.onUpload?.(file);
                        }}
                    />
                </label>

                <div className="mt-3 flex items-center gap-2 text-xs text-white/45">
                    <Upload className="h-3.5 w-3.5" />
                    Output handle returns image URL
                </div>
            </div>

            <Handle
                id="image-output"
                type="source"
                position={Position.Right}
                className="!h-3.5 !w-3.5 !border-0 !bg-[#1e7bff]"
            />
        </div>
    );
}