import type { AppFlowNode, WorkflowEdge } from "@/types/workflow";
import type { PersistedWorkflow } from "@/types/persisted-workflow";
import type { EditorTemplate } from "@/store/editor-store";

function stripNodeData<T extends Record<string, unknown>>(data: T): T {
    const cleaned = { ...data };

    delete cleaned.onChange;
    delete cleaned.onUpload;
    delete cleaned.onSystemPromptChange;
    delete cleaned.onUserMessageChange;
    delete cleaned.onFieldChange;
    delete cleaned.onTimestampChange;

    delete cleaned.runStatus;
    delete cleaned.durationMs;
    delete cleaned.error;

    return cleaned;
}

export function serializeWorkflow(params: {
    workflowId: string | null;
    workflowName: string;
    template: EditorTemplate;
    nodes: AppFlowNode[];
    edges: WorkflowEdge[];
}): PersistedWorkflow {
    return {
        id: params.workflowId ?? undefined,
        name: params.workflowName.trim() || "Untitled Workflow",
        template: params.template === "templates" ? "empty" : params.template,
        nodes: params.nodes.map((node) => ({
            ...node,
            data: stripNodeData(node.data as Record<string, unknown>),
        })) as AppFlowNode[],
        edges: params.edges,
    };
}