"use client";

import { useEffect, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { UploadVideoFlowNode } from "@/types/workflow";
import { getRunClass } from "@/lib/node-run-style";

type ThumbnailState = {
    videoUrl: string;
    thumbnailUrl: string;
    error: string;
};

async function processVideo(videoUrl: string) {
    const response = await fetch("/api/process-video", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoUrl }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to process video.");
    }

    return data.thumbnailUrl;
}

export function UploadVideoNode({ data }: NodeProps<UploadVideoFlowNode>) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [thumbnail, setThumbnail] = useState<ThumbnailState>({
        videoUrl: "",
        thumbnailUrl: "",
        error: "",
    });

    const thumbnailUrl =
        thumbnail.videoUrl === data.videoUrl ? thumbnail.thumbnailUrl : "";
    const processingError =
        thumbnail.videoUrl === data.videoUrl ? thumbnail.error : "";
    const isProcessing = Boolean(data.videoUrl && thumbnail.videoUrl !== data.videoUrl);

    useEffect(() => {
        const videoUrl = data.videoUrl;

        if (!videoUrl || thumbnail.videoUrl === videoUrl) {
            return;
        }

        let isCancelled = false;

        processVideo(videoUrl)
            .then((url) => {
                if (!isCancelled) {
                    setThumbnail({
                        videoUrl,
                        thumbnailUrl: url,
                        error: "",
                    });
                }
            })
            .catch((error) => {
                if (!isCancelled) {
                    setThumbnail({
                        videoUrl,
                        thumbnailUrl: "",
                        error: error instanceof Error
                            ? error.message
                            : "Failed to process video.",
                    });
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [data.videoUrl, thumbnail.videoUrl]);

    return (
        <div
            className={`relative w-[300px] rounded-[18px] border border-[#ff9f1a] bg-[#1b1f26] ${getRunClass(
                data.runStatus
            )}`}
        >


            <div className="node-drag-handle flex cursor-grab items-center justify-between px-4 pt-3 text-[12px] text-white/55 active:cursor-grabbing">
                <span>{data.label || "Upload Video"}</span>
                <span>{data.runStatus === "running" ? "Running..." : "Video"}</span>
            </div>

            <div className="px-4 pb-4 pt-3">
                <label className="block cursor-pointer rounded-[12px] bg-[#14181f] p-4 text-sm text-white/60 hover:bg-[#1a2028]">
                    <div>{isUploading ? "Uploading video..." : "Choose video"}</div>
                    <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        disabled={isUploading}
                        onChange={async (e) => {
                            const input = e.currentTarget;
                            const file = input.files?.[0];

                            if (!file) {
                                return;
                            }

                            setUploadError("");
                            setIsUploading(true);

                            try {
                                await data.onUpload?.(file);
                            } catch (error) {
                                setUploadError(
                                    error instanceof Error
                                        ? error.message
                                        : "Video upload failed."
                                );
                            } finally {
                                setIsUploading(false);
                                input.value = "";
                            }
                        }}
                    />
                </label>

                {uploadError ? (
                    <div className="mt-2 rounded-[10px] bg-red-500/10 px-3 py-2 text-xs text-red-200">
                        {uploadError}
                    </div>
                ) : null}

                {data.videoUrl ? (
                    <div className="mt-4 overflow-hidden rounded-[12px] bg-[#14181f] p-2">
                        <video
                            src={data.videoUrl}
                            controls
                            className="w-full rounded-[10px]"
                        />
                    </div>
                ) : (
                    <div className="mt-4 rounded-[12px] bg-[#14181f] p-3 text-sm text-white/35">
                        Uploaded video preview will appear here...
                    </div>
                )}

                {data.videoUrl ? (
                    <div className="mt-3 rounded-[12px] bg-[#14181f] p-3">
                        <div className="mb-2 flex items-center justify-between text-[12px] text-white/55">
                            <span>Thumbnail</span>
                            <span>{isProcessing ? "Processing..." : "Preview"}</span>
                        </div>

                        {thumbnailUrl ? (
                            <div
                                role="img"
                                aria-label="Processed video thumbnail"
                                className="aspect-video w-full rounded-[10px] bg-cover bg-center"
                                style={{ backgroundImage: `url(${thumbnailUrl})` }}
                            />
                        ) : (
                            <div className="flex aspect-video items-center justify-center rounded-[10px] bg-[#10141a] text-center text-sm text-white/35">
                                {processingError ||
                                    (isProcessing
                                        ? "Generating thumbnail..."
                                        : "Thumbnail will appear here...")}
                            </div>
                        )}
                    </div>
                ) : null}
            </div>

            <Handle
                id="video-output"
                type="source"
                position={Position.Right}
                className="!h-3.5 !w-3.5 !border-0 !bg-[#ff9f1a]"
                style={{ top: 78 }}
            />
        </div>
    );
}
