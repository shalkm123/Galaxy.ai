import { NextResponse } from "next/server";
import { createWorkflow, listWorkflows } from "@/lib/mock-workflow-db";

export async function POST(req: Request) {
    const body = await req.json();
    const workflow = createWorkflow(body);

    return NextResponse.json(workflow);
}

export async function GET() {
    return NextResponse.json(listWorkflows());
}