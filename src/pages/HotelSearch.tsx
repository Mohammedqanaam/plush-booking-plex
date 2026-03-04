import { useEffect, useMemo, useRef, useState } from "react";
import { Bed, Car, Hotel, Phone, Search, Send, Sparkles, Utensils, Waves } from "lucide-react";
import { managers, masterHotels, systemsLinks, type MasterHotel } from "@/data/hotelMasterData";

type Message = {
  id: number;
  type: "bot" | "user";
  text: string;
};


const initialMessage =
  "أهلاً بك 👋\nأنا مساعد Worm-AI (نسخة بحث ذكية).\nاكتب اسم أي فرع مع نوع الخدمة مثل: فطور، مسبح، سبا، قاعة، بكج عرسان، غرف، رقم.";

const normalize = (text: string) =>
  text
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const formatHotelFull = (hotel: MasterHotel) =>
  `🏨 **${hotel.name}**\n\n🍳 الإفطار: ${hotel.breakfast}\n🏊 المسبح: ${hotel.pool}\n☕ الكوفي شوب: ${hotel.coffeeShop}\n🍽️ المطعم: ${hotel.restaurant}\n🌇 الإطلالة/البلكونة: ${hotel.viewBalcony}\n🚗 المواقف: ${hotel.parking}\n🏛️ القاعة: ${hotel.meetingHall}\n💍 بكج العرسان: ${hotel.weddingPackage}\n🏋️ النادي: ${hotel.gym}\n🧺 الغسيل: ${hotel.laundry}\n🌴 الجلسات الخارجية: ${hotel.outdoorSeating}\n🧖 السبا: ${hotel.spa}\n🛁 الجاكوزي/البانيو: ${hotel.jacuzzi}\n🧒 قسم الأطفال: ${hotel.kidsSection}\n📞 الاستقبال: ${hotel.hotelPhone ?? "غير متوفر"}`;

const generateResponse = (query: string) => {
  const q = normalize(query);

  const brands = ["بريرا", "بودل", "نارسس", "عابر"];
  const cities = ["الرياض", "جده", "ابها", "القصيم", "جازان", "مكه"];

  const matchedBrand = brands.find((brand) => q.includes(normalize(brand)));
  const matchedCity = cities.find((city) => q.includes(normalize(city)));

  // 1) المدراء
  if (q.includes("مدير") || q.includes("مدراء") || q.includes("ارقام")) {
    let results = managers;

    if (matchedBrand) {
      const normalizedBrand = normalize(matchedBrand);
      results = results.filter((admin) => normalize(admin.role).includes(normalizedBrand));
    }

    if (results.length === 0) {
      return "لا يوجد مدراء مطابقين للبحث.";
    }

    return (
      "📋 قائمة المدراء:\n\n" +
      results
        .map((admin) => `👤 ${admin.name}\n🏢 ${admin.role}\n📞 ${admin.phone}\n`)
        .join("\n") +
      "\nاستاذي حاب احجز لك او اخدمك خدمة اخرى؟"
    );
  }

  // 2) المسابح حسب براند + مدينة
  if (q.includes("مسبح")) {
    let hotels = masterHotels.filter((hotel) => hotel.pool && hotel.pool !== "-");

    if (matchedBrand) {
      hotels = hotels.filter((hotel) => normalize(hotel.brand).includes(normalize(matchedBrand)));
    }

    if (matchedCity) {
      hotels = hotels.filter((hotel) => normalize(hotel.city).includes(normalize(matchedCity)));
    }

    if (hotels.length === 0) {
      return "لا توجد مسابح مطابقة للطلب.";
    }

    return (
      "🏊 المسابح المتوفرة:\n\n" +
      hotels.map((hotel) => `🏨 ${hotel.name}\n🕒 ${hotel.pool}\n`).join("\n") +
      "\nاستاذي حاب احجز لك او اخدمك خدمة اخرى؟"
    );
  }

  // 3) الإفطار حسب براند
  if (q.includes("افطار") || q.includes("فطور")) {
    let hotels = masterHotels.filter((hotel) => hotel.breakfast && hotel.breakfast !== "-");

    if (matchedBrand) {
      hotels = hotels.filter((hotel) => normalize(hotel.brand).includes(normalize(matchedBrand)));
    }

    if (matchedCity) {
      hotels = hotels.filter((hotel) => normalize(hotel.city).includes(normalize(matchedCity)));
    }

    if (hotels.length === 0) {
      return "لا توجد تفاصيل إفطار مطابقة للطلب.";
    }

    return (
      "🍳 تفاصيل الإفطار:\n\n" +
      hotels.map((hotel) => `🏨 ${hotel.name}\n💰 ${hotel.breakfast}\n`).join("\n") +
      "\nاستاذي حاب احجز لك او اخدمك خدمة اخرى؟"
    );
  }

  if (q.includes("اوبرا") || q.includes("رابط") || q.includes("نظام")) {
    return `🔗 **روابط الأنظمة:**\n\n${systemsLinks[0].name}: ${systemsLinks[0].url}\n\n${systemsLinks[1].name}: ${systemsLinks[1].url}`;
  }

  if (q.includes("فنادق") || q.includes("فروع") || q.includes("قائمه") || q.includes("قائمة")) {
    return `لدينا ${masterHotels.length} فرع في قاعدة البيانات. اختر البراند أو المدينة وسيتم عرض النتائج.`;
  }

  const exact = masterHotels.find((hotel) => q.includes(normalize(hotel.name)));
  if (exact) {
    return formatHotelFull(exact);
  }

  // 4) اقتراحات ذكية (تقريبية)
  const suggestions = masterHotels
    .map((hotel) => hotel.name)
    .filter((name) => normalize(name).includes(q.slice(0, 4)))
    .slice(0, 4);

  if (suggestions.length > 0) {
    return `هل تقصد:\n\n${suggestions.map((suggestion) => `• ${suggestion}`).join("\n")}`;
  }

  return "عذراً لم يتم العثور على نتيجة مطابقة.";
};

const HotelSearch = () => {
  const [messages, setMessages] = useState<Message[]>([{ id: 1, type: "bot", text: initialMessage }]);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


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
    const q = normalize(searchQuery);
    if (!q) return masterHotels;
    return masterHotels.filter((hotel) => normalize(`${hotel.name} ${hotel.brand} ${hotel.city}`).includes(q));
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
