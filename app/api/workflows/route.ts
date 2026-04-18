import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PersistedWorkflow } from "@/types/persisted-workflow";

function toPrismaJson(
  value: Prisma.JsonValue | null | undefined
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null || value === undefined) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

export async function GET() {
  try {
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
  } catch (error) {
    console.error("Failed to fetch workflows:", error);

    return NextResponse.json(
      { message: "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as PersistedWorkflow;

    const createdWorkflow = await prisma.workflow.create({
      data: {
        userId,
        name: body.name?.trim() || "Untitled Workflow",
        template: body.template || "empty",
        nodesJson: toPrismaJson(body.nodes as unknown as Prisma.JsonValue),
        edgesJson: toPrismaJson(body.edges as unknown as Prisma.JsonValue),
      },
    });

    return NextResponse.json({
      id: createdWorkflow.id,
      name: createdWorkflow.name,
      template: createdWorkflow.template,
      nodes: createdWorkflow.nodesJson,
      edges: createdWorkflow.edgesJson,
      createdAt: createdWorkflow.createdAt,
      updatedAt: createdWorkflow.updatedAt,
    });
  } catch (error) {
    console.error("Failed to create workflow:", error);

    return NextResponse.json(
      { message: "Failed to create workflow" },
      { status: 500 }
    );
  }
}