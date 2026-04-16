"use client";

import { useMemo } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    Loader2,
    XCircle,
} from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import type { NodeRunDetail, WorkflowRun } from "@/types/run-history";

function getRunBadge(run: WorkflowRun) {
    if (run.status === "running") {
        return "border border-blue-400/20 bg-blue-500/15 text-blue-300";
    }

    if (run.status === "success") {
        return "border border-emerald-400/20 bg-emerald-500/15 text-emerald-300";
    }

    if (run.status === "failed") {
        return "border border-red-400/20 bg-red-500/15 text-red-300";
    }

    return "border border-amber-400/20 bg-amber-500/15 text-amber-300";
}

function getNodeStatusIcon(status: NodeRunDetail["status"]) {
    if (status === "running") {
        return <Loader2 className="h-4 w-4 animate-spin text-blue-300" />;
    }

    if (status === "success") {
        return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
    }

    if (status === "failed") {
        return <XCircle className="h-4 w-4 text-red-300" />;
    }

    return <Clock3 className="h-4 w-4 text-white/35" />;
}

function formatDuration(durationMs?: number) {
    if (durationMs === undefined) return "—";
    if (durationMs < 1000) return `${durationMs} ms`;
    return `${(durationMs / 1000).toFixed(1)} s`;
}

function formatTime(value?: string) {
    if (!value) return "—";

    return new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

export function EditorHistorySidebar() {
    const runs = useEditorStore((state) => state.runs);
    const selectedRunId = useEditorStore((state) => state.selectedRunId);
    const selectRun = useEditorStore((state) => state.selectRun);
    const clearRuns = useEditorStore((state) => state.clearRuns);
    const isRunning = useEditorStore((state) => state.isRunning);

    const selectedRun = useMemo(() => {
        if (!selectedRunId) return runs[0] ?? null;
        return runs.find((run) => run.id === selectedRunId) ?? runs[0] ?? null;
    }, [runs, selectedRunId]);

    return (
        <aside className="flex h-full w-[360px] flex-col bg-[#0f1115]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
                <div>
                    <div className="text-sm font-semibold text-white">Run History</div>
                    <div className="mt-1 text-xs text-white/45">
                        {isRunning
                            ? "Workflow is running..."
                            : `${runs.length} run${runs.length === 1 ? "" : "s"}`}
                    </div>
                </div>

                <button
                    onClick={clearRuns}
                    disabled={runs.length === 0}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${runs.length === 0
                            ? "cursor-not-allowed bg-white/5 text-white/25"
                            : "bg-white/8 text-white/70 hover:bg-white/12"
                        }`}
                >
                    Clear
                </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-[150px_minmax(0,1fr)]">
                <div className="overflow-y-auto border-r border-white/10">
                    {runs.length === 0 ? (
                        <div className="p-4 text-xs text-white/35">
                            No workflow runs yet.
                        </div>
                    ) : (
                        <div className="p-2">
                            {runs.map((run) => {
                                const active = selectedRun?.id === run.id;

                                return (
                                    <button
                                        key={run.id}
                                        onClick={() => selectRun(run.id)}
                                        className={`mb-2 w-full rounded-xl border px-3 py-3 text-left transition ${active
                                                ? "border-white/15 bg-white/10"
                                                : "border-white/5 bg-white/[0.03] hover:bg-white/[0.06]"
                                            }`}
                                    >
                                        <div className="truncate text-xs font-medium text-white">
                                            {run.id}
                                        </div>

                                        <div className="mt-2">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${getRunBadge(
                                                    run
                                                )}`}
                                            >
                                                {run.status}
                                            </span>
                                        </div>

                                        <div className="mt-2 text-[11px] text-white/45">
                                            {formatTime(run.createdAt)}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="min-h-0 overflow-y-auto">
                    {!selectedRun ? (
                        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-white/35">
                            Run details will appear here.
                        </div>
                    ) : (
                        <div className="p-4">
                            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-semibold text-white">
                                            {selectedRun.id}
                                        </div>
                                        <div className="mt-1 text-xs text-white/45">
                                            Started at {formatTime(selectedRun.createdAt)}
                                        </div>
                                    </div>

                                    <span
                                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${getRunBadge(
                                            selectedRun
                                        )}`}
                                    >
                                        {selectedRun.status}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-[#14181f] p-3">
                                        <div className="text-[11px] text-white/45">Scope</div>
                                        <div className="mt-1 text-sm text-white">
                                            {selectedRun.scope}
                                        </div>
                                    </div>

                                    <div className="rounded-xl bg-[#14181f] p-3">
                                        <div className="text-[11px] text-white/45">Duration</div>
                                        <div className="mt-1 text-sm text-white">
                                            {formatDuration(selectedRun.durationMs)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                                    <AlertTriangle className="h-4 w-4 text-white/50" />
                                    Node Runs
                                </div>

                                <div className="space-y-3">
                                    {selectedRun.nodeRuns.map((nodeRun) => (
                                        <div
                                            key={nodeRun.nodeId}
                                            className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-medium text-white">
                                                        {nodeRun.nodeLabel}
                                                    </div>
                                                    <div className="mt-1 text-xs text-white/45">
                                                        {nodeRun.nodeType}
                                                    </div>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-2">
                                                    {getNodeStatusIcon(nodeRun.status)}
                                                    <span className="text-xs text-white/60">
                                                        {nodeRun.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-4 grid grid-cols-3 gap-2">
                                                <Stat
                                                    label="Started"
                                                    value={formatTime(nodeRun.startedAt)}
                                                />
                                                <Stat
                                                    label="Finished"
                                                    value={formatTime(nodeRun.finishedAt)}
                                                />
                                                <Stat
                                                    label="Duration"
                                                    value={formatDuration(nodeRun.durationMs)}
                                                />
                                            </div>

                                            {nodeRun.output ? (
                                                <div className="mt-4 rounded-xl bg-[#14181f] p-3">
                                                    <div className="text-[11px] text-white/45">
                                                        Output
                                                    </div>
                                                    <div className="mt-1 whitespace-pre-wrap text-sm text-white/75">
                                                        {nodeRun.output}
                                                    </div>
                                                </div>
                                            ) : null}

                                            {nodeRun.error ? (
                                                <div className="mt-4 rounded-xl border border-red-400/10 bg-red-500/10 p-3">
                                                    <div className="text-[11px] text-red-200/70">
                                                        Error
                                                    </div>
                                                    <div className="mt-1 text-sm text-red-100/80">
                                                        {nodeRun.error}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl bg-[#14181f] p-3">
            <div className="text-[11px] text-white/45">{label}</div>
            <div className="mt-1 text-xs text-white/75">{value}</div>
        </div>
    );
}