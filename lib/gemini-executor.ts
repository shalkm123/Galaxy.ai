import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

type RunGeminiTextParams = {
    model?: string;
    systemPrompt?: string;
    userMessage?: string;
    imageUrls?: string[];
};

async function imageUrlToBase64Part(imageUrl: string, baseUrl?: string) {
    const resolvedUrl =
        imageUrl.startsWith("http://") || imageUrl.startsWith("https://")
            ? imageUrl
            : `${baseUrl ?? ""}${imageUrl}`;

    const response = await fetch(resolvedUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch image input: ${imageUrl}`);
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return {
        inlineData: {
            mimeType: contentType,
            data: base64,
        },
    };
}

export async function runGeminiText({
    model,
    systemPrompt,
    userMessage,
    imageUrls = [],
}: RunGeminiTextParams): Promise<string> {
    const parts: Array<
        | { text: string }
        | {
            inlineData: {
                mimeType: string;
                data: string;
            };
        }
    > = [];

    if (systemPrompt?.trim()) {
        parts.push({
            text: `System instruction:\n${systemPrompt.trim()}`,
        });
    }

    if (userMessage?.trim()) {
        parts.push({
            text: userMessage.trim(),
        });
    }

    for (const imageUrl of imageUrls) {
        const imagePart = await imageUrlToBase64Part(
            imageUrl,
            process.env.NEXT_PUBLIC_APP_URL
        );
        parts.push(imagePart);
    }

    const response = await ai.models.generateContent({
        model: model || "gemini-2.0-flash",
        contents: [
            {
                role: "user",
                parts,
            },
        ],
    });

    return response.text ?? "";
}