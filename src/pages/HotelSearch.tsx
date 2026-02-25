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

type Message = {
  id: number;
  type: "bot" | "user";
  text: string;
};

type HotelEntry = {
  id: string;
  name: string;
  brand: string;
  breakfast?: string;
  dinner?: string;
  pool?: string;
  rooms?: string;
  parking?: string;
  contact_sales?: string;
  contact_hotel?: string;
  wedding?: string;
};

const DATABASE: {
  hotels: HotelEntry[];
  admins: { name: string; role: string; phone: string }[];
  links: { name: string; url: string }[];
} = {
  hotels: [
    {
      id: "br-olaya",
      name: "بريرا العليا",
      brand: "بريرا",
      breakfast: "79 ريال (بوفيه مفتوح 7:00ص - 11:30ص)",
      dinner: "الخميس: سي فود (129 ريال) | الجمعة: مشاوي (129 ريال)",
      pool: "متوفر (رجال + أطفال) 10ص-6م",
      rooms: "سوبيريور (30م²)، جناح تنفيذي (90م² غرفتين)",
      parking: "عامة ومحدودة",
      contact_sales: "0598919900",
      contact_hotel: "0112933354",
    },
    {
      id: "br-qurtubah",
      name: "بريرا قرطبة",
      brand: "بريرا",
      breakfast: "89 ريال (بوفيه مفتوح 6:30ص - 11:00ص)",
      dinner: "الأحد: هندي (85 ريال) | الخميس: سي فود",
      pool: "متوفر (رجال + أطفال) 8ص-6م | سبا 1م-2ص",
      rooms: "ديلوكس (28م²)، جونيور سويت (45م²)، جناح (65م²)",
      parking: "بيسمنت + جانبي مظلل",
      contact_sales: "0592301850",
      contact_hotel: "0112254614",
    },
    {
      id: "br-nakheel",
      name: "بريرا النخيل",
      brand: "بريرا",
      breakfast: "89 ريال (بوفيه مفتوح 7:00ص - 11:30ص)",
      dinner: "الأحد-الخميس: غداء بوفيه (115 ريال) | الأربعاء: عشاء أندلسي (99 ريال)",
      pool: "رجال + أطفال + نساء (حسب الجدول)",
      contact_sales: "0593229933",
    },
    {
      id: "br-wizarat",
      name: "بريرا الوزارات",
      brand: "بريرا",
      breakfast: "66 ريال (بوفيه مفتوح)",
      dinner: "منيو حسب الطلب",
      pool: "رجال + أطفال",
    },
    {
      id: "narcissus-royal",
      name: "نارسس رويال",
      brand: "نارسس",
      breakfast: "بوفيه (7:00ص - 11:00ص)",
      pool: "نسائي + أطفال + رجالي (10ص - 10م)",
      wedding: "بكج 1500 ريال (شامل تجهيز الجناح + عشاء)",
      parking: "بيسمنت - عام",
      contact_sales: "صالح (0583053045) / تغريد (0559654930)",
      contact_hotel: "0114061515",
    },
    {
      id: "narcissus-obhur",
      name: "نارسس أبحر",
      brand: "نارسس",
      contact_hotel: "0126099100",
      pool: "متوفر",
    },
    {
      id: "boudl-quraish",
      name: "بودل قريش",
      brand: "بودل",
      pool: "أطفال + رجال (10ص - 10م)",
      parking: "بيسمنت + عام",
      contact_hotel: "0126334445",
    },
    {
      id: "aber-munisiyah",
      name: "عابر المونسية",
      brand: "عابر",
      rooms: "ستاندرد (24م²)، ديلوكس (30م²)",
      contact_sales: "0599313943",
    },
    {
      id: "aber-takhassusi",
      name: "عابر التخصصي",
      brand: "عابر",
      rooms: "ستاندرد (28م²)، ديلوكس (33م²)، جونيور (65م²)",
      breakfast: "46 ريال (تقريباً)",
    },
  ],
  admins: [
    { name: "عارف الشميري", role: "مدير إقليمي الرياض", phone: "0590122713" },
    { name: "شاكول", role: "مدير إقليمي عابر", phone: "0555119759" },
    { name: "ثائر", role: "مدير فندق بريرا", phone: "0591672860" },
    { name: "أحمد حجازي", role: "مدير عابر أبها", phone: "0507981174" },
  ],
  links: [
    {
      name: "Opera KSA",
      url: "https://mtce11.oraclehospitality.eu-frankfurt-1.ocs.oraclecloud.com/BHG/operacloud/faces/adf.task-flow?adf.tfId=opera-cloud-index",
    },
    {
      name: "Opera KW",
      url: "https://mtce2.oraclehospitality.eu-frankfurt-1.ocs.oraclecloud.com/BHG/operacloud/faces/opera-cloud-index/OperaCloud",
    },
  ],
};

