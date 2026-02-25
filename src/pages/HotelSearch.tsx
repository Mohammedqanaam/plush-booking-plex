import { useEffect, useMemo, useRef, useState } from "react";
import { Bed, Car, Hotel, Phone, Search, Send, Sparkles, Utensils, Waves } from "lucide-react";
import { managers, masterHotels, systemsLinks, type MasterHotel } from "@/data/hotelMasterData";

type Message = {
  id: number;
  type: "bot" | "user";
  text: string;
};

type IntentKey =
  | "breakfast"
  | "pool"
  | "coffee"
  | "restaurant"
  | "view"
  | "parking"
  | "meeting"
  | "wedding"
  | "gym"
  | "laundry"
  | "outdoor"
  | "spa"
  | "jacuzzi"
  | "kids"
  | "rooms"
  | "phone"
  | "managers"
  | "systems"
  | "list";

const initialMessage =
  "أهلاً بك 👋\nأنا مساعد Worm-AI (نسخة بحث ذكية).\nاكتب اسم أي فرع مع نوع الخدمة مثل: فطور، مسبح، سبا، قاعة، بكج عرسان، غرف، رقم.";

const normalizeArabic = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value: string) => normalizeArabic(value).split(" ").filter(Boolean);

const INTENT_KEYWORDS: Record<IntentKey, string[]> = {
  breakfast: ["فطور", "افطار", "بوفيه", "سحور"],
  pool: ["مسبح", "مسابح", "سباحه"],
  coffee: ["كوفي", "قهوه", "شيشه", "لاونج"],
  restaurant: ["مطعم", "عشاء", "غداء", "منيو"],
  view: ["اطلاله", "اطلالة", "بلكونه", "بلكونة"],
  parking: ["موقف", "مواقف", "سياره", "سيارات"],
  meeting: ["قاعه", "قاعة", "اجتماع", "اجتماعات"],
  wedding: ["عرسان", "زواج", "باقه", "بكج"],
  gym: ["نادي", "جيم", "fitness"],
  laundry: ["غسيل", "مغسله", "مغسلة", "laundry"],
  outdoor: ["جلسات", "خارجيه", "خارجيه"],
  spa: ["سبا", "spa"],
  jacuzzi: ["جاكوزي", "بانيو"],
  kids: ["اطفال", "الاطفال", "قسم الاطفال"],
  rooms: ["غرف", "غرفة", "مساحه", "مساحة", "room"],
  phone: ["رقم", "تلفون", "اتصال", "واتساب"],
  managers: ["مدير", "مدراء", "اداره", "الاداره"],
  systems: ["اوبرا", "نظام", "رابط", "روابط"],
  list: ["قائمه", "قائمة", "فنادق", "فروع"],
};

const detectIntent = (query: string): IntentKey | null => {
  const normalized = normalizeArabic(query);
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [IntentKey, string[]][]) {
    if (keywords.some((word) => normalized.includes(normalizeArabic(word)))) {
      return intent;
    }
  }
  return null;
};

const scoreHotelMatch = (query: string, hotel: MasterHotel) => {
  const queryTokens = tokenize(query);
  const nameTokens = tokenize(`${hotel.name} ${hotel.brand} ${hotel.city}`);
  const joined = normalizeArabic(`${hotel.name} ${hotel.brand}`);

  let score = 0;
  queryTokens.forEach((token) => {
    if (nameTokens.includes(token)) score += 3;
    if (joined.includes(token)) score += 1;
  });

  if (normalizeArabic(query).includes(normalizeArabic(hotel.name))) score += 10;
  return score;
};

