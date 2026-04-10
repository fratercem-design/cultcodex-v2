"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSSE } from "@/lib/sse/use-sse";

interface ChatMsg {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  content: string;
  createdAt: string;
}

interface LiveChatProps {
  isLive: boolean;
  isAuthenticated: boolean;
  initialMessages: ChatMsg[];
}

export function LiveChat({ isLive, isAuthenticated, initialMessages }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMsg[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useSSE({
    url: "/api/sse/live/chat",
    enabled: isLive,
    onMessage: (event) => {
      if (event.type === "new-chat-message" && event.data) {
        const msg = event.data as ChatMsg;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/live/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.trim() }),
      });

      if (res.status === 429) {
        setError("Slow down — wait a moment");
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to send");
        return;
      }

      setInput("");
    } catch {
      setError("Network error");
    } finally {
      setSending(false);
    }
  }

  if (!isLive) return null;

  return (
    <div className="flex flex-col rounded-lg border border-border bg-surface overflow-hidden h-[500px]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2 bg-elevated">
        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <span className="font-mono text-xs text-accent-gold uppercase tracking-wider">
          Live Chat
        </span>
        <span className="ml-auto font-mono text-[10px] text-text-muted">
          {messages.length} messages
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-2">
            {msg.avatarUrl ? (
              <Image
                src={msg.avatarUrl}
                alt=""
                width={24}
                height={24}
                className="h-6 w-6 rounded-full object-cover shrink-0 mt-0.5"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-accent-purple/30 shrink-0 mt-0.5 flex items-center justify-center">
                <span className="text-[10px] text-accent-purple font-bold">
                  {msg.displayName[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <Link href={`/user/${msg.userId}`} className="hover:text-accent-gold transition-colors">
                <span className="font-mono text-[10px] text-accent-cyan font-bold">
                  {msg.displayName}
                </span>
              </Link>
              <p className="text-sm text-text-primary break-words">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {isAuthenticated ? (
        <form onSubmit={handleSend} className="border-t border-border p-2 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            maxLength={500}
            className="flex-1 rounded border border-border bg-elevated px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-gold focus:outline-none"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="shrink-0 rounded bg-accent-gold px-3 py-1.5 font-mono text-xs text-void font-bold uppercase disabled:opacity-50 transition-opacity"
          >
            Send
          </button>
        </form>
      ) : (
        <div className="border-t border-border p-3 text-center">
          <a
            href="/auth/signin"
            className="font-mono text-xs text-accent-gold hover:underline"
          >
            Sign in to chat
          </a>
        </div>
      )}

      {error && (
        <div className="px-3 pb-2">
          <p className="font-mono text-[10px] text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
