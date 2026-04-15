"use client";

import { useState, type ReactNode } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
    ChevronDown,
    Copy,
    Download,
    Expand,
    Link2,
    Paperclip,
} from "lucide-react";
import type { ImageGeneratorFlowNode } from "@/types/workflow";

export function ImageGeneratorNode({
    data,
}: NodeProps<ImageGeneratorFlowNode>) {
    const [settingsOpen, setSettingsOpen] = useState(true);

    return (
        <div className="relative w-[300px] overflow-hidden rounded-[18px] border border-[#1e7bff] bg-[#1b1f26] shadow-[0_0_0_1px_rgba(30,123,255,0.28)]">
            <div className="flex items-center justify-between px-4 pt-3 text-[12px] text-white/55">
                <span>{data.label || "Krea-1"}</span>
                <span>6 CU ⓘ</span>
            </div>

            <div className="px-3 pb-4 pt-2">
                <div className="relative overflow-hidden rounded-[14px]">
                    <img
                        src={
                            data.imageUrl ||
                            "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1000&auto=format&fit=crop"
                        }
                        alt="Generated result"
                        className="h-[250px] w-full object-cover"
                    />

                    <div className="absolute right-3 top-3 flex items-center gap-3 text-white">
                        <button className="rounded-full bg-black/20 p-1.5 backdrop-blur-sm hover:bg-black/35">
                            <Link2 className="h-4 w-4" />
                        </button>
                        <button className="rounded-full bg-black/20 p-1.5 backdrop-blur-sm hover:bg-black/35">
                            <Download className="h-4 w-4" />
                        </button>
                        <button className="rounded-full bg-black/20 p-1.5 backdrop-blur-sm hover:bg-black/35">
                            <Expand className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="relative mt-3 rounded-[12px] bg-[#20252d] p-3">
                    {/* <div className="absolute right-[-18px] top-[12px] flex items-center gap-2 text-[12px] text-white/45">
                        <span>Image</span>
                    </div> */}

                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-[12px] text-white/55">Model</span>
                    </div>

                    <button className="flex w-full items-center justify-between rounded-[9px] bg-[#11151b] px-3 py-2 text-sm text-white">
                        <span>✦ {data.model || "Krea 1"}</span>
                        <ChevronDown className="h-4 w-4 text-white/55" />
                    </button>

                    <div className="mt-3 text-[12px] text-white/55">Prompt</div>
                    <div className="mt-2 min-h-[110px] rounded-[10px] bg-[#14181f] p-3 text-sm text-white/45">
                        {data.prompt || "A serene landscape with mountains"}
                    </div>

                    <button
                        type="button"
                        onClick={() => setSettingsOpen((prev) => !prev)}
                        className="mt-4 flex w-full items-center justify-between text-[12px] text-white/55 hover:text-white"
                    >
                        <span className="flex items-center gap-2">
                            {/* <span>{settingsOpen ? "⌄" : "›"}</span> */}
                            <span>Settings</span>
                        </span>
                        <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform ${settingsOpen ? "rotate-0" : "-rotate-90"
                                }`}
                        />
                    </button>

                    {settingsOpen && (
                        <div className="relative mt-3 space-y-3">
                            {/* Real input handles aligned to settings rows */}
                            <Handle
                                id="imagePrompt"
                                type="target"
                                position={Position.Left}
                                className="!h-3.5 !w-3.5 !border-0 !bg-[#1e7bff]"
                                style={{ top: 12, left: -18 }}
                            />
                            <Handle
                                id="style"
                                type="target"
                                position={Position.Left}
                                className="!h-3.5 !w-3.5 !border-0 !bg-[#ff2f92]"
                                style={{ top: 55, left: -18 }}
                            />
                            <Handle
                                id="styleImage"
                                type="target"
                                position={Position.Left}
                                className="!h-3.5 !w-3.5 !border-0 !bg-[#1e7bff]"
                                style={{ top: 98, left: -18 }}
                            />
                            <Handle
                                id="raw"
                                type="target"
                                position={Position.Left}
                                className="!h-3.5 !w-3.5 !border !border-white/30 !bg-white"
                                style={{ top: 141, left: -18 }}
                            />
                            <Handle
                                id="seed"
                                type="target"
                                position={Position.Left}
                                className="!h-3.5 !w-3.5 !border-0 !bg-[#d95cff]"
                                style={{ top: 184, left: -18 }}
                            />
                            <Handle
                                id="aspectRatio"
                                type="target"
                                position={Position.Left}
                                className="!h-3.5 !w-3.5 !border-0 !bg-[#666]"
                                style={{ top: 227, left: -18 }}
                            />
                            <Handle
                                id="resolution"
                                type="target"
                                position={Position.Left}
                                className="!h-3.5 !w-3.5 !border-0 !bg-[#666]"
                                style={{ top: 270, left: -18 }}
                            />

                            <SettingRow
                                label="Image Prompt"
                                right={
                                    <button className="flex items-center gap-2 rounded-[8px] bg-[#11151b] px-3 py-2 text-[12px] text-white/65">
                                        Add file
                                        <Paperclip className="h-3.5 w-3.5" />
                                    </button>
                                }
                            />

                            <SettingRow
                                label="Style"
                                right={
                                    <button className="flex items-center gap-2 rounded-[8px] bg-[#11151b] px-3 py-2 text-[12px] text-white/45">
                                        Select style
                                        <span className="text-white/30">⊘</span>
                                    </button>
                                }
                            />

                            <SettingRow
                                label="Style Image"
                                right={
                                    <button className="flex items-center gap-2 rounded-[8px] bg-[#11151b] px-3 py-2 text-[12px] text-white/65">
                                        Add file
                                        <Paperclip className="h-3.5 w-3.5" />
                                    </button>
                                }
                            />

                            <SettingRow
                                label="Raw"
                                right={
                                    <div className="flex h-6 w-11 items-center rounded-full bg-[#11151b] px-1">
                                        <div className="ml-auto h-4 w-4 rounded-full bg-white" />
                                    </div>
                                }
                            />

                            <SettingRow
                                label="Seed"
                                right={
                                    <div className="flex items-center gap-2">
                                        <div className="rounded-[8px] bg-[#11151b] px-3 py-2 text-[12px] text-white">
                                            895300
                                        </div>
                                        <button className="rounded-[8px] bg-[#11151b] p-2 text-white/60">
                                            <Copy className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                }
                            />

                            <SettingRow
                                label="Aspect Ratio"
                                right={
                                    <button className="flex min-w-[78px] items-center justify-between rounded-[8px] bg-[#11151b] px-3 py-2 text-[12px] text-white">
                                        <span>1:1</span>
                                        <ChevronDown className="h-3.5 w-3.5 text-white/55" />
                                    </button>
                                }
                            />

                            <SettingRow
                                label="Resolution"
                                right={
                                    <button className="flex min-w-[78px] items-center justify-between rounded-[8px] bg-[#11151b] px-3 py-2 text-[12px] text-white">
                                        <span>1K</span>
                                        <ChevronDown className="h-3.5 w-3.5 text-white/55" />
                                    </button>
                                }
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Main handles */}
            <Handle
                id="prompt"
                type="target"
                position={Position.Left}
                className="!h-3.5 !w-3.5 !border-0 !bg-[#e5b800]"
                style={{ top: 356 }}
            />
            <Handle
                id="image"
                type="source"
                position={Position.Right}
                className="!h-3.5 !w-3.5 !border-0 !bg-[#1e7bff]"
                style={{ top: 232 }}
            />
        </div>
    );
}

function SettingRow({
    label,
    right,
}: {
    label: string;
    right: ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-3 pl-5">
            <span className="text-[12px] text-white/55">{label}</span>
            {right}
        </div>
    );
}