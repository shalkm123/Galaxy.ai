export function EmptyState() {
    return (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/55">
                <div className="text-4xl font-semibold text-white/75">Add a node</div>
                <div className="mt-4 text-2xl">
                    Double click, right click, or press{" "}
                    <span className="rounded-lg bg-white/10 px-2 py-1 text-white/80">
                        N
                    </span>
                </div>
            </div>
        </div>
    );
}