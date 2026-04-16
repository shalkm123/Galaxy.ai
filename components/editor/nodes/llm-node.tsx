"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { LlmFlowNode } from "@/types/workflow";
import { getRunClass } from "@/lib/node-run-style";

export function LlmNode({ data }: NodeProps<LlmFlowNode>) {
    const systemPrompt = data.resolvedSystemPrompt ?? data.systemPrompt ?? "";
    const userMessage = data.resolvedUserMessage ?? data.userMessage ?? "";

    return (
        <div
            className={`relative w-[320px] rounded-[18px] border border-[#34d399] bg-[#1b1f26] ${getRunClass(
                data.runStatus
            )}`}
        >
            <div className="flex items-center justify-between px-4 pt-3 text-[12px] text-white/55">
                <span>{data.label || "Run Any LLM"}</span>
                <span>{data.runStatus === "running" ? "Running..." : "Text"}</span>
            </div>

            <div className="px-4 pb-4 pt-3">
                <div className="mb-2 text-[12px] text-white/55">Model</div>
                <button className="w-full rounded-[10px] bg-[#11151b] px-3 py-2 text-left text-sm text-white">
                    {data.model || "gemini-1.5-flash"}
                </button>

                <div className="mt-3 text-[12px] text-white/55">
                    System Prompt {data.systemPromptConnected ? "(connected)" : ""}
                </div>
                <textarea
                    value={systemPrompt}
                    disabled={!!data.systemPromptConnected}
                    onChange={(e) => data.onSystemPromptChange?.(e.target.value)}
                    placeholder="Enter system prompt..."
                    className={`mt-2 min-h-[72px] w-full resize-none rounded-[10px] p-3 text-sm outline-none placeholder:text-white/35 ${data.systemPromptConnected
                        ? "bg-[#10141a] text-white/35"
                        : "bg-[#14181f] text-white"
                        }`}
                />

                <div className="mt-3 text-[12px] text-white/55">
                    User Message {data.userMessageConnected ? "(connected)" : ""}
                </div>
                <textarea
                    value={userMessage}
                    disabled={!!data.userMessageConnected}
                    onChange={(e) => data.onUserMessageChange?.(e.target.value)}
                    placeholder="Enter user message..."
                    className={`mt-2 min-h-[90px] w-full resize-none rounded-[10px] p-3 text-sm outline-none placeholder:text-white/35 ${data.userMessageConnected
                        ? "bg-[#10141a] text-white/35"
                        : "bg-[#14181f] text-white"
                        }`}
                />

                <div className="mt-3 text-[12px] text-white/55">
                    Images {data.imagesConnected ? "(connected)" : ""}
                </div>
                <div className="mt-2 rounded-[10px] bg-[#14181f] p-3 text-sm text-white/45">
                    {data.imagesConnected ? "Image input connected" : "No image connected"}
                </div>

                <div className="mt-3 text-[12px] text-white/55">Output</div>
                <div className="mt-2 min-h-[90px] rounded-[10px] bg-[#14181f] p-3 text-sm text-white/45">
                    {data.output || "LLM output will appear here..."}
                </div>
            </div>

            <Handle id="system_prompt" type="target" position={Position.Left} className="!h-3.5 !w-3.5 !border-0 !bg-white" style={{ top: 82 }} />
            <Handle id="user_message" type="target" position={Position.Left} className="!h-3.5 !w-3.5 !border-0 !bg-white" style={{ top: 170 }} />
            <Handle id="images" type="target" position={Position.Left} className="!h-3.5 !w-3.5 !border-0 !bg-[#1e7bff]" style={{ top: 258 }} />
            <Handle id="output" type="source" position={Position.Right} className="!h-3.5 !w-3.5 !border-0 !bg-[#34d399]" style={{ top: 355 }} />
        </div>
    );
}