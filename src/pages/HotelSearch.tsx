import { useEffect, useMemo, useRef, useState } from "react";
import { Bed, Car, Hotel, Phone, Search, Send, Sparkles, Utensils, Waves } from "lucide-react";
import { managers, masterHotels, systemsLinks, type MasterHotel } from "@/data/hotelMasterData";

type Message = { id: number; type: "bot" | "user"; text: string };

const initialMessage = "أهلاً بك 👋\nأنا مساعد Worm-AI الذكي. اسألني عن الفنادق، المدراء، السياسات، أو الخدمات.";
const finalLine = "أستاذي حاب أحجز لك أو أخدمك خدمة أخرى";
const withClosing = (t: string) => `${t}\n\n${finalLine}`;

const normalize = (text: string) => text.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/\s+/g, " ").trim().toLowerCase();

const formatHotelFull = (hotel: MasterHotel) =>
  `🏨 ${hotel.name}\n🍳 الإفطار: ${hotel.breakfast}\n🏊 المسبح: ${hotel.pool}\n🍽️ المطعم: ${hotel.restaurant}\n🧖 السبا: ${hotel.spa}\n📞 الاستقبال: ${hotel.hotelPhone ?? "غير متوفر"}`;

const generateResponse = (query: string) => {
  const q = normalize(query);
  const matchedBrand = ["بريرا", "بودل", "نارسس", "عابر"].find((brand) => q.includes(normalize(brand)));

  if (["سياسه الالغاء", "سياسة الإلغاء", "الغاء"].some((x) => q.includes(normalize(x)))) return withClosing("سياسة الإلغاء تعتمد على نوع الحجز ومصدره. فضلاً زودني باسم الفندق وتاريخ الوصول للتأكيد الدقيق.");
  if (q.includes("بروتوكول") || q.includes("المكالمات")) return withClosing("بروتوكول المكالمات: الترحيب، التحقق من الطلب، عرض الخيار الأنسب، تأكيد البيانات، ثم الإغلاق بعبارة خدمة إضافية.");

  if (q.includes("مدير") || q.includes("مدراء") || q.includes("ارقام")) {
    let results = managers;
    if (matchedBrand) results = results.filter((admin) => normalize(admin.role).includes(normalize(matchedBrand)));
    if (!results.length) return withClosing("لا يوجد مدراء مطابقين للبحث.");
    return withClosing("📋 قائمة المدراء:\n\n" + results.map((admin) => `👤 ${admin.name}\n🏢 ${admin.role}\n📞 ${admin.phone}`).join("\n\n"));
  }

  if (q.includes("مسبح")) {
    const hotels = masterHotels.filter((h) => h.pool && h.pool !== "-" && (!matchedBrand || normalize(h.brand).includes(normalize(matchedBrand))));
    if (!hotels.length) return withClosing("لا توجد نتائج مسابح مطابقة.");
    return withClosing("🏊 الفنادق التي تحتوي على مسبح:\n\n" + hotels.slice(0, 8).map((h) => `• ${h.name}`).join("\n"));
  }

  const exact = masterHotels.find((hotel) => q.includes(normalize(hotel.name)));
  if (exact) return withClosing(formatHotelFull(exact));

  const suggestions = masterHotels.map((h) => h.name).filter((name) => normalize(name).includes(q.slice(0, 4))).slice(0, 4);
  if (suggestions.length) return withClosing(`هل تقصد:\n${suggestions.map((s) => `• ${s}`).join("\n")}`);

  if (q.includes("نظام") || q.includes("اوبرا")) return withClosing(`روابط الأنظمة:\n${systemsLinks.map((l) => `${l.name}: ${l.url}`).join("\n")}`);

  return withClosing("عذراً لم أجد نتيجة مطابقة، جرّب اسم الفندق أو نوع الخدمة.");
};

