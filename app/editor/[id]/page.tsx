"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EditorBottombar } from "@/components/editor/editor-bottom-toolbar";
import { WorkflowCanvas } from "@/components/editor/workflow-canvas";
import { EditorShell } from "@/components/editor/editor-shell";
import { EditorTopbar } from "@/components/editor/editor-topbar";
import { RunWorkflowButton } from "@/components/editor/nodes/run-workflow-button";
import { useEditorStore } from "@/store/editor-store";
import type { AppFlowNode, WorkflowEdge } from "@/types/workflow";
import type { EditorTemplate } from "@/store/editor-store";

type WorkflowResponse = {
    id: string;
    name: string;
    template: Exclude<EditorTemplate, "templates">;
    nodes: AppFlowNode[];
    edges: WorkflowEdge[];
};

export default function SavedEditorPage() {
    const params = useParams<{ id: string }>();
    const loadWorkflow = useEditorStore((state) => state.loadWorkflow);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchWorkflow() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`/api/workflows/${params.id}`);
                if (!response.ok) {
                    throw new Error("Failed to load workflow");
                }

                const workflow = (await response.json()) as WorkflowResponse;

                if (!cancelled) {
                    loadWorkflow(workflow);
                    setLoading(false);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error ? err.message : "Failed to load workflow"
                    );
                    setLoading(false);
                }
            }
        }

        if (params.id) {
            fetchWorkflow();
        }

        return () => {
            cancelled = true;
        };
    }, [params.id, loadWorkflow]);

    return (
        <EditorShell>
            <div
                className="flex h-full w-full overflow-hidden"
                style={{
                    backgroundColor: "#050505",
                    backgroundImage:
                        "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
                    backgroundSize: "26px 26px",
                }}
            >
                <div className="relative flex-1 overflow-hidden">
                    <EditorTopbar />

                    {loading ? (
                        <div className="flex h-full items-center justify-center text-white/60">
                            Loading workflow...
                        </div>
                    ) : error ? (
                        <div className="flex h-full items-center justify-center text-red-300">
                            {error}
                        </div>
                    ) : (
                        <>
                            <div className="absolute right-6 top-20 z-20">
                                <RunWorkflowButton />
                            </div>

                            <WorkflowCanvas />
                            <EditorBottombar />
                        </>
                    )}
                </div>
            </div>
        </EditorShell>
    );
}