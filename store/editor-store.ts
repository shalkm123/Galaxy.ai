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
import { serializeWorkflow } from "@/lib/workflow-serializer";

import type { WorkflowRun, NodeRunStatus } from "@/types/run-history";
import type { PersistedWorkflow } from "@/types/persisted-workflow";
import type { PersistedWorkflowRun } from "@/types/persisted-run";

function toNodeRunStatus(status?: NodeRuntimeStatus): NodeRunStatus {
    if (status === "success") return "success";
    if (status === "failed") return "failed";
    if (status === "running") return "running";
    return "pending";
}

export type EditorTemplate = "templates" | "empty" | "image-generator";
export type ExecutionMode = "full" | "single";

const STORAGE_KEY = "galaxy-editor-workflow-v1";

type HistoryState = {
    nodes: AppFlowNode[];
    edges: WorkflowEdge[];
};

type EditorStore = {
    template: EditorTemplate;
    workflowId: string | null;
    workflowName: string;

    nodes: AppFlowNode[];
    edges: WorkflowEdge[];

    runs: WorkflowRun[];
    selectedRunId: string | null;

    selectedNodeId: string | null;
    runMode: ExecutionMode;

    history: HistoryState[];
    future: HistoryState[];

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
    setNodesWithoutHistory: (nodes: AppFlowNode[]) => void;
    setEdgesWithoutHistory: (edges: WorkflowEdge[]) => void;
    resetWorkflow: (nodes: AppFlowNode[], edges: WorkflowEdge[]) => void;

    loadWorkflow: (payload: {
        id: string;
        name: string;
        template: Exclude<EditorTemplate, "templates">;
        nodes: AppFlowNode[];
        edges: WorkflowEdge[];
    }) => void;

    loadRuns: (runs: WorkflowRun[]) => void;
    persistRun: (run: WorkflowRun) => Promise<void>;
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
    setSelectedRunId: (runId: string | null) => void;

    setSelectedNodeId: (id: string | null) => void;
    setRunMode: (mode: ExecutionMode) => void;

    clearRuns: () => void;

    pushToHistory: () => void;
    undo: () => void;
    redo: () => void;
    clearHistory: () => void;

    runWorkflow: () => Promise<void>;
    saveWorkflow: () => Promise<void>;

    saveToLocalStorage: () => void;
    loadFromLocalStorage: () => boolean;
    clearSavedWorkflow: () => void;
    setHasHydrated: (value: boolean) => void;
};

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
        id: run.id,
        status: run.status,
        scope: run.scope,
        durationMs: run.durationMs,
        createdAt: run.createdAt,
        finishedAt: run.finishedAt ?? undefined,
        nodeRuns: run.nodeRuns,
    };
}

function stripNodeCallbacks(nodes: AppFlowNode[]): AppFlowNode[] {
    return nodes.map((node) => {
        const data = { ...node.data } as Record<string, unknown>;

        delete data.onChange;
        delete data.onUpload;
        delete data.onSystemPromptChange;
        delete data.onUserMessageChange;
        delete data.onFieldChange;
        delete data.onTimestampChange;
        delete data.onPromptChange;

        return {
            ...node,
            data: data as AppFlowNode["data"],
        };
    });
}

