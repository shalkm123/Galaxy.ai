import type { NodeRuntimeStatus } from "@/types/workflow";

/**
 * Returns a CSS class for node glow animation based on runtime status.
 *
 * idle    -> normal node
 * pending -> yellow waiting pulse
 * running -> blue active pulse
 * success -> green success glow
 * failed  -> red error glow
 */
export function getRunClass(status?: NodeRuntimeStatus): string {
    switch (status) {
        case "running":
            return "node-glow-running";
        case "pending":
            return "node-glow-pending";
        case "success":
            return "node-glow-success";
        case "failed":
            return "node-glow-failed";
        default:
            return "node-glow-idle";
    }
}