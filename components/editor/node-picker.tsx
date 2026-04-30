"use client";

import {
    Type,
    ImageIcon,
    VideoIcon,
    BrainCircuit,
    Crop,
    Film,
    Sparkles,
    AlignLeft,
    PanelLeftClose,
} from "lucide-react";
import { useState } from "react";
import type React from "react";

// ─────────────────────────────────────────────────────────────
// Shared type
// ─────────────────────────────────────────────────────────────
export type AddableNodeType =
    | "promptNode"
    | "imageGeneratorNode"
    | "textNode"
    | "uploadImageNode"
    | "uploadVideoNode"
    | "llmNode"
    | "cropImageNode"
    | "extractFrameNode";

// ─────────────────────────────────────────────────────────────
// Node catalogue
// ─────────────────────────────────────────────────────────────
const nodeOptions: {
    type: AddableNodeType;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    color: string;
}[] = [
        {
            type: "textNode",
            title: "Text",
            subtitle: "Plain text input",
            icon: Type,
            color: "#6366f1",
        },
        {
            type: "uploadImageNode",
            title: "Upload Image",
            subtitle: "Upload & preview image",
            icon: ImageIcon,
            color: "#0ea5e9",
        },
        {
            type: "uploadVideoNode",
            title: "Upload Video",
            subtitle: "Upload & preview video",
            icon: VideoIcon,
            color: "#8b5cf6",
        },
        {
            type: "llmNode",
            title: "Run LLM",
            subtitle: "Gemini multimodal LLM",
            icon: BrainCircuit,
            color: "#10b981",
        },
        {
            type: "cropImageNode",
            title: "Crop Image",
            subtitle: "Crop with x/y/w/h %",
            icon: Crop,
            color: "#f59e0b",
        },
        {
            type: "extractFrameNode",
            title: "Extract Frame",
            subtitle: "Frame from video",
            icon: Film,
            color: "#ef4444",
        },
        {
            type: "imageGeneratorNode",
            title: "Generate Image",
            subtitle: "AI image generation",
            icon: Sparkles,
            color: "#ec4899",
        },
        {
            type: "promptNode",
            title: "Prompt",
            subtitle: "Prompt input node",
            icon: AlignLeft,
            color: "#a78bfa",
        },
    ];

// ─────────────────────────────────────────────────────────────
// NodeSidebar — persistent collapsible left panel
// ─────────────────────────────────────────────────────────────
type NodeSidebarProps = {
    onAdd: (type: AddableNodeType) => void;
};

export function NodeSidebar({ onAdd }: NodeSidebarProps) {
    const [collapsed, setCollapsed] = useState(false);

    const handleDragStart = (
        e: React.DragEvent<HTMLButtonElement>,
        type: AddableNodeType
    ) => {
        e.dataTransfer.setData("application/reactflow-node-type", type);
        e.dataTransfer.effectAllowed = "move";
    };

    return (
        <aside
            className={`relative flex h-full flex-shrink-0 flex-col overflow-visible border-r border-white/[0.07] bg-[#0c0c0e] transition-[width] duration-300 ease-in-out ${collapsed ? "w-[56px]" : "w-[220px]"
                }`}
        >
            {/* Floating collapse / expand toggle */}
            <button
                type="button"
                onClick={() => setCollapsed((current) => !current)}
                className="absolute -right-3 top-4 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#15161a] text-white/60 shadow-xl transition-all duration-150 hover:border-white/20 hover:bg-[#1d1f25] hover:text-white"
                title={collapsed ? "Expand nodes panel" : "Collapse nodes panel"}
                aria-label={collapsed ? "Expand nodes panel" : "Collapse nodes panel"}
            >
                <PanelLeftClose
                    size={14}
                    className="transition-transform duration-300 ease-in-out"
                    style={{
                        transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                />
            </button>

            {/* Header */}
            <div
                className={`flex min-h-[48px] items-center border-b border-white/[0.07] px-3 py-3 ${collapsed ? "justify-center" : "justify-between"
                    }`}
            >
                {!collapsed ? (
                    <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-white/30">
                        Nodes
                    </span>
                ) : null}
            </div>

            {/* Node list */}
            <div
                className={`flex flex-1 flex-col overflow-y-auto overflow-x-visible py-2 ${collapsed ? "items-center gap-3 px-2" : "gap-2 px-2"
                    }`}
            >
                {nodeOptions.map(({ type, title, subtitle, icon: Icon, color }) => (
                    <div key={type} className="group/item relative w-full">
                        <button
                            type="button"
                            draggable
                            onDragStart={(e) => handleDragStart(e, type)}
                            onClick={() => onAdd(type)}
                            className={`flex w-full cursor-grab items-center rounded-xl border border-transparent text-left transition-all duration-150 hover:border-white/[0.08] hover:bg-white/[0.05] active:cursor-grabbing ${collapsed
                                    ? "justify-center px-0 py-2"
                                    : "gap-2.5 px-3 py-[10px]"
                                }`}
                            title={collapsed ? title : undefined}
                        >
                            <span
                                className={`flex flex-shrink-0 items-center justify-center rounded-[10px] ${collapsed ? "h-[34px] w-[34px]" : "h-[34px] w-[40px]"
                                    }`}
                                style={{
                                    backgroundColor: `${color}1a`,
                                    border: `1px solid ${color}40`,
                                }}
                            >
                                <Icon size={16} style={{ color }} />
                            </span>

                            {!collapsed ? (
                                <span className="min-w-0 overflow-hidden">
                                    <span className="block truncate text-[13px] font-medium text-white/75 group-hover/item:text-white/95">
                                        {title}
                                    </span>
                                    <span className="mt-[1px] block truncate text-[11px] text-white/[0.32]">
                                        {subtitle}
                                    </span>
                                </span>
                            ) : null}
                        </button>

                        {collapsed ? (
                            <div className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#1c1c1f] px-2.5 py-1.5 text-[12px] text-white/85 opacity-0 shadow-xl transition-opacity duration-150 group-hover/item:opacity-100">
                                {title}
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>
        </aside>
    );
}

// ─────────────────────────────────────────────────────────────
// NodePicker — context-menu popup
// ─────────────────────────────────────────────────────────────
type NodePickerProps = {
    x: number;
    y: number;
    onSelect: (type: AddableNodeType) => void;
    onClose: () => void;
};

export function NodePicker({ x, y, onSelect, onClose }: NodePickerProps) {
    return (
        <div
            className="absolute z-30 w-[300px] rounded-2xl border border-white/10 bg-[#111] p-3 shadow-2xl"
            style={{ left: x, top: y }}
        >
            <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium text-white">Add node</div>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-sm text-white/50 hover:text-white"
                >
                    ✕
                </button>
            </div>

            <div className="space-y-1.5">
                {nodeOptions.map(({ type, title, subtitle, icon: Icon, color }) => (
                    <button
                        key={type}
                        type="button"
                        onClick={() => onSelect(type)}
                        className="group flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5 text-left transition hover:bg-white/[0.09]"
                    >
                        <span
                            className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px]"
                            style={{
                                backgroundColor: `${color}1a`,
                                border: `1px solid ${color}40`,
                            }}
                        >
                            <Icon size={16} style={{ color }} />
                        </span>

                        <span>
                            <span className="block text-[13px] font-medium text-white">
                                {title}
                            </span>
                            <span className="mt-[1px] block text-[11px] text-white/40">
                                {subtitle}
                            </span>
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}