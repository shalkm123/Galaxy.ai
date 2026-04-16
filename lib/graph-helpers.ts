import type { AppFlowNode, WorkflowEdge } from "@/types/workflow";

export function getIncomingEdges(nodeId: string, edges: WorkflowEdge[]) {
    return edges.filter((edge) => edge.target === nodeId);
}

export function getOutgoingEdges(nodeId: string, edges: WorkflowEdge[]) {
    return edges.filter((edge) => edge.source === nodeId);
}

export function getStartNodes(nodes: AppFlowNode[], edges: WorkflowEdge[]) {
    const targetIds = new Set(edges.map((edge) => edge.target));
    return nodes.filter((node) => !targetIds.has(node.id));
}

export function hasCycle(nodes: AppFlowNode[], edges: WorkflowEdge[]) {
    const adjacency = new Map<string, string[]>();
    const visited = new Set<string>();
    const visiting = new Set<string>();

    for (const node of nodes) {
        adjacency.set(node.id, []);
    }

    for (const edge of edges) {
        const list = adjacency.get(edge.source);
        if (list) list.push(edge.target);
    }

    function dfs(nodeId: string): boolean {
        if (visiting.has(nodeId)) return true;
        if (visited.has(nodeId)) return false;

        visiting.add(nodeId);

        for (const next of adjacency.get(nodeId) ?? []) {
            if (dfs(next)) return true;
        }

        visiting.delete(nodeId);
        visited.add(nodeId);
        return false;
    }

    for (const node of nodes) {
        if (dfs(node.id)) return true;
    }

    return false;
}

export function getExecutionOrder(
    nodes: AppFlowNode[],
    edges: WorkflowEdge[]
): AppFlowNode[] {
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const node of nodes) {
        inDegree.set(node.id, 0);
        adjacency.set(node.id, []);
    }

    for (const edge of edges) {
        adjacency.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }

    const queue: string[] = nodes
        .filter((node) => (inDegree.get(node.id) ?? 0) === 0)
        .map((node) => node.id);

    const orderedIds: string[] = [];

    while (queue.length > 0) {
        const current = queue.shift()!;
        orderedIds.push(current);

        for (const next of adjacency.get(current) ?? []) {
            const nextDegree = (inDegree.get(next) ?? 0) - 1;
            inDegree.set(next, nextDegree);

            if (nextDegree === 0) {
                queue.push(next);
            }
        }
    }

    if (orderedIds.length !== nodes.length) {
        return [];
    }

    return orderedIds
        .map((id) => nodeMap.get(id))
        .filter((node): node is AppFlowNode => Boolean(node));
}

export function wouldCreateCycle(
    nodes: AppFlowNode[],
    edges: WorkflowEdge[],
    nextEdge: WorkflowEdge
) {
    return hasCycle(nodes, [...edges, nextEdge]);
}