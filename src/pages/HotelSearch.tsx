import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bed,
  Car,
  Hotel,
  Phone,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Utensils,
  Waves,
} from "lucide-react";
import { managers, masterHotels, systemsLinks } from "@/data/hotelMasterData";

type Message = {
  id: number;
  type: "bot" | "user";
  text: string;
};

const initialMessage =
  "أهلاً بك محمد الدوسري. 👋\nأنا مساعد Worm-AI. تم تحديثي بكامل بيانات الفروع والخدمات.\nيمكنك السؤال عن الإفطار، المسبح، السبا، القاعات، بكج العرسان، الغرف، وأرقام التواصل.";

const HotelSearch = () => {
  const [messages, setMessages] = useState<Message[]>([{ id: 1, type: "bot", text: initialMessage }]);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateResponse = (query: string) => {
    const q = query.toLowerCase();

    if (q.includes("مدير") || q.includes("مدراء") || q.includes("تواصل الادارة") || q.includes("ادارة")) {
      let response = "📋 **تقرير المدراء (لا يعطى الرقم للعميل):**\n\n";
      managers.forEach((admin) => {
        response += `👤 ${admin.name} (${admin.role})\n📞 ${admin.phone}\n\n`;
      });
      response += "⚠️ تنبيه: هذه الأرقام للاستخدام الداخلي فقط.";
      return response;
    }

    const foundHotel = masterHotels.find((hotel) => q.includes(hotel.name) || q.includes(hotel.brand));

    if (foundHotel) {
      if (q.includes("رقم") || q.includes("تلفون") || q.includes("اتصال")) {
        return `📞 **${foundHotel.name}**\n\nالاستقبال: ${foundHotel.hotelPhone ?? "غير متوفر"}\nالمبيعات: ${foundHotel.salesPhone ?? "غير متوفر"}`;
      }

      if (q.includes("غرف") || q.includes("مساحة") || q.includes("room")) {
        return `🛏️ **${foundHotel.name} - أنواع ومساحات الغرف**\n\n${foundHotel.roomTypes ?? "لا تتوفر حالياً بيانات تفصيلية للغرف لهذا الفرع."}`;
      }

      if (q.includes("فطور") || q.includes("إفطار")) return `🍳 **${foundHotel.name}**\n${foundHotel.breakfast}`;
      if (q.includes("مسبح")) return `🏊 **${foundHotel.name}**\n${foundHotel.pool}`;
      if (q.includes("كوفي")) return `☕ **${foundHotel.name}**\n${foundHotel.coffeeShop}`;
      if (q.includes("مطعم")) return `🍽️ **${foundHotel.name}**\n${foundHotel.restaurant}`;
      if (q.includes("اطلالة") || q.includes("بلكونة")) return `🌇 **${foundHotel.name}**\n${foundHotel.viewBalcony}`;
      if (q.includes("مواقف")) return `🚗 **${foundHotel.name}**\n${foundHotel.parking}`;
      if (q.includes("قاعة") || q.includes("اجتماعات")) return `🏛️ **${foundHotel.name}**\n${foundHotel.meetingHall}`;
      if (q.includes("عرسان") || q.includes("بكج")) return `💍 **${foundHotel.name}**\n${foundHotel.weddingPackage}`;
      if (q.includes("نادي") || q.includes("جيم")) return `🏋️ **${foundHotel.name}**\n${foundHotel.gym}`;
      if (q.includes("غسيل")) return `🧺 **${foundHotel.name}**\n${foundHotel.laundry}`;
      if (q.includes("جلسات")) return `🌴 **${foundHotel.name}**\n${foundHotel.outdoorSeating}`;
      if (q.includes("سبا")) return `🧖 **${foundHotel.name}**\n${foundHotel.spa}`;
      if (q.includes("جاكوزي") || q.includes("بانيو")) return `🛁 **${foundHotel.name}**\n${foundHotel.jacuzzi}`;
      if (q.includes("اطفال") || q.includes("الأطفال")) return `🧒 **${foundHotel.name}**\n${foundHotel.kidsSection}`;

      return `🏨 **${foundHotel.name}**\n\n🍳 الإفطار: ${foundHotel.breakfast}\n🏊 المسبح: ${foundHotel.pool}\n☕ الكوفي شوب: ${foundHotel.coffeeShop}\n🍽️ المطعم: ${foundHotel.restaurant}\n🌇 الإطلالة/البلكونة: ${foundHotel.viewBalcony}\n🚗 المواقف: ${foundHotel.parking}\n🏛️ قاعة الاجتماعات: ${foundHotel.meetingHall}\n💍 بكج العرسان: ${foundHotel.weddingPackage}\n🏋️ النادي: ${foundHotel.gym}\n🧺 غسيل الملابس: ${foundHotel.laundry}\n🌴 الجلسات الخارجية: ${foundHotel.outdoorSeating}\n🧖 السبا: ${foundHotel.spa}\n🛁 الجاكوزي/البانيو: ${foundHotel.jacuzzi}\n🧒 قسم الأطفال: ${foundHotel.kidsSection}\n📞 الاستقبال: ${foundHotel.hotelPhone ?? "غير متوفر"}`;
    }

    if (q.includes("اوبرا") || q.includes("رابط") || q.includes("نظام")) {
      return `🔗 **روابط الأنظمة:**\n\n${systemsLinks[0].name}: ${systemsLinks[0].url}\n\n${systemsLinks[1].name}: ${systemsLinks[1].url}`;
    }

    if (q.includes("قائمة") || q.includes("فنادق") || q.includes("فروع")) {
      return `لدينا حالياً ${masterHotels.length} فرع في قاعدة البيانات. اختر من القائمة الجانبية للحصول على التفاصيل.`;
    }

    return "عذراً، لم أفهم طلبك بدقة. اكتب اسم الفرع متبوعاً بنوع الطلب (فطور، مسبح، سبا، قاعة، بكج عرسان، غرف، رقم).";
  };

  const submitMessage = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { id: Date.now(), type: "user", text };
    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      const response = generateResponse(text);
      setMessages((prev) => [...prev, { id: Date.now() + 1, type: "bot", text: response }]);
    }, 450);
  };

  const handleSendMessage = () => {
    submitMessage(inputValue);
    setInputValue("");
  };

  const filteredHotels = useMemo(
    () => masterHotels.filter((hotel) => hotel.name.includes(searchQuery.trim()) || hotel.brand.includes(searchQuery.trim())),
    [searchQuery],
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-2xl border border-[#3D2B5E] bg-[#0A0514] text-gray-100">
      <aside className="hidden w-80 flex-col border-l border-[#3D2B5E] bg-[#140C24] lg:flex">
        <div className="border-b border-[#3D2B5E] bg-[#251842]/70 p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-purple-300">
            <Hotel className="text-purple-400" />
            <span>دليل الفروع الكامل</span>
          </h2>
          <div className="group relative mt-4">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 transition-colors group-focus-within:text-purple-400" />
            <input type="text" placeholder="بحث سريع..." className="w-full rounded-xl border border-[#3D2B5E] bg-[#0A0514] py-2 pl-3 pr-10 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
          </div>
        </div>

        <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
          {filteredHotels.map((hotel) => (
            <button key={hotel.id} onClick={() => submitMessage(hotel.name)} className="w-full rounded-xl border border-[#3D2B5E] bg-[#1A102E] p-4 text-right transition-all hover:-translate-x-1 hover:border-purple-500/70 hover:bg-[#251842]">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-gray-100">{hotel.name}</h3>
                <span className="rounded bg-[#0A0514] px-2 py-0.5 text-[10px] text-gray-400">{hotel.brand}</span>
              </div>
              <div className="mt-2 flex gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Waves className="h-3 w-3" /> مسبح</span>
                <span className="flex items-center gap-1"><Utensils className="h-3 w-3" /> إفطار</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col bg-[#0A0514]">
        <header className="glass-panel z-10 flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <span className="relative inline-flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-70" /><span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" /></span>
            <div>
              <h1 className="flex items-center gap-2 text-lg font-bold">Worm-AI <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[10px]">V2.1</span></h1>
              <p className="text-[11px] text-gray-400">قاعدة بيانات الفروع + دليل الرد السريع</p>
            </div>
          </div>
          <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-[#251842] hover:text-white" type="button"><ShieldAlert className="h-5 w-5" /></button>
        </header>

        <div className="custom-scrollbar z-10 flex-1 space-y-6 overflow-y-auto p-4 md:p-8">
          {messages.map((message) => (
            <div key={message.id} className={`animate-fade-in-up flex ${message.type === "user" ? "justify-start" : "justify-end"}`}>
              <div className={`relative max-w-[85%] rounded-2xl p-5 text-sm leading-relaxed shadow-xl md:max-w-[72%] ${message.type === "user" ? "rounded-tr-none border border-[#3D2B5E] bg-[#1A102E]" : "rounded-tl-none border border-purple-500/40 bg-gradient-to-br from-purple-600 to-purple-800"}`}>
                {message.type === "bot" ? <Sparkles className="absolute -left-2 -top-2 h-4 w-4 text-yellow-300" /> : null}
                <p className="whitespace-pre-line">{message.text}</p>
                <span className="mt-3 block text-left font-mono text-[10px] opacity-60">{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="no-scrollbar z-10 flex gap-2 overflow-x-auto px-4 py-2 md:px-8">
          {[
            { icon: <Utensils className="h-3 w-3" />, label: "أسعار الإفطار", query: "افطار بريرا العليا" },
            { icon: <Waves className="h-3 w-3" />, label: "المسابح", query: "مسبح نارسس رويال" },
            { icon: <Phone className="h-3 w-3" />, label: "أرقام المدراء", query: "قائمة المدراء" },
            { icon: <Car className="h-3 w-3" />, label: "المواقف", query: "مواقف بودل قريش" },
            { icon: <Bed className="h-3 w-3" />, label: "مساحة الغرف", query: "غرف عابر التخصصي" },
          ].map((button) => (
            <button key={button.label} type="button" onClick={() => submitMessage(button.query)} className="whitespace-nowrap rounded-full border border-[#3D2B5E] bg-[#140C24] px-4 py-2 text-xs transition-all hover:border-purple-500 hover:bg-[#1A102E]"><span className="flex items-center gap-2">{button.icon}{button.label}</span></button>
          ))}
        </div>

        <div className="z-10 border-t border-[#3D2B5E] bg-[#0A0514] p-4 md:p-6">
          <div className="flex items-center gap-3 rounded-2xl border border-[#3D2B5E] bg-[#140C24] p-2 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500">
            <input type="text" value={inputValue} onChange={(event) => setInputValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") handleSendMessage(); }} placeholder="اكتب استفسارك (مثال: بريرا قرطبه قاعة اجتماعات)" className="flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none" />
            <button onClick={handleSendMessage} type="button" className="rounded-xl bg-purple-600 p-3 text-white transition-transform hover:scale-105 hover:bg-purple-500"><Send className="h-5 w-5 rotate-180" /></button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HotelSearch;
