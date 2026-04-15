import { Moon, Share2, ChevronDown, ImageIcon, Zap } from "lucide-react";

export function EditorTopbar() {
    return (
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3.5">
            {/* Left: Logo + title */}
            <div className="flex items-center gap-1.5 rounded-[13px] border border-white/10 bg-white/7 px-2.5 py-1.5 backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-white/10">
                    <Zap className="h-3.5 w-3.5 text-white" />
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-white/40" />
                <span className="text-[13.5px] font-medium text-white/90">Untitled</span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5">
                <button className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-white/10 bg-white/7 text-white/65 backdrop-blur-md transition hover:bg-white/11 hover:text-white">
                    <Moon className="h-3.5 w-3.5" />
                </button>
                <button className="flex items-center gap-1.5 rounded-[9px] border border-white/10 bg-white/7 px-3 py-1.5 text-[12.5px] text-white/65 backdrop-blur-md transition hover:bg-white/11 hover:text-white">
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                </button>
                <button className="flex items-center gap-1.5 rounded-[9px] border border-white/10 bg-white/10 px-3 py-1.5 text-[12.5px] font-medium text-white backdrop-blur-md transition hover:bg-white/15">
                    <Zap className="h-3.5 w-3.5" />
                    Turn workflow into app
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-white/10 bg-white/7 text-white/65 backdrop-blur-md transition hover:bg-white/11 hover:text-white">
                    <ImageIcon className="h-3.5 w-3.5" />
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-white/10 bg-white/7 text-white/65 backdrop-blur-md transition hover:bg-white/11 hover:text-white">
                    <ChevronDown className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}