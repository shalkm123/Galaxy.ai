import type { NodeRuntimeStatus } from "@/types/workflow";
import type { NodeRunStatus } from "@/types/run-history";

export function toNodeRunStatus(status?: NodeRuntimeStatus): NodeRunStatus {
    switch (status) {
        case "running":
            return "running";
        case "success":
            return "success";
        case "failed":
            return "failed";
        case "pending":
            return "pending";
        case "idle":
        default:
            return "pending"; // 🔥 key fix
    }
}