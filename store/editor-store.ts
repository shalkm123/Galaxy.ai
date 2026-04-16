"use client";

import { create } from "zustand";
import type {
    AppFlowNode,
    WorkflowEdge,
    NodeRuntimeStatus,
} from "@/types/workflow";
import {
    createInitialWorkflowRun,
    finalizeRunStatus,
} from "@/lib/mock-runner";
import { getExecutionOrder, hasCycle } from "@/lib/graph-helpers";
import { serializeWorkflow } from "@/lib/workflow-serializer";
import type { WorkflowRun } from "@/types/run-history";

export type EditorTemplate = "templates" | "empty" | "image-generator";

const STORAGE_KEY = "galaxy-editor-workflow-v1";

type EditorStore = {
    template: EditorTemplate;
    workflowId: string | null;
    workflowName: string;

    nodes: AppFlowNode[];
    edges: WorkflowEdge[];

    runs: WorkflowRun[];
    selectedRunId: string | null;

    isRunning: boolean;
    isSaving: boolean;
    hasHydrated: boolean;

    setTemplate: (template: EditorTemplate) => void;
    setWorkflowId: (workflowId: string | null) => void;
    setWorkflowName: (workflowName: string) => void;

    setNodes: (nodes: AppFlowNode[]) => void;
    setEdges: (edges: WorkflowEdge[]) => void;
    resetWorkflow: (nodes: AppFlowNode[], edges: WorkflowEdge[]) => void;
    loadWorkflow: (payload: {
        id: string;
        name: string;
        template: Exclude<EditorTemplate, "templates">;
        nodes: AppFlowNode[];
        edges: WorkflowEdge[];
    }) => void;

    updateNodeData: (
        nodeId: string,
        updater: (data: AppFlowNode["data"]) => AppFlowNode["data"]
    ) => void;

    setNodeRunStatus: (
        nodeId: string,
        status: NodeRuntimeStatus,
        extra?: Partial<AppFlowNode["data"]>
    ) => void;

    selectRun: (runId: string | null) => void;
    clearRuns: () => void;

    runWorkflow: () => Promise<void>;
    saveWorkflow: () => Promise<void>;

    saveToLocalStorage: () => void;
    loadFromLocalStorage: () => boolean;
    clearSavedWorkflow: () => void;
    setHasHydrated: (value: boolean) => void;
};

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const useEditorStore = create<EditorStore>((set, get) => ({
    template: "templates",
    workflowId: null,
    workflowName: "Untitled Workflow",

    nodes: [],
    edges: [],

    runs: [],
    selectedRunId: null,

    isRunning: false,
    isSaving: false,
    hasHydrated: false,

    setTemplate: (template) => set({ template }),

    setWorkflowId: (workflowId) => set({ workflowId }),

    setWorkflowName: (workflowName) => set({ workflowName }),

    setNodes: (nodes) => set({ nodes }),

    setEdges: (edges) => set({ edges }),

    resetWorkflow: (nodes, edges) =>
        set({
            nodes: nodes.map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    runStatus: "idle",
                    error: undefined,
                    durationMs: undefined,
                },
            })),
            edges,
        }),

    loadWorkflow: (payload) =>
        set({
            workflowId: payload.id,
            workflowName: payload.name,
            template: payload.template,
            nodes: payload.nodes.map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    runStatus: "idle",
                    error: undefined,
                    durationMs: undefined,
                },
            })),
            edges: payload.edges,
            runs: [],
            selectedRunId: null,
        }),

    updateNodeData: (nodeId, updater) =>
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId
                    ? {
                        ...node,
                        data: updater(node.data),
                    }
                    : node
            ),
        })),

    setNodeRunStatus: (nodeId, status, extra = {}) =>
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            ...extra,
                            runStatus: status,
                        },
                    }
                    : node
            ),
        })),

    selectRun: (runId) => set({ selectedRunId: runId }),

    clearRuns: () => set({ runs: [], selectedRunId: null }),

    setHasHydrated: (value) => set({ hasHydrated: value }),

    saveToLocalStorage: () => {
        if (typeof window === "undefined") return;

        const { template, workflowId, workflowName, nodes, edges } = get();

        const payload = {
            template,
            workflowId,
            workflowName,
            nodes: nodes.map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    onChange: undefined,
                    onUpload: undefined,
                    onSystemPromptChange: undefined,
                    onUserMessageChange: undefined,
                    onFieldChange: undefined,
                    onTimestampChange: undefined,
                },
            })),
            edges,
            savedAt: new Date().toISOString(),
        };

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    },

    loadFromLocalStorage: () => {
        if (typeof window === "undefined") return false;

        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;

            const parsed = JSON.parse(raw) as {
                template?: EditorTemplate;
                workflowId?: string | null;
                workflowName?: string;
                nodes?: AppFlowNode[];
                edges?: WorkflowEdge[];
            };

            if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
                return false;
            }

            set({
                template:
                    parsed.template && parsed.template !== "templates"
                        ? parsed.template
                        : "empty",
                workflowId: parsed.workflowId ?? null,
                workflowName: parsed.workflowName ?? "Untitled Workflow",
                nodes: parsed.nodes,
                edges: parsed.edges,
            });

            return true;
        } catch {
            return false;
        }
    },

    clearSavedWorkflow: () => {
        if (typeof window === "undefined") return;
        window.localStorage.removeItem(STORAGE_KEY);
    },

    saveWorkflow: async () => {
        const {
            workflowId,
            workflowName,
            template,
            nodes,
            edges,
        } = get();

        if (template === "templates") return;

        const payload = serializeWorkflow({
            workflowId,
            workflowName,
            template,
            nodes,
            edges,
        });

        set({ isSaving: true });

        try {
            const isUpdate = Boolean(workflowId);
            const endpoint = isUpdate ? `/api/workflows/${workflowId}` : "/api/workflows";
            const method = isUpdate ? "PUT" : "POST";

            const response = await fetch(endpoint, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to save workflow");
            }

            const saved = await response.json();

            set({
                workflowId: saved.id ?? workflowId,
                workflowName: saved.name ?? workflowName,
                isSaving: false,
            });
        } catch (error) {
            console.error(error);
            set({ isSaving: false });
        }
    },

    runWorkflow: async () => {
        const { nodes, edges, isRunning, template } = get();

        if (template === "templates" || isRunning || nodes.length === 0) return;

        const startedAt = Date.now();
        const run = createInitialWorkflowRun(nodes);

        if (hasCycle(nodes, edges)) {
            const failedRun: WorkflowRun = {
                ...run,
                status: "failed",
                durationMs: 0,
                nodeRuns: run.nodeRuns.map((nodeRun) => ({
                    ...nodeRun,
                    status: "failed",
                    error: "Execution blocked: graph contains a cycle.",
                })),
            };

            set((state) => ({
                runs: [failedRun, ...state.runs],
                selectedRunId: failedRun.id,
                nodes: state.nodes.map((node) => ({
                    ...node,
                    data: {
                        ...node.data,
                        runStatus: "failed",
                        error: "Execution blocked: graph contains a cycle.",
                    },
                })),
            }));

            return;
        }

        const orderedNodes = getExecutionOrder(nodes, edges);

        set((state) => ({
            isRunning: true,
            runs: [run, ...state.runs],
            selectedRunId: run.id,
            nodes: state.nodes.map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    runStatus: "pending",
                    error: undefined,
                    durationMs: undefined,
                },
            })),
        }));

        for (const node of orderedNodes) {
            const nodeStart = Date.now();

            set((state) => ({
                nodes: state.nodes.map((n) =>
                    n.id === node.id
                        ? {
                            ...n,
                            data: {
                                ...n.data,
                                runStatus: "running",
                            },
                        }
                        : n
                ),
                runs: state.runs.map((r) =>
                    r.id === run.id
                        ? {
                            ...r,
                            nodeRuns: r.nodeRuns.map((nr) =>
                                nr.nodeId === node.id
                                    ? {
                                        ...nr,
                                        status: "running",
                                        startedAt: new Date().toISOString(),
                                    }
                                    : nr
                            ),
                        }
                        : r
                ),
            }));

            await sleep(700);

            const didFail = false;
            const durationMs = Date.now() - nodeStart;

            const mockOutput =
                node.type === "llmNode"
                    ? `Generated response for ${node.data.userMessage || "input"}`
                    : node.type === "extractFrameNode"
                        ? "Frame extracted successfully"
                        : node.type === "cropImageNode"
                            ? "Image cropped successfully"
                            : node.type === "imageGeneratorNode"
                                ? "Image generated successfully"
                                : node.type === "uploadImageNode"
                                    ? "Image input ready"
                                    : node.type === "uploadVideoNode"
                                        ? "Video input ready"
                                        : node.type === "promptNode"
                                            ? node.data.content || "Prompt ready"
                                            : node.type === "textNode"
                                                ? node.data.content || "Text ready"
                                                : "Completed successfully";

            set((state) => ({
                nodes: state.nodes.map((n) =>
                    n.id === node.id
                        ? {
                            ...n,
                            data: {
                                ...n.data,
                                runStatus: didFail ? "failed" : "success",
                                durationMs,
                                output: didFail ? n.data.output : mockOutput,
                            },
                        }
                        : n
                ),
                runs: state.runs.map((r) =>
                    r.id === run.id
                        ? {
                            ...r,
                            nodeRuns: r.nodeRuns.map((nr) =>
                                nr.nodeId === node.id
                                    ? {
                                        ...nr,
                                        status: didFail ? "failed" : "success",
                                        finishedAt: new Date().toISOString(),
                                        durationMs,
                                        output: didFail ? nr.output : mockOutput,
                                    }
                                    : nr
                            ),
                        }
                        : r
                ),
            }));
        }

        set((state) => ({
            isRunning: false,
            runs: state.runs.map((r) =>
                r.id === run.id
                    ? {
                        ...r,
                        status: finalizeRunStatus(r.nodeRuns),
                        durationMs: Date.now() - startedAt,
                    }
                    : r
            ),
        }));
    },
}));