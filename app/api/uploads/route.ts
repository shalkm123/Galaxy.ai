import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const contentType = req.headers.get("content-type") || "";

        if (!contentType.toLowerCase().includes("multipart/form-data")) {
            return NextResponse.json(
                {
                    message: `Expected multipart/form-data but received: ${contentType || "unknown"}`,
                },
                { status: 400 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json(
                { message: "No file uploaded" },
                { status: 400 }
            );
        }

        if (file.size <= 0) {
            return NextResponse.json(
                { message: "Uploaded file is empty" },
                { status: 400 }
            );
        }

        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadsDir, { recursive: true });

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const originalName = file.name || "file";
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);

        const safeBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, "-");
        const safeExtension = extension.replace(/[^a-zA-Z0-9.]/g, "");

        const safeName = `${Date.now()}-${safeBaseName}${safeExtension}`;
        const filePath = path.join(uploadsDir, safeName);

        await writeFile(filePath, buffer);

        return NextResponse.json({
            url: `/uploads/${safeName}`,
            name: file.name,
            type: file.type,
            size: file.size,
        });
    } catch (error) {
        console.error("Upload route failed:", error);

        return NextResponse.json(
            {
                message:
                    error instanceof Error ? error.message : "Upload failed",
            },
            { status: 500 }
        );
    }
}