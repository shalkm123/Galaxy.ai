import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { runs, tasks } from "@trigger.dev/sdk";
import { getBaseUrl } from "@/lib/get-base-url";
import type { ExecutionRequest } from "@/types/execution";
import type { workflowRunTask } from "@/trigger/workflow-run";

function isTerminalStatus(status?: string) {
    const value = (status ?? "").toUpperCase();

    return (
        value === "COMPLETED" ||
        value === "FAILED" ||
        value === "CANCELED" ||
        value === "CANCELLED"
    );
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = (await req.json()) as ExecutionRequest;
        const baseUrl = await getBaseUrl();

        const handle = await tasks.trigger<typeof workflowRunTask>("workflow-run", {
            nodes: body.nodes,
            edges: body.edges,
            baseUrl,
            internalExecutionKey: process.env.INTERNAL_EXECUTION_KEY ?? "",
            options: {
                mode: body.mode ?? "full",
                selectedNodeId: body.selectedNodeId ?? null,
            },
        });

        for await (const run of runs.subscribeToRun(handle.id)) {
            if (isTerminalStatus(run.status)) {
                break;
            }
        }

        const finalRun = await runs.retrieve(handle.id);

        const finalStatus = (finalRun.status ?? "").toUpperCase();

        if (finalStatus !== "COMPLETED") {
            return NextResponse.json(
                {
                    message: "Trigger.dev workflow run failed",
                    triggerRunId: handle.id,
                    status: finalRun.status,
                    error: finalRun.error ?? null,
                },
                { status: 500 }
            );
        }

        if (!finalRun.output) {
            return NextResponse.json(
                {
                    message: "Trigger.dev workflow run completed with no output",
                    triggerRunId: handle.id,
                    status: finalRun.status,
                },
                { status: 500 }
            );
        }

        return NextResponse.json(finalRun.output);
    } catch (error) {
        console.error("Workflow execution route failed:", error);

        return NextResponse.json(
            {
                message:
                    error instanceof Error
                        ? error.message
                        : "Workflow execution failed",
            },
            { status: 500 }
        );
    }
}