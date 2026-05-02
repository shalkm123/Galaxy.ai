"use client";

import { useEffect } from "react";

//import { EditorBottombar } from "@/components/editor/editor-bottom-toolbar";
import { WorkflowCanvas } from "@/components/editor/workflow-canvas";
import { EditorShell } from "@/components/editor/editor-shell";
import { EditorTemplates } from "@/components/editor/editor-templates";
import { RunWorkflowButton } from "@/components/editor/nodes/run-workflow-button";
import { useEditorStore } from "@/store/editor-store";

export default function EditorPage() {
    const template = useEditorStore((state) => state.template);
    const workflowId = useEditorStore((state) => state.workflowId);
    const nodes = useEditorStore((state) => state.nodes);
    const edges = useEditorStore((state) => state.edges);
    const hasHydrated = useEditorStore((state) => state.hasHydrated);

    const setTemplate = useEditorStore((state) => state.setTemplate);
    const startNewWorkflow = useEditorStore((state) => state.startNewWorkflow);
    const loadFromLocalStorage = useEditorStore(
        (state) => state.loadFromLocalStorage
    );
    const saveToLocalStorage = useEditorStore(
        (state) => state.saveToLocalStorage
    );
    const setHasHydrated = useEditorStore((state) => state.setHasHydrated);
    const fetchRunsForWorkflow = useEditorStore(
        (state) => state.fetchRunsForWorkflow
    );

    useEffect(() => {
        const shouldStartNewWorkflow =
            typeof window !== "undefined" &&
            new URLSearchParams(window.location.search).get("new") === "1";

        if (shouldStartNewWorkflow) {
            startNewWorkflow();
            return;
        }

        if (hasHydrated) return;

        const restored = loadFromLocalStorage();

        if (!restored) {
            setTemplate("templates");
        }

        setHasHydrated(true);
    }, [
        hasHydrated,
        loadFromLocalStorage,
        setHasHydrated,
        setTemplate,
        startNewWorkflow,
    ]);

    useEffect(() => {
        if (!hasHydrated) return;
        if (template === "templates") return;

        saveToLocalStorage();
    }, [template, nodes, edges, hasHydrated, saveToLocalStorage]);

    useEffect(() => {
        if (!workflowId) return;

        fetchRunsForWorkflow(workflowId);
    }, [workflowId, fetchRunsForWorkflow]);

    const showTemplates = hasHydrated && template === "templates";
    const showCanvas = hasHydrated && template !== "templates";

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
                {showCanvas ? (
                    <>
                        <div className="absolute right-6 top-5 z-20">
                            <RunWorkflowButton />
                        </div>

                        <WorkflowCanvas />
                        {/* <EditorBottombar /> */}
                    </>
                ) : null}

                {showTemplates ? (
                    <EditorTemplates
                        onDismiss={() => setTemplate("empty")}
                        onSelectTemplate={(nextTemplate) => {
                            if (nextTemplate === "image-generator") {
                                setTemplate("image-generator");
                                return;
                            }

                            setTemplate("empty");
                        }}
                    />
                ) : null}
            </div>
        </EditorShell>
    );
}
