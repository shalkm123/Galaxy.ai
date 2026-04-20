import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { runs } from "@trigger.dev/sdk";

function normalizeStatus(status?: string) {
    const value = (status ?? "").toUpperCase();

    if (value === "COMPLETED") return "completed";
    if (value === "FAILED") return "failed";
    if (value === "CANCELED" || value === "CANCELLED") return "cancelled";
    if (value === "RUNNING") return "running";
    if (value === "QUEUED" || value === "PENDING") return "queued";

    return "unknown";
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const run = await runs.retrieve(id);

        return NextResponse.json({
            triggerRunId: id,
            status: normalizeStatus(run.status),
            error: run.error ?? null,
            output: run.output ?? null,
        });
    } catch (error) {
        console.error("Failed to fetch Trigger.dev run:", error);

        return NextResponse.json(
            {
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch Trigger.dev run",
            },
            { status: 500 }
        );
    }
}