import { ReactNode } from "react";

type AppShellProps = {
    children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="flex min-h-screen bg-[#050505] text-white">
            <aside className="flex w-20 flex-col items-center border-r border-white/10 bg-black py-4">
                <div className="mb-6 text-xs text-white/60">LOGO</div>

                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white/10" />
                    <div className="h-10 w-10 rounded-xl bg-white/10" />
                    <div className="h-10 w-10 rounded-xl bg-white/10" />
                    <div className="h-10 w-10 rounded-xl bg-white/10" />
                </div>

                <div className="mt-auto h-10 w-10 rounded-full bg-white/10" />
            </aside>

            <main className="flex-1">{children}</main>
        </div>
    );
}