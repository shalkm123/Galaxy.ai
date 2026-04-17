"use client";

import {
    Undo2,
    Redo2,
    Plus,
    MousePointer2,
    Hand,
    Scissors,
    LayoutGrid,
    Link2,
} from "lucide-react";

export function EditorBottombar() {
    return (
        <>
            <div className="absolute bottom-5 left-4 z-20 flex items-center gap-1.5">
                <button className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-white/10 bg-white/7 text-white/55 transition hover:bg-white/11 hover:text-white">
                    <Undo2 className="h-3.5 w-3.5" />
                </button>
                <button className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-white/10 bg-white/7 text-white/55 transition hover:bg-white/11 hover:text-white">
                    <Redo2 className="h-3.5 w-3.5" />
                </button>
                <button className="flex items-center gap-1.5 rounded-[9px] border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px] text-white/45 transition hover:text-white/75">
                    <kbd className="text-[11px]">⌘</kbd> Keyboard shortcuts
                </button>
            </div>

            <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-[13px] border border-white/10 bg-[rgba(20,20,20,0.9)] p-1.5 backdrop-blur-xl">
                <button
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent("editor:add-node"));
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-[8px] text-white/55 transition hover:bg-white/10 hover:text-white"
                    title="Add node"
                >
                    <Plus className="h-4 w-4" />
                </button>

                <div className="mx-1 h-5 w-px bg-white/10" />

                <button className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-white/14 text-white transition hover:bg-white/18">
                    <MousePointer2 className="h-3.5 w-3.5" />
                </button>
                <button className="flex h-9 w-9 items-center justify-center rounded-[8px] text-white/55 transition hover:bg-white/10 hover:text-white">
                    <Hand className="h-3.5 w-3.5" />
                </button>

                <div className="mx-1 h-5 w-px bg-white/10" />

                <button className="flex h-9 w-9 items-center justify-center rounded-[8px] text-white/55 transition hover:bg-white/10 hover:text-white">
                    <Scissors className="h-3.5 w-3.5" />
                </button>
                <button className="flex h-9 w-9 items-center justify-center rounded-[8px] text-white/55 transition hover:bg-white/10 hover:text-white">
                    <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button className="flex h-9 w-9 items-center justify-center rounded-[8px] text-white/55 transition hover:bg-white/10 hover:text-white">
                    <Link2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </>
    );
}