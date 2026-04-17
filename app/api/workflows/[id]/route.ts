import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { PersistedWorkflow } from "@/types/persisted-workflow";

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
    where: { id, userId },
  });

  if (!workflow) {
    return NextResponse.json({ message: "Workflow not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: workflow.id,
    name: workflow.name,
    template: workflow.template,
    nodes: workflow.nodesJson,
    edges: workflow.edgesJson,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as PersistedWorkflow;

  const existing = await prisma.workflow.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return NextResponse.json({ message: "Workflow not found" }, { status: 404 });
  }

  const workflow = await prisma.workflow.update({
    where: { id },
    data: {
      name: body.name,
      template: body.template,
      nodesJson: body.nodes,
      edgesJson: body.edges,
    },
  });

  return NextResponse.json({
    id: workflow.id,
    name: workflow.name,
    template: workflow.template,
    nodes: workflow.nodesJson,
    edges: workflow.edgesJson,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
  });
}