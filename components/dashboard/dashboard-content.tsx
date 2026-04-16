"use client";

import Link from "next/link";
import { ArrowRight, Search, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const cards = [
    {
        title: "Generate Image",
        image: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92eee?q=80&w=600",
    },
    {
        title: "Generate Video",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600",
    },
    {
        title: "Upscale & Enhance",
        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600",
    },
];

const tabs = ["Projects", "Apps", "Examples", "Templates"];

type WorkflowListItem = {
    id: string;
    name: string;
    template: string;
    updatedAt: string;
};

function formatDate(value: string) {
    return new Date(value).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function DashboardContent() {
    const [activeTab, setActiveTab] = useState("Projects");
    const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function fetchWorkflows() {
            try {
                setLoading(true);
                const response = await fetch("/api/workflows");
                const data = (await response.json()) as WorkflowListItem[];

                if (!cancelled) {
                    setWorkflows(data);
                    setLoading(false);
                }
            } catch {
                if (!cancelled) {
                    setWorkflows([]);
                    setLoading(false);
                }
            }
        }

        fetchWorkflows();

        return () => {
            cancelled = true;
        };
    }, []);

    const filteredWorkflows = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return workflows;

        return workflows.filter((workflow) =>
            workflow.name.toLowerCase().includes(normalized)
        );
    }, [workflows, query]);

    return (
        <div className="flex-1 overflow-y-auto bg-[#050505] p-5 text-white">
            <div className="overflow-hidden rounded-[20px] bg-[#0b0b0b]">
                <div className="relative h-[340px] overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=1800"
                        alt="Hero"
                        className="h-full w-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />
                    <div className="absolute left-11 top-1/2 max-w-[460px] -translate-y-1/2">
                        <div className="mb-3 flex items-center gap-3 text-[26px] font-semibold">
                            <div className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#2d8cff]">
                                <Zap className="h-4 w-4 text-white" />
                            </div>
                            Node Editor
                        </div>
                        <p className="text-[15px] leading-relaxed text-white/85">
                            Nodes is the most powerful way to operate Krea. Connect every tool
                            and model into complex automated pipelines.
                        </p>
                        <Link
                            href="/editor"
                            className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-[14px] font-medium text-black"
                        >
                            New Workflow <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>

                <div className="flex items-center justify-between border-b border-white/7 bg-[#0d0d0d] px-5 py-3">
                    <div className="flex gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`rounded-lg px-3.5 py-1.5 text-[13px] transition ${activeTab === tab
                                        ? "bg-white/10 font-medium text-white"
                                        : "text-white/55 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 rounded-[9px] border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-white/40">
                            <Search className="h-3.5 w-3.5" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search projects..."
                                className="bg-transparent text-white outline-none placeholder:text-white/40"
                            />
                        </label>

                        <button className="rounded-[9px] border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-white/65">
                            Last viewed ▾
                        </button>
                    </div>
                </div>

                <div className="bg-gradient-to-b from-[#111] to-[#0b0b0b] px-5 pb-5 pt-4">
                    {activeTab === "Projects" ? (
                        <div className="grid grid-cols-4 gap-3">
                            <Link
                                href="/editor"
                                className="flex h-[200px] cursor-pointer items-center justify-center rounded-2xl bg-white/6 transition hover:bg-white/9"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[22px] font-light text-black">
                                    +
                                </div>
                            </Link>

                            {loading ? (
                                Array.from({ length: 3 }).map((_, index) => (
                                    <div key={index} className="animate-pulse">
                                        <div className="h-[200px] rounded-2xl bg-white/6" />
                                        <div className="mt-2 h-4 w-32 rounded bg-white/8" />
                                    </div>
                                ))
                            ) : filteredWorkflows.length > 0 ? (
                                filteredWorkflows.slice(0, 7).map((workflow) => (
                                    <Link
                                        key={workflow.id}
                                        href={`/editor/${workflow.id}`}
                                        className="group cursor-pointer"
                                    >
                                        <div className="flex h-[200px] flex-col justify-between overflow-hidden rounded-2xl border border-white/8 bg-white/6 p-4 transition hover:bg-white/9">
                                            <div>
                                                <div className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/60">
                                                    {workflow.template}
                                                </div>
                                                <div className="mt-4 line-clamp-2 text-[18px] font-medium text-white">
                                                    {workflow.name}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="text-[12px] text-white/45">
                                                    Last updated
                                                </div>
                                                <div className="mt-1 text-[13px] text-white/75">
                                                    {formatDate(workflow.updatedAt)}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-[13.5px] font-medium text-white/90">
                                            {workflow.name}
                                        </p>
                                    </Link>
                                ))
                            ) : (
                                <>
                                    {cards.map((card) => (
                                        <div key={card.title} className="group cursor-pointer">
                                            <div className="h-[200px] overflow-hidden rounded-2xl">
                                                <img
                                                    src={card.image}
                                                    alt={card.title}
                                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                                                />
                                            </div>
                                            <p className="mt-2 text-[13.5px] font-medium text-white/90">
                                                {card.title}
                                            </p>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-white/8 bg-white/5 p-8 text-center text-sm text-white/45">
                            {activeTab} content will be added here.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}