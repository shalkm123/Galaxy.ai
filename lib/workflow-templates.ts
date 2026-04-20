import type { AppFlowNode, WorkflowEdge } from "@/types/workflow";

export function getEmptyWorkflow() {
    return {
        nodes: [] as AppFlowNode[],
        edges: [] as WorkflowEdge[],
    };
}

export function getImageGeneratorWorkflow() {
    const nodes: AppFlowNode[] = [
        {
            id: "prompt-1",
            type: "promptNode",
            position: { x: 120, y: 140 },
            data: {
                label: "Prompt",
                content: "A serene landscape with mountains",
                runStatus: "idle",
            },
        },
        {
            id: "image-gen-1",
            type: "imageGeneratorNode",
            position: { x: 520, y: 140 },
            data: {
                label: "Krea-1",
                model: "Krea1",
                prompt: "A serene landscape with mountains",
                imageUrl:
                    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1000&auto=format&fit=crop",
                runStatus: "idle",
            },
        },
    ];

    const edges: WorkflowEdge[] = [
        {
            id: "e-prompt-image",
            source: "prompt-1",
            sourceHandle: "prompt-output",
            target: "image-gen-1",
            targetHandle: "prompt",
            animated: true,
            style: { stroke: "#c9a300", strokeWidth: 3 },
        },
    ];

    return { nodes, edges };
}

export function getMarketingWorkflow() {
    const nodes: AppFlowNode[] = [
        {
            id: "upload-image-1",
            type: "uploadImageNode",
            position: { x: 80, y: 120 },
            data: {
                label: "Upload Image",
                imageUrl: "",
                runStatus: "idle",
            },
        },
        {
            id: "crop-image-1",
            type: "cropImageNode",
            position: { x: 360, y: 120 },
            data: {
                label: "Crop Image",
                imageUrl: "",
                xPercent: "10",
                yPercent: "10",
                widthPercent: "80",
                heightPercent: "80",
                runStatus: "idle",
            },
        },
        {
            id: "text-system-1",
            type: "textNode",
            position: { x: 80, y: 360 },
            data: {
                label: "System Prompt",
                content:
                    "You are a professional marketing copywriter. Write a compelling product description based on the provided product details and image.",
                runStatus: "idle",
            },
        },
        {
            id: "text-product-1",
            type: "textNode",
            position: { x: 360, y: 360 },
            data: {
                label: "Product Details",
                content:
                    "Product: Wireless Bluetooth Headphones\nFeatures: Noise cancellation, 30-hour battery, foldable design, premium sound quality.",
                runStatus: "idle",
            },
        },
        {
            id: "llm-product-1",
            type: "llmNode",
            position: { x: 700, y: 220 },
            data: {
                label: "Product Description LLM",
                model: "gemini-2.0-flash",
                systemPrompt: "",
                userMessage: "",
                output: "",
                runStatus: "idle",
            },
        },
        {
            id: "upload-video-1",
            type: "uploadVideoNode",
            position: { x: 80, y: 640 },
            data: {
                label: "Upload Video",
                videoUrl: "",
                runStatus: "idle",
            },
        },
        {
            id: "extract-frame-1",
            type: "extractFrameNode",
            position: { x: 360, y: 640 },
            data: {
                label: "Extract Frame",
                videoUrl: "",
                timestamp: "50%",
                outputImageUrl: "",
                runStatus: "idle",
            },
        },
        {
            id: "text-system-2",
            type: "textNode",
            position: { x: 1020, y: 120 },
            data: {
                label: "Social Prompt",
                content:
                    "You are a social media manager. Create a short marketing post using the product description and the provided visual inputs.",
                runStatus: "idle",
            },
        },
        {
            id: "llm-summary-2",
            type: "llmNode",
            position: { x: 1320, y: 260 },
            data: {
                label: "Marketing Summary LLM",
                model: "gemini-1.5-flash",
                systemPrompt: "",
                userMessage: "",
                output: "",
                runStatus: "idle",
            },
        },
    ];

    const edges: WorkflowEdge[] = [
        {
            id: "e-upload-image-crop",
            source: "upload-image-1",
            sourceHandle: "image-output",
            target: "crop-image-1",
            targetHandle: "image_url",
            animated: true,
            style: { stroke: "#c9a300", strokeWidth: 3 },
        },
        {
            id: "e-text-system-llm1",
            source: "text-system-1",
            sourceHandle: "text-output",
            target: "llm-product-1",
            targetHandle: "system_prompt",
            animated: true,
            style: { stroke: "#c9a300", strokeWidth: 3 },
        },
        {
            id: "e-text-product-llm1",
            source: "text-product-1",
            sourceHandle: "text-output",
            target: "llm-product-1",
            targetHandle: "user_message",
            animated: true,
            style: { stroke: "#c9a300", strokeWidth: 3 },
        },
        {
            id: "e-crop-llm1-images",
            source: "crop-image-1",
            sourceHandle: "image-output",
            target: "llm-product-1",
            targetHandle: "images",
            animated: true,
            style: { stroke: "#c9a300", strokeWidth: 3 },
        },
        {
            id: "e-upload-video-frame",
            source: "upload-video-1",
            sourceHandle: "video-output",
            target: "extract-frame-1",
            targetHandle: "video_url",
            animated: true,
            style: { stroke: "#c9a300", strokeWidth: 3 },
        },
        {
            id: "e-text-system-llm2",
            source: "text-system-2",
            sourceHandle: "text-output",
            target: "llm-summary-2",
            targetHandle: "system_prompt",
            animated: true,
            style: { stroke: "#c9a300", strokeWidth: 3 },
        },
        {
            id: "e-llm1-llm2-user",
            source: "llm-product-1",
            sourceHandle: "text-output",
            target: "llm-summary-2",
            targetHandle: "user_message",
            animated: true,
            style: { stroke: "#c9a300", strokeWidth: 3 },
        },
        {
            id: "e-crop-llm2-images",
            source: "crop-image-1",
            sourceHandle: "image-output",
            target: "llm-summary-2",
            targetHandle: "images",
            animated: true,
            style: { stroke: "#c9a300", strokeWidth: 3 },
        },
        {
            id: "e-frame-llm2-images",
            source: "extract-frame-1",
            sourceHandle: "image-output",
            target: "llm-summary-2",
            targetHandle: "images",
            animated: true,
            style: { stroke: "#c9a300", strokeWidth: 3 },
        },
    ];

    return { nodes, edges };
}