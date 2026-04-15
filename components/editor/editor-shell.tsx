"use client";

import { ReactNode, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

type EditorShellProps = {
    children: ReactNode;
};

export function EditorShell({ children }: EditorShellProps) {
    const [collapsed, setCollapsed] = useState(true);

    return (
        <div className="flex h-screen overflow-hidden bg-black text-white">
            <DashboardSidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed((prev) => !prev)}
                activeItem="Node Editor"
            />
            <div className="relative flex-1 overflow-hidden">{children}</div>
        </div>
    );
}