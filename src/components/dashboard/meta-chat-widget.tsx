"use client";

/**
 * MetaChatWidget — Floating chat bubble + full-tab AI assistant powered by
 * Claude Sonnet 4.6, with tool access to the Meta Ads account.
 *
 * Usage:
 *   <FloatingChatBubble token={token} clientId={clientId} />
 *   <AiAssistantTab token={token} clientId={clientId} />
 */

import { useState, useRef, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
  ts: Date;
}

interface ChatProps {
  token: string | null;
  clientId: string | null;
}

// ---------------------------------------------------------------------------
// Quick-action chips
// ---------------------------------------------------------------------------
const QUICK_ACTIONS = [
  { label: "📊 Show all campaigns", prompt: "Show me all my campaigns with their status and budget" },
  { label: "⏸️ What's paused?", prompt: "What campaigns are currently paused and why should I launch them?" },
  { label: "🚀 Best campaign to launch", prompt: "Which draft campaign should I launch first and why?" },
  { label: "💰 Budget breakdown", prompt: "Give me a full budget breakdown for all campaigns" },
  { label: "🎯 CAPI setup", prompt: "Explain how to get my CAPI score to 10/10" },
  { label: "📈 Scale advice", prompt: "My campaigns are working. How do I scale without killing performance?" },
];

// ---------------------------------------------------------------------------
// Markdown-lite renderer (bold, bullet lists)
// ---------------------------------------------------------------------------
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Bold
    const boldified = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Bullet
    if (line.startsWith("- ") || line.startsWith("• ")) {
      return (
        <li key={i} className="ml-3 list-disc" dangerouslySetInnerHTML={{ __html: boldified.slice(2) }} />
      );
    }
    // Numbered
    if (/^\d+\.\s/.test(line)) {
      return (
        <li key={i} className="ml-3 list-decimal" dangerouslySetInnerHTML={{ __html: boldified.replace(/^\d+\.\s/, "") }} />
      );
    }
    // Heading
    if (line.startsWith("## ")) {
      return <p key={i} className="font-bold text-sm mt-2" dangerouslySetInnerHTML={{ __html: boldified.slice(3) }} />;
    }
    if (line === "") return <br key={i} />;
    return <p key={i} dangerouslySetInnerHTML={{ __html: boldified }} />;
  });
}

// ---------------------------------------------------------------------------
// Chat panel (shared between floating and full tab)
// ---------------------------------------------------------------------------
function ChatPanel({
  token,
  clientId,
  compact = false,
  initialGreeting = true,
}: ChatProps & { compact?: boolean; initialGreeting?: boolean }) {
  const [messages, setMessages] = useState<Message[]>(
    initialGreeting
      ? [{
          id: "init",
          role: "assistant",
          content: "Hey! I'm your Meta Ads AI. I have full access to your campaigns, ad sets, and can push draft campaigns to Meta.\n\nWhat would you like to do?",
          ts: new Date(),
        }]
      : []
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !token) return;
    setError(null);

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text.trim(), ts: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Build message history for API (exclude system init)
    const history = [...messages.filter((m) => m.id !== "init"), userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const qp = clientId ? `?client_id=${clientId}` : "";
      const res = await fetch(`/api/meta/chat${qp}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json() as { reply?: string; error?: string };

      if (data.error) {
        setError(data.error);
        setIsLoading(false);
        return;
      }

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.reply || "Done.",
        ts: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsLoading(false);
    }
  }, [token, clientId, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="text-gray-400 text-sm">Please sign in to use the AI assistant.</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${compact ? "" : "min-h-[500px]"}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xs mr-2 flex-shrink-0 mt-0.5">AI</div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-gray-900 text-white rounded-br-sm"
                  : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="space-y-0.5">{renderMarkdown(msg.content)}</div>
              ) : (
                msg.content
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs ml-2 flex-shrink-0 mt-0.5">You</div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xs flex-shrink-0">AI</div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
            ⚠️ {error}
            {error.includes("ANTHROPIC_API_KEY") && (
              <div className="mt-1 text-red-600 font-medium">
                Add ANTHROPIC_API_KEY to Vercel → Settings → Environment Variables
              </div>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      {messages.length <= 2 && !compact && (
        <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              onClick={() => sendMessage(a.prompt)}
              className="px-2.5 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full border border-gray-200 transition-colors"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={compact ? "Ask anything…" : "Ask me to pause a campaign, change a budget, launch a draft, or explain performance…"}
            rows={compact ? 1 : 2}
            className="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-9 h-9 bg-gray-900 hover:bg-gray-700 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-colors"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          Powered by Claude Sonnet 4.6 · Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Full-width tab version
// ---------------------------------------------------------------------------
export function AiAssistantTab({ token, clientId }: ChatProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm" style={{ height: "600px" }}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-gray-900 to-gray-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">AI</div>
        <div>
          <div className="text-white font-semibold text-sm">Meta Ads AI Assistant</div>
          <div className="text-gray-400 text-xs">Powered by Claude Sonnet 4.6 · Full account access</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="text-green-400 text-xs">Live</span>
        </div>
      </div>

      <ChatPanel token={token} clientId={clientId} compact={false} initialGreeting={true} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Floating bubble
// ---------------------------------------------------------------------------
export function FloatingChatBubble({ token, clientId }: ChatProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && (
        <div className="w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col" style={{ height: "420px" }}>
          {/* Panel header */}
          <div className="px-3 py-2 bg-gradient-to-r from-gray-900 to-gray-800 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold">AI</div>
            <span className="text-white text-xs font-semibold">Meta Ads AI</span>
            <div className="flex items-center gap-1 ml-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              <span className="text-green-400 text-[10px]">Live</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto text-gray-400 hover:text-white transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>
          <ChatPanel token={token} clientId={clientId} compact={true} initialGreeting={true} />
        </div>
      )}

      {/* Bubble button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-200 ${
          open
            ? "bg-gray-700 rotate-45 scale-95"
            : "bg-gradient-to-br from-purple-600 to-blue-600 hover:scale-110"
        }`}
      >
        {open ? (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
