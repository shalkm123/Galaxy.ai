import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { mkdir } from "fs/promises";
import path from "path";
import { spawn } from "child_process";

export const runtime = "nodejs";

function isInternalExecutionAuthorized(req: Request) {
    const providedKey = req.headers.get("x-internal-execution-key");
    const expectedKey = process.env.INTERNAL_EXECUTION_KEY;

    return Boolean(
        expectedKey && providedKey && providedKey === expectedKey
    );
}

function getFfmpegPath() {
    return process.env.FFMPEG_PATH?.trim() || "ffmpeg";
}

function runFfmpeg(args: string[]) {
    return new Promise<void>((resolve, reject) => {
        const ffmpegPath = getFfmpegPath();
        const stderr: string[] = [];

        const child = spawn(ffmpegPath, args, {
            stdio: ["ignore", "ignore", "pipe"],
            windowsHide: true,
        });

        child.stderr?.on("data", (chunk: Buffer) => {
            stderr.push(chunk.toString());
        });

        child.on("error", (error: NodeJS.ErrnoException) => {
            if (error.code === "ENOENT") {
                reject(
                    new Error(
                        `ffmpeg executable not found at "${ffmpegPath}". Set FFMPEG_PATH to the production ffmpeg binary path, or install ffmpeg on the server PATH.`
                    )
                );
                return;
            }

            reject(error);
        });

        child.on("close", (code) => {
            if (code === 0) resolve();
            else {
                const details = stderr.join("").trim();
                reject(
                    new Error(
                        details
                            ? `ffmpeg exited with code ${code}: ${details}`
                            : `ffmpeg exited with code ${code}`
                    )
                );
            }
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