function cloneHistoryState(nodes: AppFlowNode[], edges: WorkflowEdge[]): HistoryState {
    return {
        nodes: structuredClone(stripNodeCallbacks(nodes)),
        edges: structuredClone(edges),
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

    selectedNodeId: null,
    runMode: "full",

    history: [],
    future: [],

    isRunning: false,
    isSaving: false,
    hasHydrated: false,
    isLoadingWorkflow: false,

    beginWorkflowLoad: () =>
        set({
            isLoadingWorkflow: true,
            nodes: [],
            edges: [],
            runs: [],
            selectedRunId: null,
            selectedNodeId: null,
            runMode: "full",
            history: [],
            future: [],
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
                selectedNodeId: null,
                runMode: "full",
                hasHydrated: true,
                isLoadingWorkflow: false,
                history: [],
                future: [],
            });

            await get().fetchRunsForWorkflow(workflowId);
        } catch (error) {
            console.error(error);
            set({ isLoadingWorkflow: false });
        }
    },

    setTemplate: (template) => set({ template }),
    setWorkflowId: (workflowId) => set({ workflowId }),
    setWorkflowName: (workflowName) => set({ workflowName }),

    pushToHistory: () => {
        const { nodes, edges, history } = get();

        set({
            history: [...history, cloneHistoryState(nodes, edges)],
            future: [],
        });
    },

    undo: () => {
        const { history, future, nodes, edges } = get();

        if (history.length === 0) return;

        const previous = history[history.length - 1];
        const newHistory = history.slice(0, -1);

        set({
            nodes: previous.nodes,
            edges: previous.edges,
            history: newHistory,
            future: [cloneHistoryState(nodes, edges), ...future],
        });
    },

    redo: () => {
        const { history, future, nodes, edges } = get();

        if (future.length === 0) return;

        const next = future[0];
        const newFuture = future.slice(1);

        set({
            nodes: next.nodes,
            edges: next.edges,
            history: [...history, cloneHistoryState(nodes, edges)],
            future: newFuture,
        });
    },

    clearHistory: () => set({ history: [], future: [] }),

    setNodesWithoutHistory: (nodes) => set({ nodes }),
    setEdgesWithoutHistory: (edges) => set({ edges }),

    setNodes: (nodes) => {
        get().pushToHistory();
        set({ nodes });
    },

    setEdges: (edges) => {
        get().pushToHistory();
        set({ edges });
    },

    resetWorkflow: (nodes, edges) =>
        set({
            nodes: sanitizeNodesForEditor(nodes),
            edges,
            selectedNodeId: null,
            runMode: "full",
            history: [],
            future: [],
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
            selectedNodeId: null,
            runMode: "full",
            isLoadingWorkflow: false,
            history: [],
            future: [],
        }),

    loadRuns: (runs) =>
        set({
            runs,
            selectedRunId: runs[0]?.id ?? null,
        }),

    persistRun: async (run) => {
        const { workflowId } = get();

        if (!workflowId) return;

        const isFinished = run.status !== "running";

        try {
            const response = await fetch(`/api/workflows/${workflowId}/runs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    workflowId,
                    status: run.status,
                    scope: run.scope,
                    durationMs: run.durationMs,
                    finishedAt: isFinished
                        ? run.finishedAt ?? new Date().toISOString()
                        : undefined,
                    nodeRuns: run.nodeRuns,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to persist workflow run");
            }
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

    setNodeRunStatus: (nodeId, status, extra) =>
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            runStatus: status,
                            ...extra,
                        },
                    }
                    : node
            ),
        })),

    selectRun: (runId) => set({ selectedRunId: runId }),
    setSelectedRunId: (runId) => set({ selectedRunId: runId }),

    setSelectedNodeId: (id) => set({ selectedNodeId: id }),
    setRunMode: (mode) => set({ runMode: mode }),

    clearRuns: () =>
        set({
            runs: [],
            selectedRunId: null,
        }),

    runWorkflow: async () => {
        const {
            nodes,
            edges,
            isRunning,
            template,
            workflowId,
            runMode,
            selectedNodeId,
        } = get();

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
                    runStatus: "pending" as const,
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
                    mode: runMode ?? "full",
                    selectedNodeId: selectedNodeId ?? null,
                }),
            });

            if (!response.ok) {
                throw new Error("Execution failed");
            }

            const result = await response.json();

            const getNodeRuntimeStatus = (
                status?: string
            ): NodeRuntimeStatus => {
                if (status === "success") return "success";
                if (status === "failed") return "failed";
                if (status === "running") return "running";
                if (status === "pending") return "pending";
                return "idle";
            };

            const mergedNodes: AppFlowNode[] = (
                result.updatedNodes as AppFlowNode[]
            ).map((node) => {
                const execution = result.nodeResults.find(
                    (r: { nodeId: string }) => r.nodeId === node.id
                );

                return {
                    ...node,
                    data: {
                        ...node.data,
                        runStatus: getNodeRuntimeStatus(execution?.status),
                        error: execution?.error,
                        durationMs: execution?.durationMs,
                        output:
                            execution?.output !== undefined
                                ? execution.output
                                : node.data.output,
                    },
                };
            });

            const updatedNodeRuns = run.nodeRuns.map((nodeRun) => {
                const execution = result.nodeResults.find(
                    (r: {
                        nodeId: string;
                        status: "success" | "failed";
                        output?: string;
                        error?: string;
                        durationMs?: number;
                    }) => r.nodeId === nodeRun.nodeId
                );

                return execution
                    ? {
                        ...nodeRun,
                        status: execution.status,
                        output: execution.output,
                        error: execution.error,
                        durationMs: execution.durationMs,
                        finishedAt: new Date().toISOString(),
                    }
                    : {
                        ...nodeRun,
                        status:
                            runMode === "single" && selectedNodeId && nodeRun.nodeId !== selectedNodeId
                                ? toNodeRunStatus(
                                    nodes.find((n) => n.id === nodeRun.nodeId)?.data.runStatus
                                )
                                : nodeRun.status,
                    };
            });

            const finishedRun: WorkflowRun = {
                ...run,
                durationMs: result.durationMs,
                status: finalizeRunStatus(updatedNodeRuns),
                finishedAt: new Date().toISOString(),
                nodeRuns: updatedNodeRuns,
            };

            set((state) => ({
                isRunning: false,
                nodes: mergedNodes,
                runs: state.runs.map((r) => (r.id === run.id ? finishedRun : r)),
                selectedRunId: run.id,
            }));

            await get().persistRun(finishedRun);
        } catch (error) {
            console.error(error);

            const failedNodeRuns = run.nodeRuns.map((nodeRun) => ({
                ...nodeRun,
                status: "failed" as const,
                error: "Execution failed",
                finishedAt: new Date().toISOString(),
            }));

            const failedRun: WorkflowRun = {
                ...run,
                status: finalizeRunStatus(failedNodeRuns),
                finishedAt: new Date().toISOString(),
                nodeRuns: failedNodeRuns,
            };

            set((state) => ({
                isRunning: false,
                nodes: state.nodes.map((node) => ({
                    ...node,
                    data: {
                        ...node.data,
                        runStatus: "failed" as const,
                        error: "Execution failed",
                    },
                })),
                runs: state.runs.map((r) => (r.id === run.id ? failedRun : r)),
                selectedRunId: run.id,
            }));

            await get().persistRun(failedRun);
        }
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

    saveToLocalStorage: () => {
        if (typeof window === "undefined") return;

        const {
            template,
            workflowId,
            workflowName,
            nodes,
            edges,
            selectedNodeId,
            runMode,
        } = get();

        if (template === "templates") return;

        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                template,
                workflowId,
                workflowName,
                nodes,
                edges,
                selectedNodeId,
                runMode,
            })
        );
    },

    loadFromLocalStorage: () => {
        if (typeof window === "undefined") return false;

        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;

        try {
            const parsed = JSON.parse(raw) as {
                template?: EditorTemplate;
                workflowId?: string | null;
                workflowName?: string;
                nodes: AppFlowNode[];
                edges: WorkflowEdge[];
                selectedNodeId?: string | null;
                runMode?: ExecutionMode;
            };

            set({
                template:
                    parsed.template && parsed.template !== "templates"
                        ? parsed.template
                        : "empty",
                workflowId: parsed.workflowId ?? null,
                workflowName: parsed.workflowName ?? "Untitled Workflow",
                nodes: sanitizeNodesForEditor(parsed.nodes),
                edges: parsed.edges,
                selectedNodeId: parsed.selectedNodeId ?? null,
                runMode: parsed.runMode ?? "full",
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

    setHasHydrated: (value) => set({ hasHydrated: value }),
}));