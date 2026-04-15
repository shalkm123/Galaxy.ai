"use client";

import Link from "next/link";
import {
    ChevronLeft,
    ChevronRight,
    Folder,
    Home,
    ImageIcon,
    MoreHorizontal,
    Pencil,
    Sparkles,
    Video,
    Wand2,
    Zap,
} from "lucide-react";

type DashboardSidebarProps = {
    collapsed?: boolean;
    onToggle?: () => void;
    activeItem?: string;
};

const mainItems = [
    { label: "Home", icon: Home, href: "/dashboard" },
    { label: "Train Lora", icon: Sparkles, href: "/dashboard/lora" },
    { label: "Node Editor", icon: Zap, href: "/editor" },
    { label: "Assets", icon: Folder, href: "/dashboard/assets" },
];

const toolItems = [
    { label: "Image", icon: ImageIcon, href: "#" },
    { label: "Video", icon: Video, href: "#" },
    { label: "Enhancer", icon: Wand2, href: "#" },
    { label: "Nano Banana", icon: Sparkles, href: "#" },
    { label: "Realtime", icon: Zap, href: "#" },
    { label: "Edit", icon: Pencil, href: "#" },
    { label: "More", icon: MoreHorizontal, href: "#" },
];

export function DashboardSidebar({
    collapsed = false,
    onToggle,
    activeItem = "Home",
}: DashboardSidebarProps) {
    return (
        <aside
            className={`relative flex h-screen flex-col border-r border-white/10 bg-black text-white transition-all duration-300 ${collapsed ? "w-[58px] items-center px-0 py-4" : "w-[300px] px-3 py-4"
                }`}
        >
            <button
                onClick={onToggle}
                className={`transition ${collapsed
                    ? `flex h-10 w-10 items-center justify-center rounded-xl 
                                    ? "bg-white text-black"
                                    : "bg-white/6 text-white/85 hover:bg-white/10"
                                }`
                    : `flex items-center gap-3 rounded-2xl px-4 py-3 text-lg 
                                    ? "bg-white/12 text-white"
                                    : "text-white/90 hover:bg-white/8"
                                }`
                    }`}
            //className={`${collapsed ? "mb-6" : "mb-6 px-2"} text-white/70 transition hover:text-white`}
            >
                ◫
            </button>
            {/* <div className={`${collapsed ? "mb-6" : "mb-6 px-2"} text-white/70`}>◫</div> */}

            <nav className={`${collapsed ? "flex flex-col gap-4" : "space-y-2"}`}>
                {mainItems.map((item) => {
                    const Icon = item.icon;
                    const active = activeItem === item.label;

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            title={collapsed ? item.label : undefined}
                            className={`transition ${collapsed
                                ? `flex h-10 w-10 items-center justify-center rounded-xl ${active
                                    ? "bg-white text-black"
                                    : "bg-white/6 text-white/85 hover:bg-white/10"
                                }`
                                : `flex items-center gap-3 rounded-2xl px-4 py-3 text-lg ${active
                                    ? "bg-white/12 text-white"
                                    : "text-white/90 hover:bg-white/8"
                                }`
                                }`}
                        >
                            <Icon className="h-5 w-5" />
                            {!collapsed ? <span>{item.label}</span> : null}
                        </Link>
                    );
                })}
            </nav>

            {!collapsed ? (
                <>
                    <div className="mt-8 px-3 text-sm text-white/35">Tools</div>

                    <div className="mt-3 space-y-2">
                        {toolItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-lg text-white/90 transition hover:bg-white/8"
                                >
                                    <Icon className="h-5 w-5" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="mt-auto space-y-5">
                        <div>
                            <div className="mb-2 px-3 text-sm text-white/35">Sessions</div>
                            <div className="px-3 text-3xl font-medium">Earn 3,000 Credits</div>
                            <button className="mt-4 w-full rounded-2xl bg-gradient-to-r from-[#d5e6ff] to-[#3d6dff] px-4 py-3 text-lg font-medium text-black">
                                Upgrade
                            </button>
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl px-2 py-2">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-lg">
                                L
                            </div>
                            <div>
                                <div className="text-lg leading-none">lushrightfulchamois</div>
                                <div className="mt-1 text-sm text-white/40">Free</div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="mt-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                    L
                </div>
            )}
        </aside>
    );
}