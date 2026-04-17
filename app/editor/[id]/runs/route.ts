import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { PersistedWorkflowRun } from "@/types/persisted-run-history";

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
            nodeRuns: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return NextResponse.json(
        runs.map((run) => ({
            id: run.id,
            workflowId: run.workflowId,
            status: run.status,
            scope: run.scope,
            durationMs: run.durationMs,
            createdAt: run.createdAt,
            finishedAt: run.finishedAt,
            nodeRuns: run.nodeRuns.map((nodeRun) => ({
                id: nodeRun.id,
                workflowRunId: nodeRun.workflowRunId,
                nodeId: nodeRun.nodeId,
                nodeLabel: nodeRun.nodeLabel,
                nodeType: nodeRun.nodeType,
                status: nodeRun.status,
                startedAt: nodeRun.startedAt,
                finishedAt: nodeRun.finishedAt,
                durationMs: nodeRun.durationMs,
                output: nodeRun.output,
                error: nodeRun.error,
            })),
        }))
    );
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
                    startedAt: nodeRun.startedAt ? new Date(nodeRun.startedAt) : null,
                    finishedAt: nodeRun.finishedAt ? new Date(nodeRun.finishedAt) : null,
                    durationMs: nodeRun.durationMs ?? null,
                    output: nodeRun.output ?? null,
                    error: nodeRun.error ?? null,
                })),
            },
        },
        include: {
            nodeRuns: true,
        },
    });

    return NextResponse.json({
        id: run.id,
        workflowId: run.workflowId,
        status: run.status,
        scope: run.scope,
        durationMs: run.durationMs,
        createdAt: run.createdAt,
        finishedAt: run.finishedAt,
        nodeRuns: run.nodeRuns.map((nodeRun) => ({
            id: nodeRun.id,
            workflowRunId: nodeRun.workflowRunId,
            nodeId: nodeRun.nodeId,
            nodeLabel: nodeRun.nodeLabel,
            nodeType: nodeRun.nodeType,
            status: nodeRun.status,
            startedAt: nodeRun.startedAt,
            finishedAt: nodeRun.finishedAt,
            durationMs: nodeRun.durationMs,
            output: nodeRun.output,
            error: nodeRun.error,
        })),
    });
}