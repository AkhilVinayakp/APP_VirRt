"use client";

import { useState, useEffect, useRef } from "react";

type Message = {
  id: number;
  author: "you" | "bot";
  text: string;
  timestamp: string;
};

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      <span
        className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      author: "bot",
      text: "Hi, I'm your virtual realtor at FindYourHome 🏡. Tell me where you'd like to live and your budget, and I'll help you find options.",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket("ws://localhost:8000/ws");
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const token = event.data;

      if (token === "[END]") {
        setIsLoading(false);
        setIsThinking(false);
        return;
      }

      setIsThinking(false);

      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        const last = updated[lastIndex];

        if (last && last.author === "bot") {
          updated[lastIndex] = { ...last, text: last.text + token };
        }

        return updated;
      });
    };

    ws.onerror = () => {
      setIsLoading(false);
      setIsThinking(false);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();

    if (!trimmed || !wsRef.current) return;

    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg: Message = {
      id: Date.now(),
      author: "you",
      text: trimmed,
      timestamp: time,
    };

    const botMsg: Message = {
      id: Date.now() + 1,
      author: "bot",
      text: "",
      timestamp: time,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
    setIsLoading(true);
    setIsThinking(true);

    wsRef.current.send(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    // ✅ Fixed full height layout — nothing overflows the viewport
    <main className="flex h-screen overflow-hidden bg-slate-950 text-slate-50">

      {/* ✅ Sidebar — fixed height, only history scrolls */}
      <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-950/70 p-3 md:flex h-full">
        <button className="mb-3 flex-shrink-0 inline-flex items-center justify-center rounded-md border border-emerald-700 bg-emerald-600/90 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">
          + New search
        </button>

        {/* ✅ Only this part scrolls in sidebar */}
        <div className="flex-1 space-y-1 overflow-y-auto text-xs text-slate-400 min-h-0">
          <div className="rounded-md bg-slate-900 px-2 py-2 text-slate-100">
            2 BHK in downtown
          </div>
          <div className="rounded-md px-2 py-2 hover:bg-slate-900">
            Villas under $800k
          </div>
          <div className="rounded-md px-2 py-2 hover:bg-slate-900">
            Beachfront homes
          </div>
        </div>

        <div className="flex-shrink-0 mt-3 border-t border-slate-800 pt-3 text-xs text-slate-500">
          FindYourHome • Virtual Realtor
        </div>
      </aside>

      {/* ✅ Main chat — fixed column, header/footer pinned, only messages scroll */}
      <div className="flex flex-1 flex-col h-full overflow-hidden">

        {/* ✅ Header — never scrolls */}
        <header className="flex-shrink-0 flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-slate-950">
            FYH
          </div>
          <div className="flex-1 px-3">
            <h1 className="text-sm font-semibold text-slate-50">
              FindYourHome
            </h1>
            <p className="text-xs text-slate-400">
              Your AI-powered virtual realtor. Describe your dream home and
              I&apos;ll search for it.
            </p>
          </div>
          <div className="text-xs text-slate-400">Beta</div>
        </header>

        {/* ✅ Only messages scroll */}
        <section className="flex-1 space-y-4 overflow-y-auto px-3 py-4 md:px-8 min-h-0">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.author === "you" ? "justify-end" : "justify-start"
              }`}
            >
              {/* ✅ Skip empty bot messages (while thinking) */}
              {msg.text && (
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    msg.author === "you"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-50"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <span className="mt-1 block text-[10px] text-slate-300/60">
                    {msg.author === "you" ? "You" : "Assistant"} •{" "}
                    {msg.timestamp}
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* ✅ Thinking bubble — no timestamp */}
          {isThinking && (
            <div className="flex justify-start">
              <div className="max-w-[75%] rounded-2xl bg-slate-800 px-3 py-2 text-sm text-slate-50">
                <ThinkingDots />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </section>

        {/* ✅ Footer — never scrolls */}
        <form
          className="flex-shrink-0 border-t border-slate-800 px-3 py-3 md:px-8"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Send a message..."
              className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="submit"
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm text-white"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? "Finding..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}