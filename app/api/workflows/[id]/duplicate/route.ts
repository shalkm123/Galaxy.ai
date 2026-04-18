import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function toPrismaJson(
    value: Prisma.JsonValue | null | undefined
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    if (value === null || value === undefined) {
        return Prisma.JsonNull;
    }

    return value as Prisma.InputJsonValue;
}

export async function POST(
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

        const duplicated = await prisma.workflow.create({
            data: {
                userId,
                name: `${existing.name} Copy`,
                template: existing.template,
                nodesJson: toPrismaJson(existing.nodesJson),
                edgesJson: toPrismaJson(existing.edgesJson),
            },
        });

        return NextResponse.json({
            id: duplicated.id,
            name: duplicated.name,
            template: duplicated.template,
            nodes: duplicated.nodesJson,
            edges: duplicated.edgesJson,
            createdAt: duplicated.createdAt,
            updatedAt: duplicated.updatedAt,
        });
    } catch (error) {
        console.error("Failed to duplicate workflow:", error);

        return NextResponse.json(
            { message: "Failed to duplicate workflow" },
            { status: 500 }
        );
    }
}