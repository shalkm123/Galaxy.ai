// import { auth } from "@clerk/nextjs/server";
// import { put } from "@vercel/blob";
// import { randomUUID } from "crypto";
// import { mkdtemp, readFile, rm } from "fs/promises";
// import os from "os";
// import path from "path";
// import { NextResponse } from "next/server";

// import {
//     downloadRemoteMediaToFile,
//     getExtensionFromMediaUrl,
//     isInternalExecutionAuthorized,
//     MAX_VIDEO_UPLOAD_BYTES,
//     runFfmpeg,
// } from "@/lib/server-media";

// export const runtime = "nodejs";
// export const maxDuration = 60;

// const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".m4v", ".avi", ".mkv"];
// const BLOB_HOST_SUFFIXES = [".blob.vercel-storage.com"];

// export async function POST(req: Request) {
//     const { userId } = await auth();
//     const isInternal = isInternalExecutionAuthorized(req);

//     if (!userId && !isInternal) {
//         return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
//     }

//     const body = (await req.json()) as {
//         videoUrl?: string;
//     };

//     const videoUrl = body.videoUrl?.trim();

//     if (!videoUrl) {
//         return NextResponse.json(
//             { message: "Missing videoUrl" },
//             { status: 400 }
//         );
//     }

//     const tempDir = await mkdtemp(path.join(os.tmpdir(), "galaxy-video-"));
//     const inputExtension = getExtensionFromMediaUrl(
//         videoUrl,
//         VIDEO_EXTENSIONS,
//         ".mp4"
//     );
//     const inputPath = path.join(tempDir, `input${inputExtension}`);
//     const outputPath = path.join(tempDir, "processed.mp4");

//     try {
//         await downloadRemoteMediaToFile(videoUrl, inputPath, {
//             maxBytes: MAX_VIDEO_UPLOAD_BYTES,
//             allowedHostSuffixes: BLOB_HOST_SUFFIXES,
//         });

//         await runFfmpeg([
//             "-y",
//             "-i",
//             inputPath,
//             "-c:v",
//             "libx264",
//             "-preset",
//             "veryfast",
//             "-crf",
//             "23",
//             "-pix_fmt",
//             "yuv420p",
//             "-c:a",
//             "aac",
//             "-movflags",
//             "+faststart",
//             outputPath,
//         ]);

//         const processedVideo = await readFile(outputPath);
//         const blob = await put(
//             `processed-videos/${randomUUID()}.mp4`,
//             processedVideo,
//             {
//                 access: "public",
//                 contentType: "video/mp4",
//             }
//         );

//         return NextResponse.json({
//             sourceVideoUrl: videoUrl,
//             processedVideoUrl: blob.url,
//             videoUrl: blob.url,
//             downloadUrl: blob.downloadUrl,
//             pathname: blob.pathname,
//         });
//     } catch (error) {
//         return NextResponse.json(
//             {
//                 message:
//                     error instanceof Error
//                         ? error.message
//                         : "Failed to process video",
//             },
//             { status: 500 }
//         );
//     } finally {
//         await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
//     }
// }


import { NextRequest, NextResponse } from "next/server";
import { createWriteStream } from "fs";
import { unlink } from "fs/promises";
import { Readable, Transform } from "stream";
import type { ReadableStream as WebReadableStream } from "stream/web";
import { pipeline } from "stream/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { v2 as cloudinary } from "cloudinary";
import ffmpeg from "@/lib/ffmpeg";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

function limitDownloadSize(maxBytes: number) {
    let downloaded = 0;

    return new Transform({
        transform(chunk, _encoding, callback) {
            downloaded += chunk.length;

            if (downloaded > maxBytes) {
                callback(new Error("Video file is too large. Maximum allowed size is 25 MB."));
                return;
            }

            callback(null, chunk);
        },
    });
}

async function downloadFileToTmp(videoUrl: string, inputPath: string) {
    const response = await fetch(videoUrl);

    if (!response.ok) {
        throw new Error(`Failed to download video. Status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");

    if (contentType && !contentType.startsWith("video/")) {
        throw new Error("Invalid file type. Expected a video file.");
    }

    const contentLength = response.headers.get("content-length");

    if (contentLength && Number(contentLength) > MAX_VIDEO_SIZE_BYTES) {
        throw new Error("Video file is too large. Maximum allowed size is 25 MB.");
    }

    if (!response.body) {
        throw new Error("Video response body is empty.");
    }

    const nodeReadableStream = Readable.fromWeb(
        response.body as WebReadableStream<Uint8Array>
    );

    await pipeline(
        nodeReadableStream,
        limitDownloadSize(MAX_VIDEO_SIZE_BYTES),
        createWriteStream(inputPath)
    );
}

function extractThumbnail(inputPath: string, outputPath: string) {
    return new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
            .seekInput("00:00:01")
            .frames(1)
            .outputOptions(["-q:v 2"])
            .output(outputPath)
            .on("end", () => resolve())
            .on("error", (error) => reject(error))
            .run();
    });
}

async function uploadImageToCloudinary(filePath: string) {
    const result = await cloudinary.uploader.upload(filePath, {
        folder: "galaxy-ai/ffmpeg-output",
        resource_type: "image",
    });

    return result.secure_url;
}

export async function POST(request: NextRequest) {
    let inputPath = "";
    let outputPath = "";

    try {
        const body = await request.json();
        const videoUrl = body.videoUrl;

        if (!videoUrl || typeof videoUrl !== "string") {
            return NextResponse.json(
                { success: false, error: "videoUrl is required." },
                { status: 400 }
            );
        }

        const id = randomUUID();

        inputPath = path.join(os.tmpdir(), `${id}-input.mp4`);
        outputPath = path.join(os.tmpdir(), `${id}-thumbnail.jpg`);

        await downloadFileToTmp(videoUrl, inputPath);

        await extractThumbnail(inputPath, outputPath);

        const thumbnailUrl = await uploadImageToCloudinary(outputPath);

        return NextResponse.json({
            success: true,
            thumbnailUrl,
        });
    } catch (error) {
        console.error("FFmpeg processing failed:", error);

        const message =
            error instanceof Error ? error.message : "Unknown FFmpeg processing error.";

        return NextResponse.json(
            {
                success: false,
                error: message,
            },
            { status: 500 }
        );
    } finally {
        if (inputPath) {
            await unlink(inputPath).catch(() => { });
        }

        if (outputPath) {
            await unlink(outputPath).catch(() => { });
        }
    }
}
