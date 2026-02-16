import type { Realtime } from "@inngest/realtime";
import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useEffect, useState } from "react";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";

interface UseNodeStatusOptions {
    nodeId: string;
    channel: string; // Inngest channel name (e.g., "workflow-execution")
    topic: string; // Inngest topic name (e.g., "node-status")
    refreshToken: () => Promise<Realtime.Subscribe.Token>;
};

export function useNodeStatus({ nodeId, channel, topic, refreshToken }: UseNodeStatusOptions) {
    const [status, setStatus] = useState<NodeStatus>("initial");

    // opens a WebSocket connection to Inngest and receives messages in real-time.
    const { data } = useInngestSubscription({refreshToken, enabled: true, });

    useEffect(() => {
        if (!data?.length) return;

        // Find the latest message for this node
        const latestMessage = data
            .filter(msg => 
                msg.kind === "data" &&
                msg.channel === channel && 
                msg.topic === topic && 
                msg.data.nodeId === nodeId
            )// Sort by newest first
            .sort((a, b) => {
                if (a.kind === "data" && b.kind === "data") {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }
                return 0;
            })[0];

        if (latestMessage?.kind === "data") {
            setStatus(latestMessage.data.status as NodeStatus);
        }
    }, [data, channel, topic, nodeId]);

    return status;
};