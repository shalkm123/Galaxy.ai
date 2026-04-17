import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { PersistedWorkflow } from "@/types/persisted-workflow";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as PersistedWorkflow;

  const workflow = await prisma.workflow.create({
    data: {
      userId,
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

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(
    workflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      template: workflow.template,
      nodes: workflow.nodesJson,
      edges: workflow.edgesJson,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    }))
  );
}