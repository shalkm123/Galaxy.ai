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
import type { PersistedWorkflow } from "@/types/persisted-workflow";
import type { PersistedWorkflowRun } from "@/types/persisted-run";
import type { PersistedWorkflow } from "@/types/persisted-workflow";
import type { PersistedWorkflowRun } from "@/types/persisted-run";

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
     isLoadingWorkflow: boolean;

    beginWorkflowLoad: () => void;
    loadWorkflowById: (workflowId: string) => Promise<void>;
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

    beginWorkflowLoad: () => void;
    loadWorkflowById: (workflowId: string) => Promise<void>;

    loadRuns: (runs: WorkflowRun[]) => void;
    persistLatestRun: () => Promise<void>;
    fetchRunsForWorkflow: (workflowId: string) => Promise<void>;

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

function sanitizeNodesForEditor(nodes: AppFlowNode[]) {
    return nodes.map((node) => ({
        ...node,
        data: {
            ...node.data,
            runStatus: "idle" as const,
            error: undefined,
            durationMs: undefined,
        },
    }));
}

function mapPersistedRunToWorkflowRun(run: PersistedWorkflowRun): WorkflowRun {
    return {
        id: run.id ?? `run-${Date.now()}`,
        createdAt: run.createdAt ?? new Date().toISOString(),
        status: run.status,
        durationMs: run.durationMs,
        scope: run.scope,
        nodeRuns: run.nodeRuns.map((nodeRun) => ({
            nodeId: nodeRun.nodeId,
            nodeLabel: nodeRun.nodeLabel,
            nodeType: nodeRun.nodeType,
            status: nodeRun.status,
            startedAt: nodeRun.startedAt,
            finishedAt: nodeRun.finishedAt,
            durationMs: nodeRun.durationMs,
            output: nodeRun.output,
            error: nodeRun.error,
        })),
    };
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
    isLoadingWorkflow: false,

    setTemplate: (template) => set({ template }),

    setWorkflowId: (workflowId) => set({ workflowId }),

    setWorkflowName: (workflowName) => set({ workflowName }),

    setNodes: (nodes) => set({ nodes }),

    setEdges: (edges) => set({ edges }),

    resetWorkflow: (nodes, edges) =>
        set({
            nodes: sanitizeNodesForEditor(nodes),
            edges,
        }),

    loadWorkflow: (payload) =>
        set({
            workflowId: payload.id,
            workflowName: payload.name,
            template: payload.template,
            nodes: sanitizeNodesForEditor(payload.nodes),
            edges: payload.edges,
            runs: [],
            selectedRunId: null,
            isLoadingWorkflow: false,
        }),

        beginWorkflowLoad: () =>
        set({
            isLoadingWorkflow: true,
            nodes: [],
            edges: [],
            runs: [],
            selectedRunId: null,
        }),

    loadWorkflowById: async (workflowId) => {
        try {
            const response = await fetch(`/api/workflows/${workflowId}`, {
                method: "GET",
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error("Failed to load workflow");
            }

            const workflow = (await response.json()) as PersistedWorkflow;

            set({
                workflowId: workflow.id ?? workflowId,
                workflowName: workflow.name,
                template: workflow.template,
                nodes: sanitizeNodesForEditor(workflow.nodes),
                edges: workflow.edges,
                runs: [],
                selectedRunId: null,
                hasHydrated: true,
                isLoadingWorkflow: false,
            });

            await get().fetchRunsForWorkflow(workflowId);
        } catch (error) {
            console.error(error);
            set({ isLoadingWorkflow: false });
        }
    },

    loadRuns: (runs) =>
        set({
            runs,
            selectedRunId: runs[0]?.id ?? null,
        }),

         persistLatestRun: async () => {
        const { workflowId, runs } = get();

        if (!workflowId || runs.length === 0) return;

        const latestRun = runs[0];
        const isFinished = latestRun.status !== "running";

        try {
            await fetch(`/api/workflows/${workflowId}/runs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    workflowId,
                    status: latestRun.status,
                    scope: latestRun.scope,
                    durationMs: latestRun.durationMs,
                    finishedAt: isFinished ? new Date().toISOString() : undefined,
                    nodeRuns: latestRun.nodeRuns,
                }),
            });
        } catch (error) {
            console.error(error);
        }
    },

        fetchRunsForWorkflow: async (workflowId) => {
        try {
            const response = await fetch(`/api/workflows/${workflowId}/runs`, {
                method: "GET",
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error("Failed to fetch workflow runs");
            }

            const data = (await response.json()) as PersistedWorkflowRun[];

            set({
                runs: data.map(mapPersistedRunToWorkflowRun),
                selectedRunId: data[0]?.id ?? null,
            });
        } catch (error) {
            console.error(error);
        }
    },

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
                nodes: sanitizeNodesForEditor(parsed.nodes),
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
        const { workflowId, workflowName, template, nodes, edges } = get();

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
            const trySave = async (id: string | null) => {
                const isUpdate = Boolean(id);
                const endpoint = isUpdate ? `/api/workflows/${id}` : "/api/workflows";
                const method = isUpdate ? "PUT" : "POST";

                return fetch(endpoint, {
                    method,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        ...payload,
                        id: id ?? undefined,
                    }),
                });
            };

            let response = await trySave(workflowId);

            if (response.status === 404 && workflowId) {
                response = await trySave(null);
            }

            if (!response.ok) {
                throw new Error("Failed to save workflow");
            }

            const saved = await response.json();

            set({
                workflowId: saved.id ?? null,
                workflowName: saved.name ?? workflowName,
                isSaving: false,
            });
        } catch (error) {
            console.error(error);
            set({ isSaving: false });
        }
    },

        runWorkflow: async () => {
        const { nodes, edges, isRunning, template, workflowId } = get();

        if (template === "templates" || isRunning || nodes.length === 0) return;

        const run = createInitialWorkflowRun(nodes);

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

        try {
            const response = await fetch("/api/workflows/execute", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    workflowId,
                    template,
                    nodes,
                    edges,
                }),
            });

            if (!response.ok) {
                throw new Error("Execution failed");
            }

            const result = await response.json();

            set((state) => ({
                isRunning: false,
                nodes: result.updatedNodes.map((node: AppFlowNode) => {
                    const execution = result.nodeResults.find(
                        (r: { nodeId: string }) => r.nodeId === node.id
                    );

                    return {
                        ...node,
                        data: {
                            ...node.data,
                            runStatus:
                                execution?.status === "success" ? "success" : "failed",
                            durationMs: execution?.durationMs,
                            error: execution?.error,
                            output:
                                execution?.output ?? (node.data as { output?: string }).output,
                        },
                    };
                }),
                runs: state.runs.map((r) =>
                    r.id === run.id
                        ? {
                              ...r,
                              status: result.status,
                              durationMs: result.durationMs,
                              nodeRuns: r.nodeRuns.map((nr) => {
                                  const execution = result.nodeResults.find(
                                      (res: { nodeId: string }) =>
                                          res.nodeId === nr.nodeId
                                  );

                                  return execution
                                      ? {
                                            ...nr,
                                            status: execution.status,
                                            finishedAt: new Date().toISOString(),
                                            durationMs: execution.durationMs,
                                            output: execution.output,
                                            error: execution.error,
                                        }
                                      : nr;
                              }),
                          }
                        : r
                ),
            }));

            await get().persistLatestRun();
        } catch (error) {
            console.error(error);

            set((state) => ({
                isRunning: false,
                runs: state.runs.map((r) =>
                    r.id === run.id
                        ? {
                              ...r,
                              status: "failed",
                              nodeRuns: r.nodeRuns.map((nr) => ({
                                  ...nr,
                                  status: "failed",
                                  error: "Execution request failed",
                              })),
                          }
                        : r
                ),
                nodes: state.nodes.map((node) => ({
                    ...node,
                    data: {
                        ...node.data,
                        runStatus: "failed",
                        error: "Execution request failed",
                    },
                })),
            }));

            await get().persistLatestRun();
        }
    },
}));