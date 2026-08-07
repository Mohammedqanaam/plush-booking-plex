import { useEffect, useRef, useState } from "react";
import { Bot, Send, X } from "lucide-react";
import { api } from "@/lib/api";

type Message = { role: "user" | "assistant"; content: string };

const AiChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, open]);

  const appendMessage = (message: Message) => {
    setMessages((current) => [...current, message].slice(-40));
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    appendMessage(userMsg);
    setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const data = await api.sendChatMessage(text, sessionId, history);
      if (data.sessionId) setSessionId(data.sessionId);
      appendMessage({ role: "assistant", content: data.reply || "..." });
    } catch (err) {
      console.error("[AiChat] sendChatMessage error:", err);
      appendMessage({ role: "assistant", content: "تعذر الاتصال بالمساعد الآن. حاول مرة أخرى." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "إغلاق المساعد الذكي" : "فتح المساعد الذكي"}
        className="ai-chat-toggle fixed bottom-4 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-2xl text-primary-foreground"
      >
        {open ? <X className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </button>

      {open && (
        <section className="ai-chat-panel fixed bottom-20 left-4 z-50 flex max-h-[min(620px,72vh)] w-[calc(100vw-2rem)] flex-col overflow-hidden sm:w-[400px]" aria-label="المساعد الذكي">
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5 text-white">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10"><Bot className="w-5 h-5" /></span>
            <div>
              <span className="block text-sm font-extrabold">المساعد الذكي</span>
              <span className="block text-[10px] text-white/60">مساعد الإدارة</span>
            </div>
          </div>

          <div className="custom-scrollbar flex-1 space-y-2.5 overflow-y-auto bg-background/95 p-3.5 text-sm" aria-live="polite">
            {messages.length === 0 && (
              <p className="py-7 text-center text-xs leading-6 text-muted-foreground">
                اسأل عن إجراءات الحجز أو اطلب مساعدة سريعة.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`ai-chat-message max-w-[86%] whitespace-pre-wrap px-3 py-2.5 ${
                    m.role === "user"
                      ? "ai-chat-message--user"
                      : "ai-chat-message--assistant"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="ai-chat-message ai-chat-message--assistant px-3 py-2.5 text-xs text-muted-foreground animate-pulse">
                  جارٍ تجهيز الرد…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            className="flex items-center gap-2 border-t border-border/70 bg-background px-3 py-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-secondary/50 px-3 text-sm"
              placeholder="اكتب طلبك…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              maxLength={4000}
              dir="auto"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="إرسال"
              className="gold-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      )}
    </>
  );
};

export default AiChat;
