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
    // prompt / text outputs
    "text-output": "text",
    "prompt-output": "text",
    output: "text",

    // image generator
    prompt: "text",
    image: "image",
    imagePrompt: "image",
    style: "style",
    styleImage: "image",
    raw: "text",
    seed: "seed",
    aspectRatio: "aspectRatio",
    resolution: "resolution",

    // upload image / crop image / extract frame
    "image-output": "image",
    image_url: "image",

    // upload video / extract frame
    "video-output": "video",
    video_url: "video",

    // llm
    system_prompt: "text",
    user_message: "text",
    images: "image",
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

    // extra allowed compatibility rules
    if (sourceType === "image" && targetType === "style") return true;
    if (sourceType === "number" && targetType === "seed") return true;

    return false;
}