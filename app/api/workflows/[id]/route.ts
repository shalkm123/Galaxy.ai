import { NextResponse } from "next/server";
import { getWorkflow, updateWorkflow } from "@/lib/mock-workflow-db";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const workflow = getWorkflow(id);

    if (!workflow) {
        return NextResponse.json(
            { message: "Workflow not found" },
            { status: 404 }
        );
    }

    return NextResponse.json(workflow);
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const body = await req.json();
    const { id } = await params;

    const workflow = updateWorkflow(id, body);

    if (!workflow) {
        return NextResponse.json(
            { message: "Workflow not found" },
            { status: 404 }
        );
    }

    return NextResponse.json(workflow);
}