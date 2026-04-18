import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

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

        const runs = await prisma.workflowRun.findMany({
            where: {
                workflowId: id,
                userId,
            },
            include: {
                nodeRuns: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(runs);
    } catch (error) {
        console.error("Failed to fetch runs:", error);

        return NextResponse.json(
            { message: "Failed to fetch runs" },
            { status: 500 }
        );
    }
}

export async function POST(
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

        const body = (await req.json()) as {
            status?: string;
            scope?: string;
            durationMs?: number;
            finishedAt?: string;
            nodeRuns?: Array<{
                nodeId: string;
                nodeLabel: string;
                nodeType: string;
                status: string;
                durationMs?: number;
                output?: string;
                error?: string;
            }>;
        };

        const workflow = await prisma.workflow.findUnique({
            where: { id },
        });

        if (!workflow || workflow.userId !== userId) {
            return NextResponse.json(
                { message: "Workflow not found" },
                { status: 404 }
            );
        }

        const createdRun = await prisma.workflowRun.create({
            data: {
                workflowId: id,
                userId,
                status: body.status ?? "running",
                scope: body.scope ?? "full",
                durationMs: body.durationMs ?? 0,
                finishedAt: body.finishedAt ? new Date(body.finishedAt) : null,
                nodeRuns: {
                    create: (body.nodeRuns ?? []).map((nodeRun) => ({
                        nodeId: nodeRun.nodeId,
                        nodeLabel: nodeRun.nodeLabel,
                        nodeType: nodeRun.nodeType,
                        status: nodeRun.status,
                        durationMs: nodeRun.durationMs,
                        output: nodeRun.output,
                        error: nodeRun.error,
                    })),
                },
            },
            include: {
                nodeRuns: true,
            },
        });

        return NextResponse.json(createdRun);
    } catch (error) {
        console.error("Failed to persist run:", error);

        return NextResponse.json(
            { message: "Failed to persist run" },
            { status: 500 }
        );
    }
}