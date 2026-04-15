import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function DashboardPage() {
    return (
        <DashboardShell>
            <DashboardContent />
        </DashboardShell>
    );
}