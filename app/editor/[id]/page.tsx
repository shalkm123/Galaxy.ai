"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

//import { EditorBottombar } from "@/components/editor/editor-bottom-toolbar";
import { WorkflowCanvas } from "@/components/editor/workflow-canvas";
import { EditorShell } from "@/components/editor/editor-shell";
import { RunWorkflowButton } from "@/components/editor/nodes/run-workflow-button";
import { useEditorStore } from "@/store/editor-store";

export default function EditorWorkflowPage() {
    const params = useParams<{ id: string }>();
    const workflowId = params.id;

    const isLoadingWorkflow = useEditorStore((state) => state.isLoadingWorkflow);
    const beginWorkflowLoad = useEditorStore((state) => state.beginWorkflowLoad);
    const loadWorkflowById = useEditorStore((state) => state.loadWorkflowById);

    useEffect(() => {
        if (!workflowId) return;

        beginWorkflowLoad();
        loadWorkflowById(workflowId);
    }, [workflowId, beginWorkflowLoad, loadWorkflowById]);

    return (
        <EditorShell>
            <div
                className="relative flex h-full w-full overflow-hidden"
                style={{
                    backgroundColor: "#050505",
                    backgroundImage:
                        "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
                    backgroundSize: "26px 26px",
                }}
            >
                {isLoadingWorkflow ? (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 text-white/60">
                        Loading workflow...
                    </div>
                ) : (
                    <>
                        {/* Run button now starts below the topbar because EditorShell handles topbar separately */}
                        <div className="absolute right-6 top-5 z-20">
                            <RunWorkflowButton />
                        </div>

                        <WorkflowCanvas />
                        {/* <EditorBottombar /> */}
                    </>
                )}
            </div>
        </EditorShell>
    );
}