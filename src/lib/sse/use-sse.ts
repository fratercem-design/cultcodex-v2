"use client";

import { useEffect, useCallback, useRef } from "react";

interface SSEOptions {
  url: string;
  onMessage: (event: { type: string; data: unknown }) => void;
  enabled?: boolean;
}

export function useSSE({ url, onMessage, enabled = true }: SSEOptions) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const connect = useCallback(() => {
    if (!enabled) return;

    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onMessageRef.current(parsed);
      } catch {
        // Ignore parse errors (heartbeat pings, etc.)
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      // Reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };

    return eventSource;
  }, [url, enabled]);

  useEffect(() => {
    const eventSource = connect();
    return () => {
      eventSource?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);
}
