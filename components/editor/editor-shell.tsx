"use client";

import { ReactNode, useState } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { EditorHistorySidebar } from "@/components/editor/editor-history-sidebar";

type EditorShellProps = {
    children: ReactNode;
};

export function EditorShell({ children }: EditorShellProps) {
    const [collapsed, setCollapsed] = useState(true);
    const [historyCollapsed, setHistoryCollapsed] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-black text-white">
            <DashboardSidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed((prev) => !prev)}
                activeItem="Node Editor"
            />

            <div className="flex flex-1 overflow-hidden">
                <div className="relative flex-1 overflow-hidden">
                    <button
                        onClick={() => setHistoryCollapsed((prev) => !prev)}
                        className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#11151b] text-white/70 transition hover:bg-[#171c24] hover:text-white"
                        title={historyCollapsed ? "Open history sidebar" : "Collapse history sidebar"}
                    >
                        {historyCollapsed ? (
                            <PanelRightOpen className="h-5 w-5" />
                        ) : (
                            <PanelRightClose className="h-5 w-5" />
                        )}
                    </button>

                    {children}
                </div>

                <div
                    className={`overflow-hidden border-l border-white/10 bg-[#0f1115] transition-all duration-300 ${historyCollapsed ? "w-0 border-l-0" : "w-[360px]"
                        }`}
                >
                    {!historyCollapsed ? <EditorHistorySidebar /> : null}
                </div>
            </div>
        </div>
    );
}