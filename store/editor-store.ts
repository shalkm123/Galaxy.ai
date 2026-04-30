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
import type { ExecutionResponse } from "@/types/execution";

import {
    WORKFLOW_FRONTEND_TIMEOUT_MS,
    WORKFLOW_POLL_INTERVAL_MS,
    WORKFLOW_TIMEOUT_ERROR,
} from "@/lib/workflow-timeout";

function toNodeRunStatus(status?: NodeRuntimeStatus): NodeRunStatus {
    if (status === "success") return "success";
    if (status === "failed") return "failed";
    if (status === "running") return "running";
    return "pending";
}

export type EditorTemplate =
    | "templates"
    | "empty"
    | "image-generator"
    | "marketing-workflow";

export type ExecutionMode = "full" | "single";

const STORAGE_KEY = "galaxy-editor-workflow-v1";
const ACTIVE_TRIGGER_RUN_KEY = "galaxy-active-trigger-run-v1";

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
    currentTriggerRunId: string | null;

    beginWorkflowLoad: () => void;
    loadWorkflowById: (workflowId: string) => Promise<void>;

    setTemplate: (template: EditorTemplate) => void;
    setWorkflowId: (workflowId: string | null) => void;
    setWorkflowName: (workflowName: string) => void;

    setNodes: (nodes: AppFlowNode[]) => void;
    setEdges: (edges: WorkflowEdge[]) => void;
    setNodesWithoutHistory: (nodes: AppFlowNode[]) => void;
    setEdgesWithoutHistory: (edges: WorkflowEdge[]) => void;
    setCurrentTriggerRunId: (id: string | null) => void;
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
    pollTriggerRun: (
        triggerRunId: string,
        run: WorkflowRun,
        nodesSnapshot: AppFlowNode[],
        runMode: ExecutionMode,
        selectedNodeId: string | null
    ) => Promise<void>;
    saveWorkflow: () => Promise<void>;

    saveActiveTriggerRun: (triggerRunId: string | null) => void;
    loadActiveTriggerRun: () => string | null;
    clearActiveTriggerRun: () => void;

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

function cloneHistoryState(
    nodes: AppFlowNode[],
    edges: WorkflowEdge[]
): HistoryState {
    return {
        nodes: structuredClone(stripNodeCallbacks(nodes)),
        edges: structuredClone(edges),
    };
}

async function fetchJsonWithTimeout<T>(
    url: string,
    options: RequestInit = {},
    timeoutMs = WORKFLOW_FRONTEND_TIMEOUT_MS
): Promise<{
    response: Response;
    data: T | null;
}> {
    const controller = new AbortController();

    const timer = window.setTimeout(() => {
        controller.abort();
    }, timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });

        const data = (await response.json().catch(() => null)) as T | null;

        return {
            response,
            data,
        };
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            throw new Error(WORKFLOW_TIMEOUT_ERROR);
        }

        throw error;
    } finally {
        window.clearTimeout(timer);
    }
}

