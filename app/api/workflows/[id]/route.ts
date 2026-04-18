import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function toPrismaJson(
  value: Prisma.JsonValue | null | undefined
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const workflow = await prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow || workflow.userId !== userId) {
      return NextResponse.json(
        { message: "Workflow not found" },
        { status: 404 }
      );
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
  } catch (error) {
    console.error("Failed to fetch workflow:", error);

    return NextResponse.json(
      { message: "Failed to fetch workflow" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const body = (await req.json()) as {
      name?: string;
      template?: string;
      nodes?: Prisma.InputJsonValue | null;
      edges?: Prisma.InputJsonValue | null;
    };

    const existing = await prisma.workflow.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json(
        { message: "Workflow not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.workflow.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        template: body.template ?? existing.template,
        nodesJson:
          body.nodes === null
            ? Prisma.JsonNull
            : body.nodes !== undefined
              ? body.nodes
              : toPrismaJson(existing.nodesJson),
        edgesJson:
          body.edges === null
            ? Prisma.JsonNull
            : body.edges !== undefined
              ? body.edges
              : toPrismaJson(existing.edgesJson),
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      template: updated.template,
      nodes: updated.nodesJson,
      edges: updated.edgesJson,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error("Failed to update workflow:", error);

    return NextResponse.json(
      { message: "Failed to update workflow" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const existing = await prisma.workflow.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json(
        { message: "Workflow not found" },
        { status: 404 }
      );
    }

    await prisma.workflow.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete workflow:", error);

    return NextResponse.json(
      { message: "Failed to delete workflow" },
      { status: 500 }
    );
  }
}