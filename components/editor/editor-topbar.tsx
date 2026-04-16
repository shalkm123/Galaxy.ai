"use client";

import { Plus, Play, Save, Sparkles } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";

export function EditorTopbar() {
    const template = useEditorStore((state) => state.template);
    const isRunning = useEditorStore((state) => state.isRunning);
    const workflowName = useEditorStore((state) => state.workflowName);
    const isSaving = useEditorStore((state) => state.isSaving);

    const setTemplate = useEditorStore((state) => state.setTemplate);
    const setNodes = useEditorStore((state) => state.setNodes);
    const setEdges = useEditorStore((state) => state.setEdges);
    const clearRuns = useEditorStore((state) => state.clearRuns);
    const clearSavedWorkflow = useEditorStore((state) => state.clearSavedWorkflow);
    const setWorkflowId = useEditorStore((state) => state.setWorkflowId);
    const setWorkflowName = useEditorStore((state) => state.setWorkflowName);
    const saveWorkflow = useEditorStore((state) => state.saveWorkflow);

    const handleNewWorkflow = () => {
        clearSavedWorkflow();
        clearRuns();
        setNodes([]);
        setEdges([]);
        setWorkflowId(null);
        setWorkflowName("Untitled Workflow");
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
                            : "Empty Workflow"}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={handleNewWorkflow}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                    <Plus className="h-4 w-4" />
                    New Workflow
                </button>

                <button
                    onClick={() => {
                        setNodes([]);
                        setEdges([]);
                        setWorkflowId(null);
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
                            ? "bg-blue-500/15 text-blue-300"
                            : "bg-white/5 text-white/45"
                        }`}
                >
                    <Play className="h-4 w-4" />
                    {isRunning ? "Running" : "Idle"}
                </div>
            </div>
        </div>
    );
}