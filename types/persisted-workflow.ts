import type { AppFlowNode, WorkflowEdge } from "@/types/workflow";
import type { EditorTemplate } from "@/store/editor-store";

export type PersistedWorkflow = {
    id?: string;
    name: string;
    template: Exclude<EditorTemplate, "templates">;
    nodes: AppFlowNode[];
    edges: WorkflowEdge[];
    createdAt?: string;
    updatedAt?: string;
};