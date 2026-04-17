"use client";

import { ReactNode, useState } from "react";
import { UserButton } from "@clerk/nextjs";
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

            <div className="relative flex-1">
                <div className="absolute right-5 top-5 z-20">
                    <UserButton
                        afterSignOutUrl="/login"
                        appearance={{
                            elements: {
                                avatarBox: "h-9 w-9",
                            },
                        }}
                    />
                </div>

                {children}
            </div>
        </div>
    );
}