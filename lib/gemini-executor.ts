import { gemini } from "@/lib/gemini";

export async function runGeminiText(params: {
    model?: string;
    systemPrompt?: string;
    userMessage: string;
}) {
    const model = params.model || "gemini-2.5-flash";

    const response = await gemini.models.generateContent({
        model,
        contents: params.userMessage,
        config: params.systemPrompt
            ? {
                  systemInstruction: params.systemPrompt,
              }
            : undefined,
    });

    return response.text ?? "";
}