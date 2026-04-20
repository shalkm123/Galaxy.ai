"use client";

import { Plus, Play, Save, Sparkles } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useEditorStore } from "@/store/editor-store";

export function EditorTopbar() {
    const template = useEditorStore((state) => state.template);
    const isRunning = useEditorStore((state) => state.isRunning);
    const workflowName = useEditorStore((state) => state.workflowName);
    const isSaving = useEditorStore((state) => state.isSaving);
    const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
    const triggerRunId = useEditorStore((s) => s.currentTriggerRunId);

    const setTemplate = useEditorStore((state) => state.setTemplate);
    const setNodes = useEditorStore((state) => state.setNodes);
    const setEdges = useEditorStore((state) => state.setEdges);
    const clearRuns = useEditorStore((state) => state.clearRuns);
    const clearSavedWorkflow = useEditorStore((state) => state.clearSavedWorkflow);
    const setWorkflowId = useEditorStore((state) => state.setWorkflowId);
    const setWorkflowName = useEditorStore((state) => state.setWorkflowName);
    const setSelectedNodeId = useEditorStore((state) => state.setSelectedNodeId);
    const setRunMode = useEditorStore((state) => state.setRunMode);
    const saveWorkflow = useEditorStore((state) => state.saveWorkflow);

    const handleNewWorkflow = () => {
        clearSavedWorkflow();
        clearRuns();
        setNodes([]);
        setEdges([]);
        setWorkflowId(null);
        setWorkflowName("Untitled Workflow");
        setSelectedNodeId(null);
        setRunMode("full");
        setTemplate("templates");
    };

    return (
        <div className="absolute left-0 right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-black/40 px-6 backdrop-blur-md">
            <div className="flex items-center gap-3">
                <input
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white outline-none placeholder:text-white/35"
                    placeholder="Untitled Workflow"
                />

                <div className="hidden text-sm text-white/45 md:block">
                    {template === "templates"
                        ? "Choose a workflow template"
                        : template === "image-generator"
                            ? "Image Generator"
                            : template === "marketing-workflow"
                                ? "Marketing Workflow"
                                : "Empty Workflow"}
                </div>

                {selectedNodeId && !isRunning && (
                    <div className="hidden rounded-lg bg-blue-500/10 px-2 py-1 text-xs text-blue-300 md:block">
                        Node Selected
                    </div>
                )}

                {/* 🔥 LIVE RUN STATUS */}
                {isRunning && (
                    <div className="hidden md:flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-1 text-xs text-yellow-300">
                        <span className="animate-pulse">●</span>
                        Running...
                    </div>
                )}

                {/* 🔥 Trigger Run ID */}
                {triggerRunId && (
                    <div className="hidden md:block text-[11px] text-blue-400">
                        {triggerRunId.slice(0, 8)}...
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={handleNewWorkflow}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                    <Plus className="h-4 w-4" />
                    New
                </button>

                <button
                    onClick={() => {
                        setNodes([]);
                        setEdges([]);
                        setWorkflowId(null);
                        setSelectedNodeId(null);
                        setRunMode("full");
                        setTemplate("templates");
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                    <Sparkles className="h-4 w-4" />
                    Templates
                </button>

                <button
                    onClick={saveWorkflow}
                    disabled={template === "templates" || isSaving}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${template === "templates" || isSaving
                        ? "cursor-not-allowed border-white/10 bg-white/5 text-white/35"
                        : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                        }`}
                >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save"}
                </button>

                <div
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${isRunning
                        ? "bg-yellow-500/15 text-yellow-300"
                        : selectedNodeId
                            ? "bg-blue-500/10 text-blue-300"
                            : "bg-white/5 text-white/45"
                        }`}
                >
                    <Play className="h-4 w-4" />
                    {isRunning
                        ? selectedNodeId
                            ? "Running Node"
                            : "Running Workflow"
                        : selectedNodeId
                            ? "Node Selected"
                            : "Idle"}
                </div>

                <UserButton
                    appearance={{
                        elements: {
                            avatarBox: "h-9 w-9",
                        },
                    }}
                />
            </div>
        </div>
    );
}