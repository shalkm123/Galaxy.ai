import { existsSync } from "fs";
import { spawn } from "child_process";
import { writeFile } from "fs/promises";
import path from "path";
import importedFfmpegPath from "ffmpeg-static";

export const MAX_VIDEO_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_UPLOAD_BYTES = 15 * 1024 * 1024;

type RemoteMediaOptions = {
    maxBytes: number;
    allowedHostSuffixes: string[];
};

export function isInternalExecutionAuthorized(req: Request) {
    const providedKey = req.headers.get("x-internal-execution-key");
    const expectedKey = process.env.INTERNAL_EXECUTION_KEY;

    return Boolean(expectedKey && providedKey && providedKey === expectedKey);
}

function getLocalFfmpegStaticPath() {
    const binaryName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
    return path.join(process.cwd(), "node_modules", "ffmpeg-static", binaryName);
}

export function getFfmpegPath() {
    const candidates = [
        process.env.FFMPEG_PATH?.trim(),
        typeof importedFfmpegPath === "string" ? importedFfmpegPath : "",
        getLocalFfmpegStaticPath(),
    ].filter((candidate): candidate is string => Boolean(candidate));

    return candidates.find((candidate) => existsSync(candidate)) || candidates[0] || "ffmpeg";
}

export function runFfmpeg(args: string[]) {
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
            if (code === 0) {
                resolve();
                return;
            }

            const details = stderr.join("").trim();
            reject(
                new Error(
                    details
                        ? `ffmpeg exited with code ${code}: ${details}`
                        : `ffmpeg exited with code ${code}`
                )
            );
        });
    });
}

export function isHttpUrl(value: string) {
    return value.startsWith("http://") || value.startsWith("https://");
}

export function assertAllowedRemoteMediaUrl(
    mediaUrl: string,
    allowedHostSuffixes: string[]
) {
    let parsedUrl: URL;

    try {
        parsedUrl = new URL(mediaUrl);
    } catch {
        throw new Error("Invalid media URL");
    }

    if (parsedUrl.protocol !== "https:") {
        throw new Error("Only HTTPS media URLs are supported");
    }

    const host = parsedUrl.hostname.toLowerCase();
    const isAllowedHost = allowedHostSuffixes.some((suffix) => {
        const normalizedSuffix = suffix.toLowerCase();
        const exactHost = normalizedSuffix.replace(/^\./, "");

        return host === exactHost || host.endsWith(normalizedSuffix);
    });

    if (!isAllowedHost) {
        throw new Error("Media URL host is not allowed");
    }
}

export async function fetchRemoteMediaBuffer(
    mediaUrl: string,
    options: RemoteMediaOptions
) {
    assertAllowedRemoteMediaUrl(mediaUrl, options.allowedHostSuffixes);

    const response = await fetch(mediaUrl, { cache: "no-store" });

    if (!response.ok) {
        throw new Error(`Failed to download media: ${response.status}`);
    }

    const contentLength = Number(response.headers.get("content-length") ?? "0");

    if (contentLength > options.maxBytes) {
        throw new Error(
            `Media is larger than the ${formatMegabytes(options.maxBytes)} limit`
        );
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.byteLength > options.maxBytes) {
        throw new Error(
            `Media is larger than the ${formatMegabytes(options.maxBytes)} limit`
        );
    }

    return buffer;
}

export async function downloadRemoteMediaToFile(
    mediaUrl: string,
    outputPath: string,
    options: RemoteMediaOptions
) {
    const buffer = await fetchRemoteMediaBuffer(mediaUrl, options);
    await writeFile(outputPath, buffer);
}

export function resolvePublicMediaPath(mediaUrl: string) {
    const publicRoot = path.resolve(process.cwd(), "public");
    const normalizedMediaPath = mediaUrl.replace(/^\/+/, "");
    const mediaPath = path.resolve(publicRoot, normalizedMediaPath);

    if (mediaPath !== publicRoot && !mediaPath.startsWith(`${publicRoot}${path.sep}`)) {
        throw new Error("Invalid local media path");
    }

    return mediaPath;
}

export function getExtensionFromMediaUrl(
    mediaUrl: string,
    allowedExtensions: string[],
    fallbackExtension: string
) {
    const pathname = isHttpUrl(mediaUrl)
        ? new URL(mediaUrl).pathname
        : mediaUrl;

    const extension = path.extname(pathname).toLowerCase();
    return allowedExtensions.includes(extension) ? extension : fallbackExtension;
}

function formatMegabytes(bytes: number) {
    return `${Math.round(bytes / 1024 / 1024)} MB`;
}
