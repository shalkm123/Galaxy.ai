"use client";

import Link from "next/link";
import { ArrowRight, Search, Zap } from "lucide-react";
import { useState } from "react";

const cards = [
    { title: "Generate Image", image: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92eee?q=80&w=600" },
    { title: "Generate Video", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600" },
    { title: "Upscale & Enhance", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600" },
];

const tabs = ["Projects", "Apps", "Examples", "Templates"];

export function DashboardContent() {
    const [activeTab, setActiveTab] = useState("Projects");

    return (
        <div className="flex-1 overflow-y-auto bg-[#050505] p-5 text-white">
            <div className="overflow-hidden rounded-[20px] bg-[#0b0b0b]">
                {/* Hero */}
                <div className="relative h-[340px] overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=1800"
                        alt="Hero"
                        className="h-full w-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />
                    <div className="absolute left-11 top-1/2 -translate-y-1/2 max-w-[460px]">
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

                {/* Tabs bar */}
                <div className="flex items-center justify-between border-b border-white/7 bg-[#0d0d0d] px-5 py-3">
                    <div className="flex gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`rounded-lg px-3.5 py-1.5 text-[13px] transition ${activeTab === tab
                                    ? "bg-white/10 text-white font-medium"
                                    : "text-white/55 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 rounded-[9px] border border-white/10 bg-white/5 px-3 py-2 text-white/40 text-[13px]">
                            <Search className="h-3.5 w-3.5" /> Search projects...
                        </div>
                        <button className="rounded-[9px] border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-white/65">
                            Last viewed ▾
                        </button>
                    </div>
                </div>

                {/* Cards */}
                <div className="bg-gradient-to-b from-[#111] to-[#0b0b0b] px-5 pb-5 pt-4">
                    <div className="grid grid-cols-4 gap-3">
                        <div className="flex h-[200px] cursor-pointer items-center justify-center rounded-2xl bg-white/6 transition hover:bg-white/9">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[22px] text-black font-light">
                                +
                            </div>
                        </div>
                        {cards.map((card) => (
                            <div key={card.title} className="group cursor-pointer">
                                <div className="h-[200px] overflow-hidden rounded-2xl">
                                    <img
                                        src={card.image}
                                        alt={card.title}
                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                                    />
                                </div>
                                <p className="mt-2 text-[13.5px] font-medium text-white/90">{card.title}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}