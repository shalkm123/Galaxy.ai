"use client";

import { Mail, Shield, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function LoginScreen() {
    const router = useRouter();

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%)]" />
            <div className="absolute inset-0 bg-black/60" />

            <div className="relative z-10 flex w-[1000px] max-w-[92vw] overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0a0a] shadow-2xl">
                <div className="w-[46%] bg-[#080808] p-8">
                    <h1 className="mb-8 text-4xl font-semibold">Welcome back</h1>

                    <div className="space-y-4">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="flex h-16 w-full items-center justify-center rounded-3xl border border-blue-500 bg-white text-lg font-medium text-black shadow-[0_0_0_2px_rgba(59,130,246,0.5)] transition hover:opacity-95"
                        >
                            Continue with Google
                        </button>

                        <button
                            onClick={() => router.push("/dashboard")}
                            className="flex h-16 w-full items-center justify-center rounded-3xl bg-white text-lg font-medium text-black transition hover:opacity-95"
                        >
                            Continue with Apple
                        </button>

                        <button
                            onClick={() => router.push("/dashboard")}
                            className="flex h-16 w-full items-center justify-center gap-3 rounded-3xl bg-white text-lg font-medium text-black transition hover:opacity-95"
                        >
                            <Shield className="h-5 w-5" />
                            Single Sign-On (SSO)
                        </button>
                    </div>

                    <div className="my-6 text-center text-sm text-white/35">OR</div>

                    <div className="space-y-4">
                        <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/15 bg-transparent px-4 text-white/70">
                            <Mail className="h-5 w-5" />
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full bg-transparent outline-none placeholder:text-white/35"
                            />
                        </div>

                        <button
                            onClick={() => router.push("/dashboard")}
                            className="h-14 w-full rounded-2xl bg-[#0a49c9] text-lg font-medium text-white transition hover:bg-[#0d56e8]"
                        >
                            Continue
                        </button>
                    </div>

                    <p className="mt-8 text-center text-sm leading-6 text-white/45">
                        By continuing, you agree to Krea&apos;s
                        <span className="text-blue-400"> Terms of Use </span>
                        &amp;
                        <span className="text-blue-400"> Privacy Policy</span>.
                    </p>
                </div>

                <div className="relative hidden flex-1 md:block">
                    <img
                        src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop"
                        alt="Landscape"
                        className="h-full w-full object-cover"
                    />
                    <button className="absolute right-4 top-4 rounded-full bg-black/25 p-3 text-white backdrop-blur-sm">
                        <X className="h-6 w-6" />
                    </button>
                </div>
            </div>
        </div>
    );
}