function buildFailedRun(run: WorkflowRun, message: string): WorkflowRun {
    const now = new Date().toISOString();

    const failedNodeRuns = run.nodeRuns.map((nodeRun) => ({
        ...nodeRun,
        status: "failed" as const,
        error: message,
        finishedAt: now,
    }));

    return {
        ...run,
        status: finalizeRunStatus(failedNodeRuns),
        finishedAt: now,
        nodeRuns: failedNodeRuns,
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
    currentTriggerRunId: null,

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

            const activeTriggerRunId = get().loadActiveTriggerRun();

            if (activeTriggerRunId) {
                set({
                    isRunning: true,
                    currentTriggerRunId: activeTriggerRunId,
                });

                const resumedRun =
                    get().runs[0] ?? createInitialWorkflowRun(get().nodes);

                get()
                    .pollTriggerRun(
                        activeTriggerRunId,
                        resumedRun,
                        get().nodes,
                        get().runMode,
                        get().selectedNodeId
                    )
                    .catch((error) => {
                        console.error("Failed to resume Trigger.dev polling:", error);

                        const message =
                            error instanceof Error
                                ? error.message
                                : WORKFLOW_TIMEOUT_ERROR;

                        const failedRun = buildFailedRun(resumedRun, message);

                        set((state) => ({
                            isRunning: false,
                            currentTriggerRunId: null,
                            nodes: state.nodes.map((node) => ({
                                ...node,
                                data: {
                                    ...node.data,
                                    runStatus: "failed" as const,
                                    error: message,
                                },
                            })),
                            runs: state.runs.map((r) =>
                                r.id === resumedRun.id ? failedRun : r
                            ),
                            selectedRunId: resumedRun.id,
                        }));

                        get().clearActiveTriggerRun();
                    });
            }
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

    setCurrentTriggerRunId: (id) => set({ currentTriggerRunId: id }),

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
                }),
            });

            if (!response.ok) {
                let message = "Failed to persist workflow run";

                try {
                    const errorData = await response.json();
                    message = errorData.message || message;
                } catch {
                    try {
                        message = await response.text();
                    } catch { }
                }

                throw new Error(message);
            }
        } catch (error) {
            console.error("persistRun failed:", error);
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

    pollTriggerRun: async (
        triggerRunId,
        run,
        nodesSnapshot,
        runMode,
        selectedNodeId
    ) => {
        const startedAt = Date.now();

        let finalStatus: string | null = null;
        let finalError: string | null = null;
        let finalOutput:
            | {
                result?: ExecutionResponse;
                persistedRunId?: string | null;
                workflowId?: string | null;
                triggerStatus?: string;
            }
            | null = null;

        while (true) {
            const elapsed = Date.now() - startedAt;

            if (elapsed > WORKFLOW_FRONTEND_TIMEOUT_MS) {
                throw new Error(WORKFLOW_TIMEOUT_ERROR);
            }

            await new Promise((resolve) =>
                setTimeout(resolve, WORKFLOW_POLL_INTERVAL_MS)
            );

            const remainingTime = Math.max(
                WORKFLOW_FRONTEND_TIMEOUT_MS - elapsed,
                1000
            );

            const { response: statusResponse, data: statusResult } =
                await fetchJsonWithTimeout<{
                    status?: string;
                    output?: {
                        result?: ExecutionResponse;
                        persistedRunId?: string | null;
                        workflowId?: string | null;
                        triggerStatus?: string;
                    };
                    error?: string;
                    message?: string;
                }>(
                    `/api/workflows/trigger-runs/${triggerRunId}`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        cache: "no-store",
                    },
                    Math.min(10_000, remainingTime)
                );

            if (!statusResponse.ok) {
                throw new Error(
                    statusResult?.message || "Failed to fetch Trigger.dev run status"
                );
            }

            finalStatus = statusResult?.status ?? null;

            if (finalStatus === "completed") {
                finalOutput = statusResult?.output ?? null;
                break;
            }

            if (
                finalStatus === "failed" ||
                finalStatus === "cancelled" ||
                finalStatus === "canceled" ||
                finalStatus === "crashed"
            ) {
                finalError =
                    statusResult?.error || `Trigger.dev run ${finalStatus}`;
                break;
            }
        }

        if (finalError) {
            throw new Error(finalError);
        }

        if (finalStatus !== "completed") {
            throw new Error(WORKFLOW_TIMEOUT_ERROR);
        }

        const executionResult = finalOutput?.result;

        if (!executionResult) {
            throw new Error("Trigger.dev run completed without workflow result");
        }

        const getNodeRuntimeStatus = (status?: string): NodeRuntimeStatus => {
            if (status === "success") return "success";
            if (status === "failed") return "failed";
            if (status === "running") return "running";
            if (status === "pending") return "pending";
            return "idle";
        };

        const executionResults = Array.isArray(executionResult?.nodeResults)
            ? executionResult.nodeResults
            : [];

        const mergedNodes: AppFlowNode[] = (
            executionResult.updatedNodes as AppFlowNode[]
        ).map((node) => {
            const execution = executionResults.find(
                (r: { nodeId: string }) => r.nodeId === node.id
            );

            return {
                ...node,
                data: {
                    ...node.data,
                    runStatus: execution
                        ? getNodeRuntimeStatus(execution.status)
                        : "idle",
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
            const execution = executionResults.find(
                (r: {
                    nodeId: string;
                    nodeLabel: string;
                    nodeType: string;
                    status: "success" | "failed";
                    startedAt?: string;
                    finishedAt?: string;
                    output?: string;
                    error?: string;
                    durationMs?: number;
                }) => r.nodeId === nodeRun.nodeId
            );

            if (execution) {
                return {
                    ...nodeRun,
                    nodeLabel: execution.nodeLabel ?? nodeRun.nodeLabel,
                    nodeType: execution.nodeType ?? nodeRun.nodeType,
                    status: execution.status,
                    startedAt: execution.startedAt,
                    finishedAt: execution.finishedAt,
                    output: execution.output,
                    error: execution.error,
                    durationMs: execution.durationMs,
                };
            }

            return {
                ...nodeRun,
                status:
                    runMode === "single"
                        ? toNodeRunStatus(
                            nodesSnapshot.find((n) => n.id === nodeRun.nodeId)?.data.runStatus
                        )
                        : nodeRun.status,
            };
        });

        const finishedRun: WorkflowRun = {
            ...run,
            durationMs: executionResult.durationMs ?? Date.now() - startedAt,
            status: finalizeRunStatus(updatedNodeRuns),
            finishedAt: new Date().toISOString(),
            nodeRuns: updatedNodeRuns,
        };

        set((state) => ({
            isRunning: false,
            currentTriggerRunId: null,
            nodes: mergedNodes,
            runs: state.runs.map((r) => (r.id === run.id ? finishedRun : r)),
            selectedRunId: run.id,
        }));

        get().clearActiveTriggerRun();

        const { workflowId } = get();
        if (workflowId) {
            await get().fetchRunsForWorkflow(workflowId);
        }
    },

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
            const { response, data: result } = await fetchJsonWithTimeout<{
                triggerRunId?: string;
                message?: string;
            }>(
                "/api/workflows/execute",
                {
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
                },
                15_000
            );

            if (!response.ok) {
                throw new Error(result?.message || "Execution failed");
            }

            const triggerRunId: string | undefined = result?.triggerRunId;

            if (!triggerRunId) {
                throw new Error("Missing triggerRunId from execution response");
            }

            set({ currentTriggerRunId: triggerRunId });
            get().saveActiveTriggerRun(triggerRunId);

            await get().pollTriggerRun(
                triggerRunId,
                run,
                nodes,
                runMode,
                selectedNodeId
            );
        } catch (error) {
            console.error(error);

            const message =
                error instanceof Error ? error.message : WORKFLOW_TIMEOUT_ERROR;

            const failedRun = buildFailedRun(run, message);

            set((state) => ({
                isRunning: false,
                currentTriggerRunId: null,
                nodes: state.nodes.map((node) => ({
                    ...node,
                    data: {
                        ...node.data,
                        runStatus: "failed" as const,
                        error: message,
                    },
                })),
                runs: state.runs.map((r) => (r.id === run.id ? failedRun : r)),
                selectedRunId: run.id,
            }));

            get().clearActiveTriggerRun();
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

    saveActiveTriggerRun: (triggerRunId) => {
        if (typeof window === "undefined") return;

        if (!triggerRunId) {
            window.localStorage.removeItem(ACTIVE_TRIGGER_RUN_KEY);
            return;
        }

        const { workflowId } = get();

        window.localStorage.setItem(
            ACTIVE_TRIGGER_RUN_KEY,
            JSON.stringify({
                workflowId,
                triggerRunId,
            })
        );
    },

    loadActiveTriggerRun: () => {
        if (typeof window === "undefined") return null;

        const raw = window.localStorage.getItem(ACTIVE_TRIGGER_RUN_KEY);
        if (!raw) return null;

        try {
            const parsed = JSON.parse(raw) as {
                workflowId?: string | null;
                triggerRunId?: string | null;
            };

            const { workflowId } = get();

            if (parsed.workflowId !== workflowId) return null;

            return parsed.triggerRunId ?? null;
        } catch {
            return null;
        }
    },

    clearActiveTriggerRun: () => {
        if (typeof window === "undefined") return;
        window.localStorage.removeItem(ACTIVE_TRIGGER_RUN_KEY);
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