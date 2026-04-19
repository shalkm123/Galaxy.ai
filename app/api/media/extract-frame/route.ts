import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { mkdir } from "fs/promises";
import path from "path";
import { spawn } from "child_process";

function isInternalExecutionAuthorized(req: Request) {
    const providedKey = req.headers.get("x-internal-execution-key");
    const expectedKey = process.env.INTERNAL_EXECUTION_KEY;

    return Boolean(
        expectedKey && providedKey && providedKey === expectedKey
    );
}

function runFfmpeg(args: string[]) {
    return new Promise<void>((resolve, reject) => {
        const ffmpegPath =
            process.env.FFMPEG_PATH ||
            "C:\\ffmpeg\\ffmpeg-8.1-essentials_build\\bin\\ffmpeg.exe";

        const child = spawn(ffmpegPath, args, {
            stdio: "ignore",
            windowsHide: true,
        });

        child.on("error", reject);

        child.on("close", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`ffmpeg exited with code ${code}`));
        });
    });
}

export async function POST(req: Request) {
    const { userId } = await auth();
    const isInternal = isInternalExecutionAuthorized(req);

    if (!userId && !isInternal) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
        videoUrl?: string;
        timestamp?: string;
    };

    const videoUrl = body.videoUrl?.trim();
    const timestamp = body.timestamp?.trim() || "0";

    if (!videoUrl) {
        return NextResponse.json(
            { message: "Missing videoUrl" },
            { status: 400 }
        );
    }

    const normalizedVideoPath = videoUrl.replace(/^\/+/, "");
    const inputPath = path.join(process.cwd(), "public", normalizedVideoPath);

    const outputDir = path.join(process.cwd(), "public", "generated");
    await mkdir(outputDir, { recursive: true });

    const outputFileName = `frame-${Date.now()}.jpg`;
    const outputPath = path.join(outputDir, outputFileName);

    try {
        await runFfmpeg([
            "-y",
            "-ss",
            timestamp,
            "-i",
            inputPath,
            "-frames:v",
            "1",
            outputPath,
        ]);

        return NextResponse.json({
            imageUrl: `/generated/${outputFileName}`,
        });
    } catch (error) {
        return NextResponse.json(
            {
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to extract frame",
            },
            { status: 500 }
        );
    }
}