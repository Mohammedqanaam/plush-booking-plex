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
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const data = await api.sendChatMessage(text, sessionId, history);
      if (data.sessionId) setSessionId(data.sessionId);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "..." }]);
    } catch (err) {
      console.error("[AiChat] sendChatMessage error:", err);
      setMessages((prev) => [...prev, { role: "assistant", content: "حدث خطأ أثناء الاتصال بالمساعد." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "إغلاق المساعد الذكي" : "فتح المساعد الذكي"}
        className="fixed bottom-20 left-4 z-50 w-12 h-12 rounded-full gold-gradient text-primary-foreground shadow-lg flex items-center justify-center transition-transform hover:scale-105"
      >
        {open ? <X className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-36 left-4 z-50 w-80 sm:w-96 max-h-[60vh] flex flex-col rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border gold-gradient text-primary-foreground">
            <Bot className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm">المساعد الذكي</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
            {messages.length === 0 && (
              <p className="text-center text-muted-foreground text-xs py-6">
                مرحباً! كيف يمكنني مساعدتك؟
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl whitespace-pre-wrap ${
                    m.role === "user"
                      ? "gold-gradient text-primary-foreground rounded-br-sm"
                      : "bg-secondary text-foreground rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary text-muted-foreground px-3 py-2 rounded-xl rounded-bl-sm text-xs animate-pulse">
                  جارٍ الكتابة...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            className="flex items-center gap-2 px-3 py-2 border-t border-border"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              className="flex-1 h-9 rounded-lg bg-secondary border border-border px-3 text-sm focus:outline-none"
              placeholder="اكتب رسالتك..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              dir="auto"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="إرسال"
              className="w-9 h-9 rounded-lg gold-gradient text-primary-foreground flex items-center justify-center disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AiChat;
