import type { PersistedWorkflow } from "@/types/persisted-workflow";

type StoredWorkflow = PersistedWorkflow & {
    id: string;
    createdAt: string;
    updatedAt: string;
};

const globalForWorkflows = globalThis as typeof globalThis & {
    __galaxyWorkflows?: Map<string, StoredWorkflow>;
};

const workflowStore =
    globalForWorkflows.__galaxyWorkflows ??
    (globalForWorkflows.__galaxyWorkflows = new Map<string, StoredWorkflow>());

export function listWorkflows(): StoredWorkflow[] {
    return Array.from(workflowStore.values()).sort(
        (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

export function getWorkflow(id: string): StoredWorkflow | null {
    return workflowStore.get(id) ?? null;
}

export function createWorkflow(payload: PersistedWorkflow): StoredWorkflow {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const workflow: StoredWorkflow = {
        ...payload,
        id,
        createdAt: now,
        updatedAt: now,
    };

    workflowStore.set(id, workflow);
    return workflow;
}

export function updateWorkflow(
    id: string,
    payload: PersistedWorkflow
): StoredWorkflow | null {
    const existing = workflowStore.get(id);
    if (!existing) return null;

    const updated: StoredWorkflow = {
        ...existing,
        ...payload,
        id,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
    };

    workflowStore.set(id, updated);
    return updated;
}