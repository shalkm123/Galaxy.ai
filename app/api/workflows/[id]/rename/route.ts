import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
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
        const body = (await req.json()) as { name?: string };

        const nextName = body.name?.trim();

        if (!nextName) {
            return NextResponse.json(
                { message: "Name is required" },
                { status: 400 }
            );
        }

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
                name: nextName,
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
        console.error("Failed to rename workflow:", error);

        return NextResponse.json(
            { message: "Failed to rename workflow" },
            { status: 500 }
        );
    }
}