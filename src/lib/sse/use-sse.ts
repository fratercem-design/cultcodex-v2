"use client";

import { useEffect, useLayoutEffect, useCallback, useRef, useState } from "react";

interface SSEOptions {
  url: string;
  onMessage: (event: { type: string; data: unknown }) => void;
  enabled?: boolean;
}

export type SSEStatus = "open" | "connecting" | "reconnecting";

export function useSSE({
  url,
  onMessage,
  enabled = true,
}: SSEOptions): { status: SSEStatus } {
  const onMessageRef = useRef(onMessage);
  useLayoutEffect(() => { onMessageRef.current = onMessage; });

  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const connectRef = useRef<(() => EventSource | undefined) | undefined>(undefined);

  const [rawStatus, setRawStatus] = useState<SSEStatus>("connecting");
  const [displayStatus, setDisplayStatus] = useState<SSEStatus>("open");

  const connect = useCallback(() => {
    if (!enabled) return;

    setRawStatus("connecting");
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      // First message implies the channel is open.
      setRawStatus("open");
      try {
        const parsed = JSON.parse(event.data);
        onMessageRef.current(parsed);
      } catch {
        // Ignore parse errors (heartbeat pings, etc.)
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setRawStatus("reconnecting");
      reconnectTimeoutRef.current = setTimeout(() => {
        connectRef.current?.();
      }, 5000);
    };

    return eventSource;
  }, [url, enabled]);

  useLayoutEffect(() => { connectRef.current = connect; });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    const eventSource = connect();
    return () => {
      eventSource?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  // Debounce: flip displayStatus to a non-"open" value only after 2s of
  // rawStatus being non-"open". Flip back to "open" instantly.
  useEffect(() => {
    if (rawStatus === "open") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayStatus("open");
      return;
    }
    const t = setTimeout(() => setDisplayStatus(rawStatus), 2000);
    return () => clearTimeout(t);
  }, [rawStatus]);

  return { status: displayStatus };
}
