import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }

    if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
    ) {
        return error.message;
    }

    return "Upload failed";
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const contentType = req.headers.get("content-type") || "";
        if (!contentType.toLowerCase().includes("multipart/form-data")) {
            return NextResponse.json(
                { message: `Expected multipart/form-data but received: ${contentType || "unknown"}` },
                { status: 400 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
        }

        if (file.size <= 0) {
            return NextResponse.json({ message: "Uploaded file is empty" }, { status: 400 });
        }

        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
            return NextResponse.json(
                { message: "Only image and video uploads are supported" },
                { status: 400 }
            );
        }

        const resourceType = isVideo ? "video" : "image";
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await new Promise<{ secure_url: string; public_id: string }>(
            (resolve, reject) => {
                cloudinary.uploader
                    .upload_stream({ folder: "galaxy-ai", resource_type: resourceType }, (error, result) => {
                        if (error || !result) {
                            reject(error ?? new Error("Cloudinary upload failed"));
                            return;
                        }

                        resolve(result);
                    })
                    .end(buffer);
            }
        );

        return NextResponse.json({
            url: result.secure_url,  // https:// URL instead of /uploads/...
            name: file.name,
            type: file.type,
            size: file.size,
            resourceType,
        });
    } catch (error) {
        console.error("Upload route failed:", error);
        return NextResponse.json(
            { message: getErrorMessage(error) },
            { status: 500 }
        );
    }
}
