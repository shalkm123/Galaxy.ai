"use client";

import { ReactNode, useState } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";

type DashboardShellProps = {
    children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-black text-white">
            <DashboardSidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed((prev) => !prev)}
                activeItem="Home"
            />
            <div className="flex-1">{children}</div>
        </div>
    );
}