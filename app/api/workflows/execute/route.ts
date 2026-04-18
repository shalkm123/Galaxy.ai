import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executeWorkflowGraph } from "@/lib/node-execution";
import { getBaseUrl } from "@/lib/get-base-url";
import type { ExecutionRequest } from "@/types/execution";

export async function POST(req: Request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as ExecutionRequest;
    const baseUrl = await getBaseUrl();

    const result = await executeWorkflowGraph(body.nodes, body.edges, baseUrl);

    return NextResponse.json(result);
}