"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CropImageFlowNode } from "@/types/workflow";
import { getRunClass } from "@/lib/node-run-style";

export function CropImageNode({ data }: NodeProps<CropImageFlowNode>) {
    return (
        <div
            className={`relative w-[300px] rounded-[18px] border border-[#60a5fa] bg-[#1b1f26] ${getRunClass(
                data.runStatus
            )}`}
        >


            <div className="node-drag-handle flex cursor-grab items-center justify-between px-4 pt-3 text-[12px] text-white/55 active:cursor-grabbing">
                <span>{data.label || "Crop Image"}</span>
                <span>{data.runStatus === "running" ? "Running..." : "Image"}</span>
            </div>

            <div className="px-4 pb-4 pt-3">
                <div className="rounded-[12px] bg-[#14181f] p-3 text-sm text-white/45">
                    {data.imageConnected ? "Image connected" : "Waiting for image input..."}
                </div>

                {data.imageUrl ? (
                    <div className="mt-4 overflow-hidden rounded-[12px] bg-[#14181f]">
                        <img
                            src={data.imageUrl}
                            alt="Cropped output"
                            className="h-[180px] w-full object-cover"
                        />
                    </div>
                ) : null}

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <Field
                        label="x %"
                        value={data.xPercent ?? "0"}
                        disabled={false}
                        onChange={(value) => data.onFieldChange?.("xPercent", value)}
                    />
                    <Field
                        label="y %"
                        value={data.yPercent ?? "0"}
                        disabled={false}
                        onChange={(value) => data.onFieldChange?.("yPercent", value)}
                    />
                    <Field
                        label="width %"
                        value={data.widthPercent ?? "100"}
                        disabled={false}
                        onChange={(value) => data.onFieldChange?.("widthPercent", value)}
                    />
                    <Field
                        label="height %"
                        value={data.heightPercent ?? "100"}
                        disabled={false}
                        onChange={(value) => data.onFieldChange?.("heightPercent", value)}
                    />
                </div>
            </div>

            <Handle
                id="image_url"
                type="target"
                position={Position.Left}
                className="!h-3.5 !w-3.5 !border-0 !bg-[#1e7bff]"
                style={{ top: 70 }}
            />
            <Handle
                id="image-output"
                type="source"
                position={Position.Right}
                className="!h-3.5 !w-3.5 !border-0 !bg-[#60a5fa]"
                style={{ top: 70 }}
            />
        </div>
    );
}

function Field({
    label,
    value,
    disabled,
    onChange,
}: {
    label: string;
    value: string;
    disabled: boolean;
    onChange: (value: string) => void;
}) {
    return (
        <div className="nodrag nopan">
            <div className="mb-1 text-[12px] text-white/55">{label}</div>


            <input
                type="text"
                inputMode="decimal"
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className={`nodrag nopan w-full rounded-[10px] px-3 py-2 text-sm outline-none ${disabled
                    ? "bg-[#10141a] text-white/35"
                    : "bg-[#14181f] text-white"
                    }`}
            />
        </div>
    );
}