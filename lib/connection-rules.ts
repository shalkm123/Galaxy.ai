type HandleType =
    | "text"
    | "image"
    | "video"
    | "number"
    | "style"
    | "seed"
    | "aspectRatio"
    | "resolution";

const handleTypeMap: Record<string, HandleType> = {
    // text outputs
    "text-output": "text",
    "prompt-output": "text",

    // generic text inputs
    prompt: "text",
    system_prompt: "text",
    user_message: "text",
    raw: "text",

    // image inputs / outputs
    "image-output": "image",
    image: "image",
    image_url: "image",
    imagePrompt: "image",
    styleImage: "image",
    images: "image",

    // video inputs / outputs
    "video-output": "video",
    video_url: "video",

    // style / params
    style: "style",
    seed: "seed",
    aspectRatio: "aspectRatio",
    resolution: "resolution",
};

export function getHandleDataType(handleId?: string | null): HandleType | null {
    if (!handleId) return null;
    return handleTypeMap[handleId] ?? null;
}

export function isConnectionAllowed(
    sourceHandle?: string | null,
    targetHandle?: string | null
) {
    const sourceType = getHandleDataType(sourceHandle);
    const targetType = getHandleDataType(targetHandle);

    if (!sourceType || !targetType) return false;

    if (sourceType === targetType) return true;

    if (sourceType === "image" && targetType === "style") return true;
    if (sourceType === "number" && targetType === "seed") return true;

    return false;
}