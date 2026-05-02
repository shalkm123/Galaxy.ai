import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";

const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;
const ALLOWED_REMOTE_IMAGE_HOST_SUFFIXES = [
    ".cloudinary.com",
    ".blob.vercel-storage.com",
    ".unsplash.com",
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

function assertAllowedRemoteImageUrl(imageUrl: string) {
    let parsedUrl: URL;

    try {
        parsedUrl = new URL(imageUrl);
    } catch {
        throw new Error("Invalid image URL");
    }

    if (parsedUrl.protocol !== "https:") {
        throw new Error("Only HTTPS image URLs are supported");
    }

    const host = parsedUrl.hostname.toLowerCase();
    const isAllowedHost = ALLOWED_REMOTE_IMAGE_HOST_SUFFIXES.some((suffix) => {
        const normalizedSuffix = suffix.toLowerCase();
        const exactHost = normalizedSuffix.replace(/^\./, "");

        return host === exactHost || host.endsWith(normalizedSuffix);
    });

    if (!isAllowedHost) {
        throw new Error("Image URL host is not allowed");
    }
}

function resolveLocalImagePath(imageUrl: string) {
    const publicRoot = path.resolve(process.cwd(), "public");
    const normalizedImagePath = imageUrl.replace(/^\/+/, "");
    const inputPath = path.resolve(publicRoot, normalizedImagePath);

    if (inputPath !== publicRoot && !inputPath.startsWith(`${publicRoot}${path.sep}`)) {
        throw new Error("Invalid local image path");
    }

    return inputPath;
}

async function fetchRemoteImageBuffer(imageUrl: string) {
    assertAllowedRemoteImageUrl(imageUrl);

    const response = await fetch(imageUrl, { cache: "no-store" });

    if (!response.ok) {
        throw new Error(`Failed to download image. Status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");

    if (contentType && !contentType.startsWith("image/")) {
        throw new Error("Invalid file type. Expected an image file.");
    }

    const contentLength = Number(response.headers.get("content-length") ?? "0");

    if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_SIZE_BYTES) {
        throw new Error("Image file is too large. Maximum allowed size is 15 MB.");
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
        throw new Error("Image file is too large. Maximum allowed size is 15 MB.");
    }

    return buffer;
}

async function getImageBuffer(imageUrl: string) {
    if (isHttpUrl(imageUrl)) {
        return fetchRemoteImageBuffer(imageUrl);
    }

    return readFile(resolveLocalImagePath(imageUrl));
}

async function uploadImageBufferToCloudinary(buffer: Buffer) {
    return new Promise<string>((resolve, reject) => {
        cloudinary.uploader
            .upload_stream(
                {
                    folder: "galaxy-ai/cropped-images",
                    resource_type: "image",
                },
                (error, result) => {
                    if (error || !result?.secure_url) {
                        reject(error ?? new Error("Cloudinary upload failed"));
                        return;
                    }

                    resolve(result.secure_url);
                }
            )
            .end(buffer);
    });
}

export async function POST(req: Request) {
    const { userId } = await auth();
    const isInternal = isInternalExecutionAuthorized(req);

    if (!userId && !isInternal) {
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

    try {
        const fileBuffer = await getImageBuffer(imageUrl);
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

        const croppedImageUrl = await uploadImageBufferToCloudinary(cropped);

        return NextResponse.json({
            imageUrl: croppedImageUrl,
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
