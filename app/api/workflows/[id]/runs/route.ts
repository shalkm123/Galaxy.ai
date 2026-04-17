import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { PersistedWorkflowRun } from "@/types/persisted-run";

function serializeRun(run: {
    id: string;
    workflowId: string;
    status: string;
    scope: string;
    durationMs: number;
    createdAt: Date;
    finishedAt: Date | null;
    nodeRuns: Array<{
        id: string;
        workflowRunId: string;
        nodeId: string;
        nodeLabel: string;
        nodeType: string;
        status: string;
        startedAt: Date | null;
        finishedAt: Date | null;
        durationMs: number | null;
        output: string | null;
        error: string | null;
    }>;
}) {
    return {
        id: run.id,
        workflowId: run.workflowId,
        status: run.status,
        scope: run.scope,
        durationMs: run.durationMs,
        createdAt: run.createdAt.toISOString(),
        finishedAt: run.finishedAt ? run.finishedAt.toISOString() : undefined,
        nodeRuns: run.nodeRuns.map((nodeRun) => ({
            id: nodeRun.id,
            workflowRunId: nodeRun.workflowRunId,
            nodeId: nodeRun.nodeId,
            nodeLabel: nodeRun.nodeLabel,
            nodeType: nodeRun.nodeType,
            status: nodeRun.status,
            startedAt: nodeRun.startedAt
                ? nodeRun.startedAt.toISOString()
                : undefined,
            finishedAt: nodeRun.finishedAt
                ? nodeRun.finishedAt.toISOString()
                : undefined,
            durationMs: nodeRun.durationMs ?? undefined,
            output: nodeRun.output ?? undefined,
            error: nodeRun.error ?? undefined,
        })),
    };
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const workflow = await prisma.workflow.findFirst({
        where: {
            id,
            userId,
        },
        select: {
            id: true,
        },
    });

    if (!workflow) {
        return NextResponse.json({ message: "Workflow not found" }, { status: 404 });
    }

    const runs = await prisma.workflowRun.findMany({
        where: {
            workflowId: id,
            userId,
        },
        include: {
            nodeRuns: {
                orderBy: {
                    startedAt: "asc",
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return NextResponse.json(runs.map(serializeRun));
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const workflow = await prisma.workflow.findFirst({
        where: {
            id,
            userId,
        },
        select: {
            id: true,
        },
    });

    if (!workflow) {
        return NextResponse.json({ message: "Workflow not found" }, { status: 404 });
    }

    const body = (await req.json()) as PersistedWorkflowRun;

    const run = await prisma.workflowRun.create({
        data: {
            workflowId: id,
            userId,
            status: body.status,
            scope: body.scope,
            durationMs: body.durationMs,
            finishedAt: body.finishedAt ? new Date(body.finishedAt) : null,
            nodeRuns: {
                create: body.nodeRuns.map((nodeRun) => ({
                    nodeId: nodeRun.nodeId,
                    nodeLabel: nodeRun.nodeLabel,
                    nodeType: nodeRun.nodeType,
                    status: nodeRun.status,
                    startedAt: nodeRun.startedAt
                        ? new Date(nodeRun.startedAt)
                        : null,
                    finishedAt: nodeRun.finishedAt
                        ? new Date(nodeRun.finishedAt)
                        : null,
                    durationMs: nodeRun.durationMs ?? null,
                    output: nodeRun.output ?? null,
                    error: nodeRun.error ?? null,
                })),
            },
        },
        include: {
            nodeRuns: {
                orderBy: {
                    startedAt: "asc",
                },
            },
        },
    });

    return NextResponse.json(serializeRun(run));
}