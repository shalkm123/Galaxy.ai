import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { existsSync } from "fs";
import { mkdtemp, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import importedFfmpegPath from "ffmpeg-static";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024;
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".m4v", ".avi", ".mkv"];
const ALLOWED_REMOTE_VIDEO_HOST_SUFFIXES = [
    ".cloudinary.com",
    ".blob.vercel-storage.com",
];

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

function isInternalExecutionAuthorized(req: Request) {
    const providedKey = req.headers.get("x-internal-execution-key");
    const expectedKey = process.env.INTERNAL_EXECUTION_KEY;

    return Boolean(
        expectedKey && providedKey && providedKey === expectedKey
    );
}

function isHttpUrl(value: string) {
    return value.startsWith("http://") || value.startsWith("https://");
}

function getLocalFfmpegStaticPath() {
    const binaryName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
    return path.join(process.cwd(), "node_modules", "ffmpeg-static", binaryName);
}

function getFfmpegPath() {
    const candidates = [
        process.env.FFMPEG_PATH?.trim(),
        typeof importedFfmpegPath === "string" ? importedFfmpegPath : "",
        getLocalFfmpegStaticPath(),
    ].filter((candidate): candidate is string => Boolean(candidate));

    return candidates.find((candidate) => existsSync(candidate)) || candidates[0] || "ffmpeg";
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

function assertAllowedRemoteVideoUrl(videoUrl: string) {
    let parsedUrl: URL;

    try {
        parsedUrl = new URL(videoUrl);
    } catch {
        throw new Error("Invalid video URL");
    }

    if (parsedUrl.protocol !== "https:") {
        throw new Error("Only HTTPS video URLs are supported");
    }

    const host = parsedUrl.hostname.toLowerCase();
    const isAllowedHost = ALLOWED_REMOTE_VIDEO_HOST_SUFFIXES.some((suffix) => {
        const normalizedSuffix = suffix.toLowerCase();
        const exactHost = normalizedSuffix.replace(/^\./, "");

        return host === exactHost || host.endsWith(normalizedSuffix);
    });

    if (!isAllowedHost) {
        throw new Error("Video URL host is not allowed");
    }
}

function getExtensionFromVideoUrl(videoUrl: string) {
    const pathname = isHttpUrl(videoUrl) ? new URL(videoUrl).pathname : videoUrl;
    const extension = path.extname(pathname).toLowerCase();

    return VIDEO_EXTENSIONS.includes(extension) ? extension : ".mp4";
}

function resolveLocalVideoPath(videoUrl: string) {
    const publicRoot = path.resolve(process.cwd(), "public");
    const normalizedVideoPath = videoUrl.replace(/^\/+/, "");
    const inputPath = path.resolve(publicRoot, normalizedVideoPath);

    if (inputPath !== publicRoot && !inputPath.startsWith(`${publicRoot}${path.sep}`)) {
        throw new Error("Invalid local video path");
    }

    return inputPath;
}

async function downloadRemoteVideoToFile(videoUrl: string, inputPath: string) {
    assertAllowedRemoteVideoUrl(videoUrl);

    const response = await fetch(videoUrl, { cache: "no-store" });

    if (!response.ok) {
        throw new Error(`Failed to download video. Status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");

    if (contentType && !contentType.startsWith("video/")) {
        throw new Error("Invalid file type. Expected a video file.");
    }

    const contentLength = Number(response.headers.get("content-length") ?? "0");

    if (Number.isFinite(contentLength) && contentLength > MAX_VIDEO_SIZE_BYTES) {
        throw new Error("Video file is too large. Maximum allowed size is 25 MB.");
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.byteLength > MAX_VIDEO_SIZE_BYTES) {
        throw new Error("Video file is too large. Maximum allowed size is 25 MB.");
    }

    await writeFile(inputPath, buffer);
}

async function uploadFrameToCloudinary(filePath: string) {
    const result = await cloudinary.uploader.upload(filePath, {
        folder: "galaxy-ai/extracted-frames",
        resource_type: "image",
    });

    return result.secure_url;
}

export async function POST(req: Request) {
    let tempDir = "";

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

    try {
        tempDir = await mkdtemp(path.join(os.tmpdir(), "galaxy-frame-"));

        let inputPath: string;

        if (isHttpUrl(videoUrl)) {
            inputPath = path.join(tempDir, `input${getExtensionFromVideoUrl(videoUrl)}`);
            await downloadRemoteVideoToFile(videoUrl, inputPath);
        } else {
            inputPath = resolveLocalVideoPath(videoUrl);
        }

        const outputPath = path.join(tempDir, `frame-${Date.now()}.jpg`);

        await runFfmpeg([
            "-y",
            "-ss",
            timestamp,
            "-i",
            inputPath,
            "-frames:v",
            "1",
            "-update",
            "1",
            "-q:v",
            "2",
            outputPath,
        ]);

        const imageUrl = await uploadFrameToCloudinary(outputPath);

        return NextResponse.json({
            imageUrl,
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
    } finally {
        if (tempDir) {
            await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
        }
    }
}
