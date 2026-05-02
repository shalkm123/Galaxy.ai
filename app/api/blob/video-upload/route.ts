import { auth } from "@clerk/nextjs/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { MAX_VIDEO_UPLOAD_BYTES } from "@/lib/server-media";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname) => {
                const { userId } = await auth();

                if (!userId) {
                    throw new Error("Unauthorized");
                }

                if (!pathname.startsWith("videos/")) {
                    throw new Error("Video uploads must use the videos/ prefix");
                }

                return {
                    allowedContentTypes: ["video/*", "application/octet-stream"],
                    maximumSizeInBytes: MAX_VIDEO_UPLOAD_BYTES,
                    addRandomSuffix: true,
                    tokenPayload: JSON.stringify({ userId }),
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                console.log("Video blob upload completed", {
                    pathname: blob.pathname,
                    tokenPayload,
                });
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        return NextResponse.json(
            {
                message:
                    error instanceof Error
                        ? error.message
                        : "Video upload token failed",
            },
            { status: 400 }
        );
    }
}