const initialMessage =
  "أهلاً بك محمد الدوسري. 👋\nأنا مساعد Worm-AI. تم تحديثي ببيانات رمضان 2026.\nيمكنك سؤالي عن أسعار الإفطار، أوقات المسابح، أو أرقام المدراء.";

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

    if (q.includes("مدير") || q.includes("مدراء") || q.includes("تواصل") || q.includes("ادارة")) {
      let response = "📋 **قائمة المدراء الإقليميين ومدراء الفنادق:**\n\n";
      DATABASE.admins.forEach((admin) => {
        response += `👤 ${admin.name} (${admin.role})\n📞 ${admin.phone}\n\n`;
      });
      response += "⚠️ تنبيه: هذه الأرقام للاستخدام الداخلي فقط.";
      return response;
    }

    const foundHotel = DATABASE.hotels.find(
      (hotel) => q.includes(hotel.name) || (q.includes(hotel.brand) && q.includes(hotel.name.split(" ")[1] ?? "")),
    );

    if (foundHotel) {
      let response = `🏨 **${foundHotel.name}**\n\n`;

      if (q.includes("فطور") || q.includes("إفطار") || q.includes("اكل")) {
        response += `🍳 **الإفطار:** ${foundHotel.breakfast ?? "غير محدد"}\n`;
        if (foundHotel.dinner) {
          response += `🍽️ **العشاء:** ${foundHotel.dinner}\n`;
        }
      } else if (q.includes("مسبح") || q.includes("سبا")) {
        response += `🏊 **المسبح:** ${foundHotel.pool ?? "غير متوفر"}\n`;
      } else if (q.includes("غرف") || q.includes("مساحة")) {
        response += `🛏️ **الغرف:** ${foundHotel.rooms ?? "حسب التوفر"}\n`;
      } else if (q.includes("مواقف")) {
        response += `🚗 **المواقف:** ${foundHotel.parking ?? "متوفرة"}\n`;
      } else if (q.includes("رقم") || q.includes("تلفون")) {
        response += `📞 **الاستقبال:** ${foundHotel.contact_hotel ?? "غير متوفر"}\n`;
        if (foundHotel.contact_sales) {
          response += `💼 **المبيعات:** ${foundHotel.contact_sales}\n`;
        }
      } else {
        response += `🍳 الإفطار: ${foundHotel.breakfast ?? "-"}\n`;
        response += `🏊 المسبح: ${foundHotel.pool ?? "-"}\n`;
        response += `📞 المبيعات: ${foundHotel.contact_sales ?? "-"}\n`;
      }

      return response;
    }

    if (q.includes("قائمة") || q.includes("فنادق")) {
      return "يمكنك الاختيار من القائمة الجانبية للحصول على تفاصيل (بريرا، نارسس، بودل، عابر).";
    }

    if (q.includes("اوبرا") || q.includes("رابط") || q.includes("نظام")) {
      return `🔗 **روابط الأنظمة:**\n\n${DATABASE.links[0].name}: ${DATABASE.links[0].url}\n\n${DATABASE.links[1].name}: ${DATABASE.links[1].url}`;
    }

    return "عذراً، لم أفهم طلبك بدقة. جرب كتابة اسم الفندق متبوعاً بـ 'فطور' أو 'مسبح' أو 'مدير'.";
  };

  const submitMessage = (text: string) => {
    if (!text.trim()) {
      return;
    }

    const userMessage: Message = { id: Date.now(), type: "user", text };
    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      const response = generateResponse(text);
      setMessages((prev) => [...prev, { id: Date.now() + 1, type: "bot", text: response }]);
    }, 500);
  };

  const handleSendMessage = () => {
    submitMessage(inputValue);
    setInputValue("");
  };

  const filteredHotels = useMemo(
    () => DATABASE.hotels.filter((hotel) => hotel.name.includes(searchQuery.trim())),
    [searchQuery],
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-2xl border border-[#3D2B5E] bg-[#0A0514] text-gray-100">
      <aside className="hidden w-80 flex-col border-l border-[#3D2B5E] bg-[#140C24] lg:flex">
        <div className="border-b border-[#3D2B5E] bg-[#251842]/70 p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-purple-300">
            <Hotel className="text-purple-400" />
            <span>دليل الفنادق 2026</span>
          </h2>
          <div className="group relative mt-4">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 transition-colors group-focus-within:text-purple-400" />
            <input
              type="text"
              placeholder="بحث سريع..."
              className="w-full rounded-xl border border-[#3D2B5E] bg-[#0A0514] py-2 pl-3 pr-10 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
          {filteredHotels.map((hotel) => (
            <button
              key={hotel.id}
              onClick={() => submitMessage(hotel.name)}
              className="w-full rounded-xl border border-[#3D2B5E] bg-[#1A102E] p-4 text-right transition-all hover:-translate-x-1 hover:border-purple-500/70 hover:bg-[#251842]"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-gray-100">{hotel.name}</h3>
                <span className="rounded bg-[#0A0514] px-2 py-0.5 text-[10px] text-gray-400">{hotel.brand}</span>
              </div>
              <div className="mt-2 flex gap-3 text-xs text-gray-400">
                {hotel.pool ? (
                  <span className="flex items-center gap-1">
                    <Waves className="h-3 w-3" /> مسبح
                  </span>
                ) : null}
                {hotel.breakfast ? (
                  <span className="flex items-center gap-1">
                    <Utensils className="h-3 w-3" /> إفطار
                  </span>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col bg-[#0A0514]">
        <header className="glass-panel z-10 flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <span className="relative inline-flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-70" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
            </span>
            <div>
              <h1 className="flex items-center gap-2 text-lg font-bold">
                Worm-AI
                <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[10px]">V2.0</span>
              </h1>
              <p className="text-[11px] text-gray-400">نظام إدارة البيانات الفندقية الذكي</p>
            </div>
          </div>
          <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-[#251842] hover:text-white" type="button">
            <ShieldAlert className="h-5 w-5" />
          </button>
        </header>

        <div className="custom-scrollbar z-10 flex-1 space-y-6 overflow-y-auto p-4 md:p-8">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`animate-fade-in-up flex ${message.type === "user" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`relative max-w-[85%] rounded-2xl p-5 text-sm leading-relaxed shadow-xl md:max-w-[70%] ${
                  message.type === "user"
                    ? "rounded-tr-none border border-[#3D2B5E] bg-[#1A102E]"
                    : "rounded-tl-none border border-purple-500/40 bg-gradient-to-br from-purple-600 to-purple-800"
                }`}
              >
                {message.type === "bot" ? <Sparkles className="absolute -left-2 -top-2 h-4 w-4 text-yellow-300" /> : null}
                <p className="whitespace-pre-line">{message.text}</p>
                <span className="mt-3 block text-left font-mono text-[10px] opacity-60">
                  {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="no-scrollbar z-10 flex gap-2 overflow-x-auto px-4 py-2 md:px-8">
          {[
            { icon: <Utensils className="h-3 w-3" />, label: "أسعار الإفطار", query: "أسعار الإفطار في بريرا" },
            { icon: <Waves className="h-3 w-3" />, label: "المسابح", query: "أوقات المسابح" },
            { icon: <Phone className="h-3 w-3" />, label: "أرقام المدراء", query: "قائمة المدراء" },
            { icon: <Car className="h-3 w-3" />, label: "المواقف", query: "مواقف بريرا العليا" },
            { icon: <Bed className="h-3 w-3" />, label: "مساحة الغرف", query: "مساحات غرف بريرا" },
          ].map((button) => (
            <button
              key={button.label}
              type="button"
              onClick={() => submitMessage(button.query)}
              className="whitespace-nowrap rounded-full border border-[#3D2B5E] bg-[#140C24] px-4 py-2 text-xs transition-all hover:border-purple-500 hover:bg-[#1A102E]"
            >
              <span className="flex items-center gap-2">
                {button.icon}
                {button.label}
              </span>
            </button>
          ))}
        </div>

        <div className="z-10 border-t border-[#3D2B5E] bg-[#0A0514] p-4 md:p-6">
          <div className="flex items-center gap-3 rounded-2xl border border-[#3D2B5E] bg-[#140C24] p-2 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500">
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSendMessage();
                }
              }}
              placeholder="اكتب استفسارك هنا (مثال: كم سعر فطور بريرا قرطبة؟)"
              className="flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none"
            />
            <button
              onClick={handleSendMessage}
              type="button"
              className="rounded-xl bg-purple-600 p-3 text-white transition-transform hover:scale-105 hover:bg-purple-500"
            >
              <Send className="h-5 w-5 rotate-180" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HotelSearch;
