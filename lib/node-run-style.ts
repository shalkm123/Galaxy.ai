import type { NodeRuntimeStatus } from "@/types/workflow";

export function getRunClass(status?: NodeRuntimeStatus) {
    if (status === "running") {
        return "shadow-[0_0_0_1px_rgba(59,130,246,0.5),0_0_22px_rgba(59,130,246,0.35)]";
    }

    if (status === "success") {
        return "shadow-[0_0_0_1px_rgba(34,197,94,0.5),0_0_16px_rgba(34,197,94,0.22)]";
    }

    if (status === "failed") {
        return "shadow-[0_0_0_1px_rgba(239,68,68,0.5),0_0_16px_rgba(239,68,68,0.22)]";
    }

    if (status === "pending") {
        return "shadow-[0_0_0_1px_rgba(245,158,11,0.4),0_0_16px_rgba(245,158,11,0.16)]";
    }

    return "shadow-[0_0_0_1px_rgba(255,255,255,0.06)]";
}