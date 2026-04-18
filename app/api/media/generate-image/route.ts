import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
        prompt?: string;
        model?: string;
    };

    const prompt = body.prompt?.trim();

    if (!prompt) {
        return NextResponse.json({ message: "Missing prompt" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { message: "Missing OPENAI_API_KEY" },
            { status: 500 }
        );
    }

    try {
        const response = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-image-1",
                prompt,
                size: "1024x1024",
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            return NextResponse.json(
                { message: text || "Image generation failed" },
                { status: 500 }
            );
        }

        const data = (await response.json()) as {
            data?: Array<{ b64_json?: string }>;
        };

        const base64 = data.data?.[0]?.b64_json;

        if (!base64) {
            return NextResponse.json(
                { message: "No image returned from provider" },
                { status: 500 }
            );
        }

        const buffer = Buffer.from(base64, "base64");

        const outputDir = path.join(process.cwd(), "public", "generated");
        await mkdir(outputDir, { recursive: true });

        const outputFileName = `generated-${Date.now()}.png`;
        const outputPath = path.join(outputDir, outputFileName);

        await writeFile(outputPath, buffer);

        return NextResponse.json({
            imageUrl: `/generated/${outputFileName}`,
        });
    } catch (error) {
        return NextResponse.json(
            {
                message:
                    error instanceof Error
                        ? error.message
                        : "Image generation failed",
            },
            { status: 500 }
        );
    }
}