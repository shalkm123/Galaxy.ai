"use client";

import { useEditorStore } from "@/store/editor-store";

export function RunWorkflowButton() {
    const isRunning = useEditorStore((state) => state.isRunning);
    const runWorkflow = useEditorStore((state) => state.runWorkflow);

    return (
        <button
            onClick={runWorkflow}
            disabled={isRunning}
            className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition ${isRunning
                    ? "cursor-not-allowed bg-blue-500/50"
                    : "bg-[#1e7bff] hover:bg-[#1970ea]"
                }`}
        >
            {isRunning ? "Running..." : "Run Workflow"}
        </button>
    );
}