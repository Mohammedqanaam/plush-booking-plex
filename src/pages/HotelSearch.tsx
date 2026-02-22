import { useState } from "react";
import { Search as SearchIcon, Phone, MapPin, Coffee, Waves } from "lucide-react";

const mockHotels = [
  { name: "فندق الريتز كارلتون", group: "ماريوت", location: "الرياض", breakfast: "120 ريال", pool: "نعم", phone: "+966 11 802 8020" },
  { name: "فندق هيلتون", group: "هيلتون", location: "جدة", breakfast: "95 ريال", pool: "نعم", phone: "+966 12 261 6000" },
  { name: "فندق شيراتون", group: "ماريوت", location: "الدمام", breakfast: "85 ريال", pool: "لا", phone: "+966 13 834 3333" },
  { name: "فندق نوفوتيل", group: "أكور", location: "الرياض", breakfast: "75 ريال", pool: "نعم", phone: "+966 11 206 8888" },
  { name: "فندق كراون بلازا", group: "IHG", location: "المدينة", breakfast: "90 ريال", pool: "لا", phone: "+966 14 838 3800" },
  { name: "فندق فور سيزونز", group: "فور سيزونز", location: "الرياض", breakfast: "150 ريال", pool: "نعم", phone: "+966 11 499 9999" },
];

const HotelSearch = () => {
  const [query, setQuery] = useState("");

  const filtered = mockHotels.filter(
    (h) =>
      h.name.includes(query) ||
      h.location.includes(query) ||
      h.group.includes(query)
  );

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">البحث عن الفنادق</h2>
        <p className="text-muted-foreground text-sm">ابحث بالاسم أو المدينة أو المجموعة</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="ابحث هنا..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-11 pr-10 pl-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
        />
      </div>

      {/* Results */}
      <div className="space-y-3">
        {filtered.map((hotel, i) => (
          <div key={i} className="glass-card p-4 space-y-3 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-sm">{hotel.name}</h3>
                <p className="text-xs text-muted-foreground">{hotel.group}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                {hotel.location}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {hotel.location}
              </span>
              <span className="flex items-center gap-1">
                <Coffee className="w-3 h-3" /> {hotel.breakfast}
              </span>
              <span className="flex items-center gap-1">
                <Waves className="w-3 h-3" /> مسبح: {hotel.pool}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> {hotel.phone}
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <SearchIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>لا توجد نتائج</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelSearch;
