"use client";

import { useEditorStore } from "@/store/editor-store";

function formatTime(date: string) {
    return new Date(date).toLocaleTimeString();
}

function formatDuration(ms: number) {
    if (!ms) return "0 ms";
    if (ms < 1000) return `${ms} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
}

function getStatusColor(status: string) {
    if (status === "success") return "text-green-400";
    if (status === "failed") return "text-red-400";
    if (status === "partial") return "text-yellow-400";
    return "text-blue-400";
}

export function EditorHistorySidebar() {
    const runs = useEditorStore((state) => state.runs);
    const selectedRunId = useEditorStore((state) => state.selectedRunId);
    const setSelectedRunId = useEditorStore((state) => state.setSelectedRunId);

    const selectedRun = runs.find((r) => r.id === selectedRunId);

    return (
        <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-4 py-3 text-sm font-medium text-white">
                Run History
            </div>

            {runs.length === 0 ? (
                <div className="flex flex-1 items-center justify-center text-sm text-white/45">
                    No runs yet
                </div>
            ) : (
                <div className="flex flex-1 overflow-hidden">
                    <div className="w-[140px] overflow-y-auto border-r border-white/10">
                        {runs.map((run) => (
                            <button
                                key={run.id}
                                onClick={() => setSelectedRunId(run.id)}
                                className={`w-full px-3 py-3 text-left text-xs transition ${run.id === selectedRunId
                                    ? "bg-white/10 text-white"
                                    : "text-white/60 hover:bg-white/5"
                                    }`}
                            >
                                <div className={`font-medium ${getStatusColor(run.status)}`}>
                                    {run.status.toUpperCase()}
                                </div>

                                <div className="mt-1 text-white/40">
                                    {formatTime(run.createdAt)}
                                </div>

                                <div className="text-white/40">
                                    {formatDuration(run.durationMs)}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-3">
                        {!selectedRun ? (
                            <div className="text-sm text-white/45">
                                Select a run to view details
                            </div>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <div className="text-sm font-medium text-white">
                                        Run Details
                                    </div>

                                    <div className="mt-2 text-xs text-white/50">
                                        Status:{" "}
                                        <span className={getStatusColor(selectedRun.status)}>
                                            {selectedRun.status}
                                        </span>
                                    </div>

                                    <div className="text-xs text-white/50">
                                        Duration: {formatDuration(selectedRun.durationMs)}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {selectedRun.nodeRuns.map((nodeRun) => (
                                        <div
                                            key={nodeRun.nodeId}
                                            className="rounded-lg border border-white/10 bg-white/5 p-3"
                                        >
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="text-white">
                                                    {nodeRun.nodeLabel}
                                                </div>

                                                <div
                                                    className={`font-medium ${getStatusColor(
                                                        nodeRun.status
                                                    )}`}
                                                >
                                                    {nodeRun.status}
                                                </div>
                                            </div>

                                            {nodeRun.output ? (
                                                <div className="mt-2 text-xs text-white/50">
                                                    Output:
                                                    <a
                                                        href={nodeRun.output}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-400 hover:underline ml-2"
                                                    >
                                                        View Output
                                                    </a>
                                                </div>
                                            ) : null}

                                            {nodeRun.error ? (
                                                <div className="mt-2 text-xs text-red-400">
                                                    Error: {nodeRun.error}
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}