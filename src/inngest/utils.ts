/**
 * INNGEST UTILITIES
 *
 * Helper functions for workflow execution:
 * - topologicalSort: Orders nodes by dependencies
 * - sendWorkflowExecution: Triggers workflow execution via Inngest
 */

import { Connection, Node } from "@/generated/prisma/client";
import toposort from "toposort"; // Library for topological sorting
import { inngest } from "./client";
import { createId } from "@paralleldrive/cuid2";

/**
 * Sort nodes in topological order based on connections
 *
 * Ensures nodes are executed in the correct order:
 * - If A → B (A connects to B), A runs before B
 * - Detects cycles and throws error
 *
 * Example:
 * Nodes: [A, B, C, D]
 * Connections: A→B, A→C, B→D, C→D
 * Result: [A, B, C, D] or [A, C, B, D] (both valid)
 *
 * @param nodes - Array of workflow nodes
 * @param connections - Array of connections between nodes
 * @returns Nodes sorted in execution order
 */
export const topologicalSort = (
  nodes: Node[],
  connections: Connection[],
): Node[] => {
  // If no connections, return nodes as-is (order doesn't matter)
  if (connections.length === 0) {
    return nodes;
  }

  // Create edges array for toposort library
  // Format: [fromNode, toNode] means fromNode must run before toNode
  const edges: [string, string][] = connections.map((conn) => [
    conn.fromNodeId,
    conn.toNodeId,
  ]);

  // Handle disconnected nodes (not in any connection)
  // Add self-referential edges so they're included in the result
  const connectedNodeIds = new Set<string>();
  for (const conn of connections) {
    connectedNodeIds.add(conn.fromNodeId);
    connectedNodeIds.add(conn.toNodeId);
  }

  for (const node of nodes) {
    if (!connectedNodeIds.has(node.id)) {
      edges.push([node.id, node.id]); // Self-edge to include in sort
    }
  }

  // Perform topological sort
  let sortedNodeIds: string[];
  try {
    sortedNodeIds = toposort(edges);
    // Remove duplicates (from self-edges)
    sortedNodeIds = Array.from(new Set(sortedNodeIds));
  } catch (error) {
    // toposort throws on cycles
    if (error instanceof Error && error.message.includes("Cyclic")) {
      throw new Error("Cyclic dependency detected in workflow connections.");
    }
    throw error;
  }

  // Map sorted IDs back to node objects
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  return sortedNodeIds.map((id) => nodeMap.get(id)!).filter(Boolean);
};

/**
 * Send workflow execution event to Inngest
 *
 * This is the entry point for triggering a workflow.
 * Called from tRPC router's execute mutation.
 *
 * @param data.workflowId - ID of workflow to execute
 * @param data.* - Any additional data passed as initialData to the workflow
 */
export const sendWorkflowExecution = async (data: {
  workflowId: string;
  [key: string]: any;
}) => {
  return inngest.send({
    name: "workflows/execute.workflow", // Event name that triggers executeWorkflow function
    data,
    id: createId(), // Unique event ID for deduplication
  });
};