const findBestHotel = (query: string) => {
  const ranked = masterHotels
    .map((hotel) => ({ hotel, score: scoreHotelMatch(query, hotel) }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score > 1 ? ranked[0].hotel : null;
};

const formatHotelFull = (hotel: MasterHotel) =>
  `🏨 **${hotel.name}**\n\n🍳 الإفطار: ${hotel.breakfast}\n🏊 المسبح: ${hotel.pool}\n☕ الكوفي شوب: ${hotel.coffeeShop}\n🍽️ المطعم: ${hotel.restaurant}\n🌇 الإطلالة/البلكونة: ${hotel.viewBalcony}\n🚗 المواقف: ${hotel.parking}\n🏛️ القاعة: ${hotel.meetingHall}\n💍 بكج العرسان: ${hotel.weddingPackage}\n🏋️ النادي: ${hotel.gym}\n🧺 الغسيل: ${hotel.laundry}\n🌴 الجلسات الخارجية: ${hotel.outdoorSeating}\n🧖 السبا: ${hotel.spa}\n🛁 الجاكوزي/البانيو: ${hotel.jacuzzi}\n🧒 قسم الأطفال: ${hotel.kidsSection}\n📞 الاستقبال: ${hotel.hotelPhone ?? "غير متوفر"}`;

const HotelSearch = () => {
  const [messages, setMessages] = useState<Message[]>([{ id: 1, type: "bot", text: initialMessage }]);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateResponse = (query: string) => {
    const intent = detectIntent(query);

    if (intent === "managers") {
      const contacts = managers
        .map((admin) => `👤 ${admin.name} (${admin.role})\n📞 ${admin.phone}`)
        .join("\n\n");
      return `📋 **تقرير المدراء (داخلي):**\n\n${contacts}\n\n⚠️ لا يتم مشاركة هذه الأرقام مع العميل.`;
    }

    if (intent === "systems") {
      return `🔗 **روابط الأنظمة:**\n\n${systemsLinks[0].name}: ${systemsLinks[0].url}\n\n${systemsLinks[1].name}: ${systemsLinks[1].url}`;
    }

    if (intent === "list") {
      return `لدينا ${masterHotels.length} فرع في قاعدة البيانات. يمكنك اختيار فرع من القائمة أو كتابة اسمه مباشرة.`;
    }

    const hotel = findBestHotel(query);
    if (!hotel) {
      return "لم أتعرف على الفرع بدقة. اكتب اسم الفرع بشكل أوضح (مثال: بريرا العليا) مع نوع الطلب.";
    }

    if (intent === "phone") return `📞 **${hotel.name}**\nالاستقبال: ${hotel.hotelPhone ?? "غير متوفر"}\nالمبيعات: ${hotel.salesPhone ?? "غير متوفر"}`;
    if (intent === "rooms") return `🛏️ **${hotel.name}**\n${hotel.roomTypes ?? "لا توجد تفاصيل غرف مرفقة حالياً."}`;
    if (intent === "breakfast") return `🍳 **${hotel.name}**\n${hotel.breakfast}`;
    if (intent === "pool") return `🏊 **${hotel.name}**\n${hotel.pool}`;
    if (intent === "coffee") return `☕ **${hotel.name}**\n${hotel.coffeeShop}`;
    if (intent === "restaurant") return `🍽️ **${hotel.name}**\n${hotel.restaurant}`;
    if (intent === "view") return `🌇 **${hotel.name}**\n${hotel.viewBalcony}`;
    if (intent === "parking") return `🚗 **${hotel.name}**\n${hotel.parking}`;
    if (intent === "meeting") return `🏛️ **${hotel.name}**\n${hotel.meetingHall}`;
    if (intent === "wedding") return `💍 **${hotel.name}**\n${hotel.weddingPackage}`;
    if (intent === "gym") return `🏋️ **${hotel.name}**\n${hotel.gym}`;
    if (intent === "laundry") return `🧺 **${hotel.name}**\n${hotel.laundry}`;
    if (intent === "outdoor") return `🌴 **${hotel.name}**\n${hotel.outdoorSeating}`;
    if (intent === "spa") return `🧖 **${hotel.name}**\n${hotel.spa}`;
    if (intent === "jacuzzi") return `🛁 **${hotel.name}**\n${hotel.jacuzzi}`;
    if (intent === "kids") return `🧒 **${hotel.name}**\n${hotel.kidsSection}`;

    return formatHotelFull(hotel);
  };

  const submitMessage = (text: string) => {
    if (!text.trim()) return;
    const userMessage: Message = { id: Date.now(), type: "user", text };
    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      const response = generateResponse(text);
      setMessages((prev) => [...prev, { id: Date.now() + 1, type: "bot", text: response }]);
    }, 350);
  };

  const handleSendMessage = () => {
    submitMessage(inputValue);
    setInputValue("");
  };

  const filteredHotels = useMemo(() => {
    const q = normalizeArabic(searchQuery);
    if (!q) return masterHotels;
    return masterHotels.filter((hotel) => normalizeArabic(`${hotel.name} ${hotel.brand} ${hotel.city}`).includes(q));
  }, [searchQuery]);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex h-[calc(100vh-6.5rem)] overflow-hidden rounded-2xl border border-border bg-card/40">
        <aside className="hidden w-80 flex-col border-l border-border bg-card/50 lg:flex">
          <div className="border-b border-border p-4">
            <h2 className="flex items-center gap-2 text-lg font-bold gold-text">
              <Hotel className="w-5 h-5 text-primary" />
              دليل الفروع
            </h2>
            <div className="relative mt-3">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="بحث عن فرع..."
                className="w-full h-10 rounded-lg bg-secondary border border-border pr-9 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto p-3 space-y-2">
            {filteredHotels.map((hotel) => (
              <button
                key={hotel.id}
                onClick={() => submitMessage(hotel.name)}
                className="w-full text-right rounded-xl border border-border bg-secondary/60 p-3 hover:bg-secondary transition"
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-sm">{hotel.name}</h3>
                  <span className="text-[10px] rounded-full px-2 py-0.5 bg-primary/10 text-primary">{hotel.brand}</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{hotel.city}</p>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col">
          <header className="border-b border-border px-4 py-3 flex items-center justify-between bg-background/70">
            <h1 className="font-bold">Worm-AI</h1>
            <span className="text-xs text-muted-foreground">بحث ذكي للفروع</span>
          </header>

          <div className="custom-scrollbar flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex animate-fade-in-up ${message.type === "user" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[90%] md:max-w-[75%] rounded-2xl p-4 text-sm whitespace-pre-line ${
                    message.type === "user"
                      ? "bg-secondary border border-border rounded-tr-none"
                      : "gold-gradient text-primary-foreground rounded-tl-none"
                  }`}
                >
                  {message.type === "bot" ? <Sparkles className="w-3 h-3 mb-1" /> : null}
                  {message.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="no-scrollbar px-4 py-2 overflow-x-auto flex gap-2 border-t border-border">
            {[
              { icon: <Utensils className="w-3 h-3" />, label: "الإفطار", query: "فطور بريرا العليا" },
              { icon: <Waves className="w-3 h-3" />, label: "المسبح", query: "مسبح نارسس رويال" },
              { icon: <Phone className="w-3 h-3" />, label: "المدراء", query: "قائمة المدراء" },
              { icon: <Car className="w-3 h-3" />, label: "المواقف", query: "مواقف بودل قريش" },
              { icon: <Bed className="w-3 h-3" />, label: "الغرف", query: "غرف عابر التخصصي" },
            ].map((button) => (
              <button
                key={button.label}
                onClick={() => submitMessage(button.query)}
                type="button"
                className="px-3 py-1.5 text-xs rounded-full border border-border bg-secondary/70 hover:bg-secondary"
              >
                <span className="flex items-center gap-1.5">{button.icon}{button.label}</span>
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-border bg-background/60">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-2">
              <input
                type="text"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSendMessage()}
                placeholder="اكتب سؤالك..."
                className="flex-1 bg-transparent py-2 px-2 text-sm focus:outline-none"
              />
              <button onClick={handleSendMessage} type="button" className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HotelSearch;
