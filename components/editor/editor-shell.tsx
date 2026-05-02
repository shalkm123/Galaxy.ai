"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";

import { EditorTopbar } from "@/components/editor/editor-topbar";
import { EditorHistorySidebar } from "@/components/editor/editor-history-sidebar";

type EditorShellProps = {
    children: ReactNode;
};

export function EditorShell({ children }: EditorShellProps) {
    const [historyCollapsed, setHistoryCollapsed] = useState(true);

    console.log("historyCollapsed", historyCollapsed);

    return (
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-black text-white">
            {/* Topbar fixed row */}
            <div className="h-[60px] shrink-0 border-b border-white/10 bg-[#07080a]">
                <EditorTopbar />
            </div>

            {/* Body below topbar */}
            <div className="flex min-h-0 flex-1 overflow-hidden">
                {/* Main canvas area */}
                <div className="relative min-w-0 flex-1 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setHistoryCollapsed((prev) => !prev)}
                        className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#11151b] text-white/70 transition hover:bg-[#171c24] hover:text-white"
                        title={historyCollapsed ? "Open history" : "Collapse history"}
                        aria-label={historyCollapsed ? "Open history" : "Collapse history"}
                    >
                        {historyCollapsed ? (
                            <PanelRightOpen className="h-5 w-5" />
                        ) : (
                            <PanelRightClose className="h-5 w-5" />
                        )}
                    </button>

                    {children}
                </div>

                {/* Right history sidebar */}
                <div
                    className={`h-full shrink-0 overflow-hidden border-l border-white/10 bg-[#0f1115] transition-all duration-300 ${historyCollapsed ? "w-0 border-l-0" : "w-[360px]"
                        }`}
                >
                    {!historyCollapsed ? <EditorHistorySidebar /> : null}
                </div>
            </div>
        </div>
    );
}