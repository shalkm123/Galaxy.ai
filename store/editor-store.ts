"use client";

import { create } from "zustand";
import type { AppFlowNode, WorkflowEdge } from "@/types/workflow";

type EditorTemplate = "empty" | "image-generator";

type EditorStore = {
    template: EditorTemplate;
    nodes: AppFlowNode[];
    edges: WorkflowEdge[];
    setTemplate: (template: EditorTemplate) => void;
    setNodes: (nodes: AppFlowNode[]) => void;
    setEdges: (edges: WorkflowEdge[]) => void;
    resetWorkflow: (nodes: AppFlowNode[], edges: WorkflowEdge[]) => void;
};

export const useEditorStore = create<EditorStore>((set) => ({
    template: "empty",
    nodes: [],
    edges: [],
    setTemplate: (template) => set({ template }),
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    resetWorkflow: (nodes, edges) => set({ nodes, edges }),
}));