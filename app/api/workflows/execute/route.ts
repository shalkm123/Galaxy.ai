import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { tasks } from "@trigger.dev/sdk";
import { getBaseUrl } from "@/lib/get-base-url";
import type { ExecutionRequest } from "@/types/execution";
import type { workflowRunTask } from "@/trigger/workflow-run";

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
            workflowId: body.workflowId ?? null,
            userId,
            nodes: body.nodes,
            edges: body.edges,
            baseUrl,
            internalExecutionKey: process.env.INTERNAL_EXECUTION_KEY ?? "",
            options: {
                mode: body.mode ?? "full",
                selectedNodeId: body.selectedNodeId ?? null,
            },
        });

        return NextResponse.json({
            triggerRunId: handle.id,
            workflowId: body.workflowId ?? null,
            status: "queued",
        });
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