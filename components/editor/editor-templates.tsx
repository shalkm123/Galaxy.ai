import { X } from "lucide-react";

type TemplateKey =
    | "empty"
    | "image-generator"
    | "video-generator"
    | "enhancer"
    | "llm-captioning"
    | "agent";

type Template = {
    title: string;
    key: TemplateKey;
    plus?: boolean;
    subtitle?: string;
    image?: string;
    pro?: boolean;
};

const templates: Template[] = [
    { title: "Empty Workflow", plus: true, key: "empty" },
    {
        title: "Image Generator",
        subtitle: "Simple text to image Generation with Krea 1",
        image:
            "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=600",
        key: "image-generator",
    },
    {
        title: "Video Generator",
        subtitle: "Simple Video Generation with Wan 2.1",
        image:
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600",
        key: "video-generator",
    },
    {
        title: "8K Upscaling & Enhancer",
        subtitle: "Upscaling a low resolution image to 8K",
        image:
            "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600",
        key: "enhancer",
    },
    {
        title: "LLM Image Captioning",
        subtitle: "Generate a prompt from an image with GPT-5",
        image:
            "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=600",
        pro: true,
        key: "llm-captioning",
    },
    {
        title: "Agent",
        subtitle: "Build a workflow with the Nodes Agent.",
        key: "agent",
    },
];

type EditorTemplatesProps = {
    onDismiss: () => void;
    onSelectTemplate: (template: TemplateKey) => void;
};

export function EditorTemplates({
    onDismiss,
    onSelectTemplate,
}: EditorTemplatesProps) {
    return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
            <div className="mb-7 flex items-center gap-2.5">
                <span className="rounded-[7px] border border-white/20 bg-white/10 px-2.5 py-1 text-[12.5px] font-medium backdrop-blur-sm">
                    Add a node
                </span>
                <span className="text-[12.5px] text-white/50">
                    or drag and drop media files, or select a preset
                </span>
            </div>

            <div className="grid w-full max-w-[1060px] grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-6">
                {templates.map((t) => (
                    <button
                        key={t.title}
                        onClick={() => onSelectTemplate(t.key)}
                        className="group text-left"
                        type="button"
                    >
                        <div className="relative flex h-[148px] items-center justify-center overflow-hidden rounded-[13px] border border-white/8 bg-white/5 transition group-hover:border-white/18">
                            {t.plus ? (
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[20px] text-black">
                                    +
                                </div>
                            ) : t.image ? (
                                <img
                                    src={t.image}
                                    alt={t.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <svg
                                    width="30"
                                    height="30"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.35)"
                                    strokeWidth="1.5"
                                >
                                    <rect x="3" y="11" width="18" height="11" rx="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    <circle cx="12" cy="16" r="1" />
                                </svg>
                            )}

                            {t.pro ? (
                                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-[5px] bg-[#2d8cff] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                    ✦ PRO
                                </div>
                            ) : null}
                        </div>

                        <p className="mt-2 text-[12.5px] font-semibold leading-snug text-white">
                            {t.title}
                        </p>

                        {t.subtitle ? (
                            <p className="mt-1 text-[11.5px] leading-snug text-white/42">
                                {t.subtitle}
                            </p>
                        ) : null}
                    </button>
                ))}
            </div>

            <button
                onClick={onDismiss}
                className="mt-6 flex items-center gap-1.5 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-[12.5px] text-white/65 backdrop-blur-sm transition hover:bg-white/15 hover:text-white"
            >
                <X className="h-3 w-3" />
                Dismiss
            </button>
        </div>
    );
}