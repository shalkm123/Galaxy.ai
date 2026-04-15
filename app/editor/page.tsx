"use client";

import { useState } from "react";
import { EditorBottombar } from "@/components/editor/editor-bottom-toolbar";
import { WorkflowCanvas } from "@/components/editor/workflow-canvas";
import { EditorShell } from "@/components/editor/editor-shell";
import { EditorTemplates } from "@/components/editor/editor-templates";
import { EditorTopbar } from "@/components/editor/editor-topbar";

type EditorView = "templates" | "empty" | "image-generator";

export default function EditorPage() {
    const [view, setView] = useState<EditorView>("templates");

    return (
        <EditorShell>
            <div
                className="relative h-full w-full overflow-hidden"
                style={{
                    backgroundColor: "#050505",
                    backgroundImage:
                        "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
                    backgroundSize: "26px 26px",
                }}
            >
                <EditorTopbar />

                {view === "templates" && (
                    <EditorTemplates
                        onDismiss={() => setView("empty")}
                        onSelectTemplate={(template) => {
                            if (template === "empty") setView("empty");
                            else if (template === "image-generator") setView("image-generator");
                            else setView("empty");
                        }}
                    />
                )}

                {view === "empty" && <WorkflowCanvas template="empty" />}
                {view === "image-generator" && (
                    <WorkflowCanvas template="image-generator" />
                )}

                <EditorBottombar />
            </div>
        </EditorShell>
    );
}