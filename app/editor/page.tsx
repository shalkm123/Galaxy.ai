"use client";

import { useEffect } from "react";
import { EditorBottombar } from "@/components/editor/editor-bottom-toolbar";
import { WorkflowCanvas } from "@/components/editor/workflow-canvas";
import { EditorShell } from "@/components/editor/editor-shell";
import { EditorTemplates } from "@/components/editor/editor-templates";
import { EditorTopbar } from "@/components/editor/editor-topbar";
import { RunWorkflowButton } from "@/components/editor/nodes/run-workflow-button";
import { useEditorStore } from "@/store/editor-store";

export default function EditorPage() {
    const template = useEditorStore((state) => state.template);
    const nodes = useEditorStore((state) => state.nodes);
    const edges = useEditorStore((state) => state.edges);
    const hasHydrated = useEditorStore((state) => state.hasHydrated);

    const setTemplate = useEditorStore((state) => state.setTemplate);
    const loadFromLocalStorage = useEditorStore((state) => state.loadFromLocalStorage);
    const saveToLocalStorage = useEditorStore((state) => state.saveToLocalStorage);
    const setHasHydrated = useEditorStore((state) => state.setHasHydrated);

    useEffect(() => {
        if (hasHydrated) return;

        const restored = loadFromLocalStorage();

        if (!restored) {
            setTemplate("templates");
        }

        setHasHydrated(true);
    }, [hasHydrated, loadFromLocalStorage, setHasHydrated, setTemplate]);

    useEffect(() => {
        if (!hasHydrated) return;
        if (template === "templates") return;

        saveToLocalStorage();
    }, [template, nodes, edges, hasHydrated, saveToLocalStorage]);

    const showTemplates = hasHydrated && template === "templates";
    const showCanvas = hasHydrated && template !== "templates";

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

                    {showCanvas ? (
                        <>
                            <div className="absolute right-6 top-20 z-20">
                                <RunWorkflowButton />
                            </div>

                            <WorkflowCanvas />
                            <EditorBottombar />
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
            </div>
        </EditorShell>
    );
}