const HotelSearch = () => {
  const [messages, setMessages] = useState<Message[]>([{ id: 1, type: "bot", text: initialMessage }]);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const submitMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now(), type: "user", text }]);
    setTimeout(() => setMessages((prev) => [...prev, { id: Date.now() + 1, type: "bot", text: generateResponse(text) }]), 300);
  };

  const filteredHotels = useMemo(() => {
    const q = normalize(searchQuery);
    if (!q) return masterHotels;
    return masterHotels.filter((hotel) => normalize(`${hotel.name} ${hotel.brand} ${hotel.city}`).includes(q));
  }, [searchQuery]);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex h-[calc(100vh-6.5rem)] overflow-hidden rounded-2xl border border-border bg-card/40">
        <aside className="hidden w-80 flex-col border-l border-border bg-card/50 lg:flex">
          <div className="border-b border-border p-4">
            <h2 className="flex items-center gap-2 text-lg font-bold gold-text"><Hotel className="w-5 h-5 text-primary" /> دليل الفروع</h2>
            <div className="relative mt-3"><Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" /><input type="text" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="بحث عن فرع..." className="w-full h-10 rounded-lg bg-secondary border border-border pr-9 pl-3 text-sm" /></div>
          </div>
          <div className="custom-scrollbar flex-1 overflow-y-auto p-3 space-y-2">{filteredHotels.map((hotel) => <button key={hotel.id} onClick={() => submitMessage(hotel.name)} className="w-full text-right rounded-xl border border-border bg-secondary/60 p-3 hover:bg-secondary transition"><div className="flex justify-between"><h3 className="font-semibold text-sm">{hotel.name}</h3><span className="text-[10px] rounded-full px-2 py-0.5 bg-primary/10 text-primary">{hotel.brand}</span></div></button>)}</div>
        </aside>

        <main className="flex-1 flex flex-col">
          <header className="border-b border-border px-4 py-3 flex items-center justify-between bg-background/70"><h1 className="font-bold">Worm-AI</h1><span className="text-xs text-muted-foreground">مساعد بحث ذكي</span></header>
          <div className="custom-scrollbar flex-1 overflow-y-auto p-4 md:p-6 space-y-4">{messages.map((message) => <div key={message.id} className={`flex ${message.type === "user" ? "justify-start" : "justify-end"}`}><div className={`max-w-[90%] md:max-w-[75%] rounded-2xl p-4 text-sm whitespace-pre-line ${message.type === "user" ? "bg-secondary border border-border rounded-tr-none" : "gold-gradient text-primary-foreground rounded-tl-none"}`}>{message.type === "bot" ? <Sparkles className="w-3 h-3 mb-1" /> : null}{message.text}</div></div>)}<div ref={chatEndRef} /></div>
          <div className="no-scrollbar px-4 py-2 overflow-x-auto flex gap-2 border-t border-border">{[{ icon: <Utensils className="w-3 h-3" />, label: "الإفطار", query: "فطور بريرا العليا" }, { icon: <Waves className="w-3 h-3" />, label: "المسبح", query: "ماهي الفنادق التي فيها مسبح بالرياض" }, { icon: <Phone className="w-3 h-3" />, label: "المدراء", query: "جميع أرقام المدراء" }, { icon: <Car className="w-3 h-3" />, label: "السياسة", query: "ما هي سياسة الإلغاء" }, { icon: <Bed className="w-3 h-3" />, label: "البروتوكول", query: "ما هو بروتوكول المكالمات" }].map((button) => <button key={button.label} onClick={() => submitMessage(button.query)} type="button" className="px-3 py-1.5 text-xs rounded-full border border-border bg-secondary/70"><span className="flex items-center gap-1.5">{button.icon}{button.label}</span></button>)}</div>
          <div className="p-3 border-t border-border bg-background/60"><div className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-2"><input type="text" value={inputValue} onChange={(event) => setInputValue(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (submitMessage(inputValue), setInputValue(""))} placeholder="اكتب سؤالك..." className="flex-1 bg-transparent py-2 px-2 text-sm focus:outline-none" /><button onClick={() => { submitMessage(inputValue); setInputValue(""); }} type="button" className="p-2 rounded-lg bg-primary text-primary-foreground"><Send className="w-4 h-4" /></button></div></div>
        </main>
      </div>
    </div>
  );
};

export default HotelSearch;
