"use client";

import { Play } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";

export function RunWorkflowButton() {
    const runWorkflow = useEditorStore((s) => s.runWorkflow);
    const isRunning = useEditorStore((s) => s.isRunning);
    const selectedNodeId = useEditorStore((s) => s.selectedNodeId);

    return (
        <button
            onClick={runWorkflow}
            disabled={isRunning}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition -ml-1.5 ${isRunning
                ? "cursor-not-allowed bg-blue-500/20 text-blue-300"
                : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
        >
            <Play className="h-4 w-4" />

            {isRunning
                ? selectedNodeId
                    ? "Running Node..."
                    : "Running Workflow..."
                : selectedNodeId
                    ? "Run Selected Node"
                    : "Run Workflow"}
        </button>
    );
}