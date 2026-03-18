"use client";

import { useState } from "react";

type Message = {
  id: number;
  author: "you" | "bot";
  text: string;
  timestamp: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      author: "bot",
      text: "Hi, I&apos;m your virtual realtor at FindYourHome 🏡. Tell me where you&apos;d like to live and your budget, and I&apos;ll help you find options.",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

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

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data: { reply: string } = await res.json();

      const botMsg: Message = {
        id: Date.now() + 1,
        author: "bot",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: Date.now() + 2,
        author: "bot",
        text: "Sorry, I couldn&apos;t reach the FindYourHome service. Please check that the backend is running on http://localhost:8000.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="flex min-h-screen bg-slate-950 text-slate-50">
      {/* Left sidebar - FindYourHome navigation */}
      <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-950/70 p-3 md:flex">
        <button className="mb-3 inline-flex items-center justify-center rounded-md border border-emerald-700 bg-emerald-600/90 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">
          + New search
        </button>
        <div className="flex-1 space-y-1 overflow-y-auto text-xs text-slate-400">
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
        <div className="mt-3 border-t border-slate-800 pt-3 text-xs text-slate-500">
          FindYourHome • Virtual Realtor
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-slate-950">
            FYH
          </div>
          <div className="flex-1 px-3">
            <h1 className="text-sm font-semibold text-slate-50">FindYourHome</h1>
            <p className="text-xs text-slate-400">
              Your AI-powered virtual realtor. Describe your dream home and I&apos;ll search for it.
            </p>
          </div>
          <div className="text-xs text-slate-400">Beta</div>
        </header>

        <section className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950 px-3 py-4 md:px-8">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.author === "you" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-md ${
                  msg.author === "you"
                    ? "rounded-br-sm bg-emerald-600 text-white shadow-emerald-900/50"
                    : "rounded-bl-sm bg-slate-800 text-slate-50 shadow-slate-950/40"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                <span className="mt-1 block text-[10px] text-slate-300/60">
                  {msg.author === "you" ? "You" : "Assistant"} • {msg.timestamp}
                </span>
              </div>
            </div>
          ))}
        </section>

        <form
          className="border-t border-slate-800 bg-slate-950/95 px-3 py-3 md:px-8"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Send a message..."
              className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none ring-0 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/60"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-emerald-900/60 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
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

