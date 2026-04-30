"use client";

import {
    Plus,
    MousePointer2,
    Hand,
    Scissors,
    LayoutGrid,
    Link2,
} from "lucide-react";

export type EditorToolMode = "select" | "pan" | "cut" | "link";

type EditorBottombarProps = {
    activeTool: EditorToolMode;
    hasSelection: boolean;
    onToolChange: (tool: EditorToolMode) => void;
    onAddNode: () => void;
    onDeleteSelected: () => void;
    onFitView: () => void;
};

function getButtonClass(active?: boolean) {
    return `flex h-9 w-9 items-center justify-center rounded-[10px] transition ${active
            ? "bg-white/15 text-white"
            : "text-white/55 hover:bg-white/10 hover:text-white"
        }`;
}

export function EditorBottombar({
    activeTool,
    hasSelection,
    onToolChange,
    onAddNode,
    onDeleteSelected,
    onFitView,
}: EditorBottombarProps) {
    return (
        <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-[16px] border border-white/10 bg-[#111]/90 px-2 py-2 shadow-2xl backdrop-blur">
            <button
                type="button"
                onClick={onAddNode}
                className={getButtonClass()}
                title="Add node"
            >
                <Plus className="h-4 w-4" />
            </button>

            <div className="mx-1 h-6 w-px bg-white/10" />

            <button
                type="button"
                onClick={() => onToolChange("select")}
                className={getButtonClass(activeTool === "select")}
                title="Select tool"
            >
                <MousePointer2 className="h-4 w-4" />
            </button>

            <button
                type="button"
                onClick={() => onToolChange("pan")}
                className={getButtonClass(activeTool === "pan")}
                title="Pan tool"
            >
                <Hand className="h-4 w-4" />
            </button>

            <div className="mx-1 h-6 w-px bg-white/10" />

            <button
                type="button"
                onClick={() => {
                    if (hasSelection) {
                        onDeleteSelected();
                        return;
                    }

                    onToolChange("cut");
                }}
                className={getButtonClass(activeTool === "cut")}
                title={
                    hasSelection
                        ? "Delete selected node/edge"
                        : "Cut tool: click a node or edge to delete it"
                }
            >
                <Scissors className="h-4 w-4" />
            </button>

            <button
                type="button"
                onClick={onFitView}
                className={getButtonClass()}
                title="Fit view"
            >
                <LayoutGrid className="h-4 w-4" />
            </button>

            <button
                type="button"
                onClick={() => onToolChange("link")}
                className={getButtonClass(activeTool === "link")}
                title="Link mode"
            >
                <Link2 className="h-4 w-4" />
            </button>
        </div>
    );
}