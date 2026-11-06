import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Check,
  Copy,
  MessageCircle,
  RotateCcw,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import { streamReply } from "../chatbot/groq";
import { SUGGESTIONS, WELCOME_MESSAGE } from "../chatbot/knowledge";
import Markdown from "../chatbot/Markdown";

const STORAGE_KEY = "yp-chat-v1";
const TEASER_KEY = "yp-chat-teaser-seen";
const MAX_INPUT = 1000;

const WELCOME = { id: "welcome", role: "assistant", content: WELCOME_MESSAGE };

const uid = () => Math.random().toString(36).slice(2, 10);

function loadMessages() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {
    // Storage blocked or corrupt: start fresh.
  }
  return [WELCOME];
}

const isMobile = () => window.matchMedia("(max-width: 639px)").matches;

function Avatar({ size = "w-8 h-8" }) {
  return (
    <div
      className={`${size} shrink-0 rounded-xl overflow-hidden bg-white ring-1 ring-slate-200 shadow-sm`}
    >
      <img
        src="/assets/app_logo.webp"
        loading="lazy"
        alt=""
        width="512"
        height="512"
        className="w-full h-full object-contain"
      />
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1" aria-label="Assistant is typing">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="w-2 h-2 rounded-full bg-emerald-500/70 animate-bounce"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-700 transition-colors"
      aria-label="Copy answer"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function ChatWidget({ initialOpen = false }) {
  const [open, setOpen] = useState(initialOpen);
  const [messages, setMessages] = useState(loadMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [unread, setUnread] = useState(false);
  const [teaser, setTeaser] = useState(false);

  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const stickToBottom = useRef(true);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Persist the conversation for this browser tab.
  useEffect(() => {
    if (streaming) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Storage unavailable: chat still works, it just won't survive reloads.
    }
  }, [messages, streaming]);

  // Friendly nudge once per session, a few seconds after landing.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(TEASER_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen) return;
    const t = setTimeout(() => setTeaser(true), 6000);
    return () => clearTimeout(t);
  }, []);

  const dismissTeaser = () => {
    setTeaser(false);
    try {
      sessionStorage.setItem(TEASER_KEY, "1");
    } catch {
      // ignore
    }
  };

  const openChat = () => {
    setOpen(true);
    setUnread(false);
    dismissTeaser();
  };

  // Focus, Escape to close, and lock page scroll while full-screen on phones.
  useEffect(() => {
    if (!open) return;
    const focus = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 120);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    if (isMobile()) document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(focus);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Follow new text unless the user has scrolled up to read.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const onScroll = () => {
    const el = scrollRef.current;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  // Auto-grow the textarea up to ~5 lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [input]);

  const updateMessage = (id, patch) =>
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  async function send(raw, base = messages) {
    const text = raw.trim().slice(0, MAX_INPUT);
    if (!text || streaming) return;

    const userMsg = { id: uid(), role: "user", content: text };
    const botId = uid();
    const history = [
      ...base.filter((m) => m.id !== "welcome" && !m.error && m.content),
      userMsg,
    ];

    setMessages((ms) => [...ms, userMsg, { id: botId, role: "assistant", content: "", pending: true }]);
    setInput("");
    setStreaming(true);
    stickToBottom.current = true;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const reply = await streamReply(history, {
        signal: controller.signal,
        onToken: (t) => updateMessage(botId, { content: t }),
        onStatus: (status) => updateMessage(botId, { status }),
      });
      if (!reply.trim()) throw new Error("empty");
      updateMessage(botId, { content: reply, pending: false, status: null });
      if (!openRef.current) setUnread(true);
    } catch (err) {
      if (err.name === "AbortError") {
        setMessages((ms) =>
          ms
            .filter((m) => !(m.id === botId && !m.content))
            .map((m) => (m.id === botId ? { ...m, pending: false } : m)),
        );
      } else {
        updateMessage(botId, {
          pending: false,
          status: null,
          content: "",
          error: err.message && err.message !== "empty" ? err.message : "I couldn't generate a reply. Please try again.",
          retryable: err.retryable !== false,
          retryText: text,
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function retry(msg) {
    // Drop the failed reply and the question that triggered it; send re-adds it.
    const i = messages.findIndex((m) => m.id === msg.id);
    const base = messages.filter((_, j) => j !== i && j !== i - 1);
    setMessages(base);
    send(msg.retryText, base);
  }

  function newChat() {
    abortRef.current?.abort();
    setMessages([WELCOME]);
    setInput("");
    inputRef.current?.focus();
  }

  const onNavigate = () => {
    if (isMobile()) setOpen(false);
  };

  const showSuggestions = messages.length === 1 && !streaming;

  return (
    <>
      {/* TEASER BUBBLE */}
      {teaser && !open && (
        <div
          className="fixed bottom-24 right-5 z-40 max-w-[250px] rounded-2xl rounded-br-md bg-white px-4 py-3 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-200"
          style={{ animation: "slide-up 0.35s ease-out" }}
        >
          <button
            onClick={dismissTeaser}
            className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-white ring-1 ring-slate-200 shadow flex items-center justify-center text-slate-400 hover:text-slate-700"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
          <button onClick={openChat} className="text-left">
            <div className="text-sm font-bold text-slate-900">Questions about earning? 👋</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Ask our AI assistant for general plan and policy guidance.
            </div>
          </button>
        </div>
      )}

      {/* LAUNCHER */}
      <button
        onClick={() => (open ? setOpen(false) : openChat())}
        className={`fixed bottom-5 right-5 z-40 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-600/30 transition-all duration-300 hover:scale-105 active:scale-95 ${open ? "max-sm:hidden" : ""}`}
        style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 45%, #7c3aed 100%)" }}
        aria-label={open ? "Close chat" : "Chat with YouPeak Assistant"}
        aria-expanded={open}
      >
        {!open && (
          <span className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping [animation-duration:2.5s]" />
        )}
        <span className={`relative transition-transform duration-300 ${open ? "rotate-90" : ""}`}>
          {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" fill="rgba(255,255,255,0.15)" />}
        </span>
        {unread && !open && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-500 ring-2 ring-white" />
        )}
      </button>

      {/* PANEL */}
      {open && (
        <div
          role="dialog"
          aria-label="YouPeak Assistant chat"
          className="fixed z-[60] inset-0 sm:inset-auto sm:bottom-24 sm:right-5 sm:w-[400px] sm:h-[min(660px,calc(100vh-8rem))] flex flex-col bg-white sm:rounded-3xl shadow-2xl shadow-slate-900/25 sm:ring-1 sm:ring-slate-200 overflow-hidden"
          style={{ animation: "slide-up 0.3s ease-out", height: isMobile() ? "100dvh" : undefined }}
        >
          {/* HEADER */}
          <div
            className="relative flex items-center gap-3 px-4 py-3.5 text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #059669 0%, #0d9488 50%, #6d28d9 100%)" }}
          >
            <div className="relative">
              <Avatar size="w-11 h-11" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-black text-base leading-tight flex items-center gap-1.5">
                YouPeak Assistant
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <div className="text-[11px] text-white/80 mt-0.5">
                {streaming ? "Typing…" : "AI guidance · Verify important details"}
              </div>
            </div>
            <button
              onClick={newChat}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/15 transition-colors"
              aria-label="Start a new chat"
              title="New chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/15 transition-colors"
              aria-label="Close chat"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* MESSAGES */}
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="flex-1 overflow-y-auto overscroll-contain bg-slate-50 px-4 py-5 space-y-4"
            aria-live="polite"
          >
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div
                    className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-[14px] leading-relaxed text-white whitespace-pre-wrap break-words shadow-md shadow-emerald-600/15"
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                  >
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex items-start gap-2.5">
                  <Avatar />
                  <div className="min-w-0 max-w-[85%]">
                    {m.error ? (
                      <div className="rounded-2xl rounded-tl-md bg-rose-50 ring-1 ring-rose-200 px-4 py-3 text-[13px] text-rose-700">
                        {m.error}
                        {m.retryable && (
                          <button
                            onClick={() => retry(m)}
                            disabled={streaming}
                            className="mt-2 flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-900 disabled:opacity-50"
                          >
                            <RotateCcw className="w-3 h-3" /> Try again
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="rounded-2xl rounded-tl-md bg-white ring-1 ring-slate-200/80 shadow-sm px-4 py-3 text-[14px] leading-relaxed text-slate-700 break-words">
                          {m.content ? (
                            <Markdown text={m.content} onNavigate={onNavigate} />
                          ) : m.status ? (
                            <div className="flex items-center gap-2 text-[13px] text-slate-500">
                              <TypingDots />
                              {m.status}
                            </div>
                          ) : (
                            <TypingDots />
                          )}
                        </div>
                        {!m.pending && m.content && m.id !== "welcome" && (
                          <div className="mt-1.5 pl-1">
                            <CopyButton text={m.content} />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ),
            )}

            {showSuggestions && (
              <div className="pt-1 pl-[42px]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Popular questions
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-[13px] font-medium text-emerald-800 bg-white ring-1 ring-emerald-200 hover:bg-emerald-50 hover:ring-emerald-300 rounded-xl px-3 py-2 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COMPOSER */}
          <div className="shrink-0 border-t border-slate-200 bg-white px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-end gap-2 rounded-2xl bg-slate-50 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-emerald-400 px-3 py-2 transition-shadow"
            >
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={MAX_INPUT}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask about earning, payouts, passes…"
                aria-label="Type your question"
                className="flex-1 resize-none bg-transparent text-[16px] sm:text-[14px] leading-6 text-slate-900 placeholder:text-slate-400 outline-none py-1 max-h-[132px]"
              />
              {streaming ? (
                <button
                  type="button"
                  onClick={() => abortRef.current?.abort()}
                  className="w-9 h-9 shrink-0 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-700 transition-colors"
                  aria-label="Stop generating"
                  title="Stop"
                >
                  <Square className="w-3.5 h-3.5" fill="currentColor" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-9 h-9 shrink-0 rounded-xl text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                  aria-label="Send message"
                >
                  <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                </button>
              )}
            </form>
            <p className="text-[10.5px] text-slate-400 text-center mt-2 leading-snug">
              AI answers can be imperfect. For account help email{" "}
              <a href="mailto:support@youpeak.org" className="underline hover:text-slate-600">
                support@youpeak.org
              </a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
