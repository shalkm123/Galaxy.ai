export function ImageGeneratorEditor() {
    return (
        <div className="absolute inset-0 z-10 flex items-start justify-center px-8 pt-24">
            <div className="relative h-[550px] w-[980px] rounded-[10px] border border-dashed border-[#1e7bff] bg-[rgba(5,12,24,0.45)]">
                <div className="absolute left-[-118px] top-4 flex flex-col gap-3">
                    <button className="rounded-xl bg-[#1e7bff] px-4 py-2 text-sm font-medium text-white shadow-lg">
                        ▶ Run nodes
                    </button>

                    <button className="rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white/90">
                        { } Group
                    </button>

                    <button className="rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white/90">
                        ⊞ Tidy Up
                    </button>
                </div>

                <div className="absolute left-12 top-14 w-[260px] rounded-[16px] border border-[#e5b800] bg-[#1b1f26] shadow-[0_0_0_1px_rgba(229,184,0,0.25)]">
                    <div className="flex items-center justify-between px-4 pt-3 text-[12px] text-white/55">
                        <span className="text-[#e5b800]">∫ Prompt</span>
                        <span>Output</span>
                    </div>

                    <div className="px-4 pb-4 pt-2">
                        <div className="mb-2 text-[12px] text-white/45">Input</div>
                        <div className="rounded-[12px] bg-[#14181f] p-3 text-sm text-white">
                            A serene landscape with mountains
                        </div>
                    </div>

                    <div className="absolute left-[-7px] top-[38px] h-3.5 w-3.5 rounded-full bg-[#e5b800]" />
                    <div className="absolute right-[-7px] top-[38px] h-3.5 w-3.5 rounded-full bg-[#e5b800]" />
                </div>

                <svg
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    viewBox="0 0 980 550"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M 305 95 C 380 95, 360 340, 465 340"
                        stroke="#c9a300"
                        strokeWidth="3"
                        fill="none"
                    />
                </svg>

                <div className="absolute left-[560px] top-14 w-[285px] overflow-hidden rounded-[18px] border border-[#1e7bff] bg-[#1b1f26] shadow-[0_0_0_1px_rgba(30,123,255,0.28)]">
                    <div className="flex items-center justify-between px-4 pt-3 text-[12px] text-white/55">
                        <span>Krea-1</span>
                        <span>6 CU ⓘ</span>
                    </div>

                    <div className="px-4 pb-4 pt-2">
                        <div className="overflow-hidden rounded-[12px]">
                            <img
                                src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1000&auto=format&fit=crop"
                                alt="Generated mountain landscape"
                                className="h-[190px] w-full object-cover"
                            />
                        </div>

                        <div className="mt-3 rounded-[10px] bg-[#20252d] p-3">
                            <div className="mb-2 flex items-center justify-between text-[12px] text-white/55">
                                <span>Model</span>
                                <span>Image</span>
                            </div>

                            <div className="rounded-[8px] bg-[#11151b] px-3 py-2 text-sm text-white">
                                ✦ Krea1
                            </div>

                            <div className="mt-3 text-[12px] text-white/55">Prompt</div>
                            <div className="mt-2 rounded-[10px] bg-[#14181f] p-3 text-sm text-white/45">
                                A serene landscape with mountains
                            </div>

                            <div className="mt-3 text-[12px] text-white/35">› Settings</div>
                        </div>
                    </div>

                    <div className="absolute left-[-7px] top-[274px] h-3.5 w-3.5 rounded-full bg-[#e5b800]" />
                    <div className="absolute right-[-7px] top-[232px] h-3.5 w-3.5 rounded-full bg-[#1e7bff]" />
                    <div className="absolute left-[0px] top-[480px] h-3.5 w-3.5 rounded-full bg-white/35" />
                </div>
            </div>
        </div>
    );
}