import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

export async function POST(req: Request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
        imageUrl?: string;
        xPercent?: string;
        yPercent?: string;
        widthPercent?: string;
        heightPercent?: string;
    };

    const imageUrl = body.imageUrl?.trim();

    if (!imageUrl) {
        return NextResponse.json(
            { message: "Missing imageUrl" },
            { status: 400 }
        );
    }

    const normalizedImagePath = imageUrl.replace(/^\/+/, "");
    const inputPath = path.join(process.cwd(), "public", normalizedImagePath);

    const outputDir = path.join(process.cwd(), "public", "generated");
    await mkdir(outputDir, { recursive: true });

    const outputFileName = `crop-${Date.now()}.png`;
    const outputPath = path.join(outputDir, outputFileName);

    try {
        const fileBuffer = await readFile(inputPath);
        const image = sharp(fileBuffer);
        const metadata = await image.metadata();

        const sourceWidth = metadata.width ?? 0;
        const sourceHeight = metadata.height ?? 0;

        if (!sourceWidth || !sourceHeight) {
            return NextResponse.json(
                { message: "Invalid source image" },
                { status: 400 }
            );
        }

        const xPercent = Number(body.xPercent ?? "0");
        const yPercent = Number(body.yPercent ?? "0");
        const widthPercent = Number(body.widthPercent ?? "100");
        const heightPercent = Number(body.heightPercent ?? "100");

        const left = Math.max(
            0,
            Math.min(sourceWidth - 1, Math.round((xPercent / 100) * sourceWidth))
        );
        const top = Math.max(
            0,
            Math.min(sourceHeight - 1, Math.round((yPercent / 100) * sourceHeight))
        );

        const width = Math.max(
            1,
            Math.min(
                sourceWidth - left,
                Math.round((widthPercent / 100) * sourceWidth)
            )
        );
        const height = Math.max(
            1,
            Math.min(
                sourceHeight - top,
                Math.round((heightPercent / 100) * sourceHeight)
            )
        );

        const cropped = await image
            .extract({
                left,
                top,
                width,
                height,
            })
            .png()
            .toBuffer();

        await writeFile(outputPath, cropped);

        return NextResponse.json({
            imageUrl: `/generated/${outputFileName}`,
        });
    } catch (error) {
        return NextResponse.json(
            {
                message:
                    error instanceof Error ? error.message : "Failed to crop image",
            },
            { status: 500 }
        );
    }
}