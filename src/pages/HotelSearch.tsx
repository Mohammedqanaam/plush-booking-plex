import { useState } from "react";
import { Phone, MapPin, Coffee, Waves, Search as SearchIcon, UtensilsCrossed, Eye, Droplets, Baby, Shirt, TreePalm, ChevronDown } from "lucide-react";
import { hotelBranches, infoCategories, getProtocolResponse, type InfoCategory, type HotelBranch } from "@/data/hotels";

const HotelSearch = () => {
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<InfoCategory | "">("");

  const selectedHotel = hotelBranches.find((h) => h.id === selectedHotelId);

  const groups = [...new Set(hotelBranches.map((h) => h.group))];

  const protocolResponse =
    selectedHotel && selectedCategory
      ? getProtocolResponse(selectedHotel, selectedCategory as InfoCategory)
      : null;

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">البحث عن الفنادق</h2>
        <p className="text-muted-foreground text-sm">اختر الفندق ونوع الاستفسار</p>
      </div>

      {/* Hotel Select */}
      <div className="space-y-2">
        <label className="text-sm font-medium">اختر الفندق</label>
        <div className="relative">
          <select
            value={selectedHotelId}
            onChange={(e) => {
              setSelectedHotelId(e.target.value);
              setSelectedCategory("");
            }}
            className="w-full h-11 pr-4 pl-10 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition appearance-none"
          >
            <option value="">-- اختر الفندق --</option>
            {groups.map((group) => (
              <optgroup key={group} label={`── ${group} ──`}>
                {hotelBranches
                  .filter((h) => h.group === group)
                  .map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} - {h.city}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Category Select */}
      {selectedHotel && (
        <div className="space-y-2 animate-fade-in">
          <label className="text-sm font-medium">نوع الاستفسار</label>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as InfoCategory)}
              className="w-full h-11 pr-4 pl-10 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition appearance-none"
            >
              <option value="">-- اختر نوع الاستفسار --</option>
              {infoCategories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      )}

      {/* Protocol Response */}
      {protocolResponse && selectedHotel && (
        <div className="glass-card p-5 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold gold-text">بروتوكول الرد</h3>
          </div>
          <p className="text-sm leading-7 whitespace-pre-line">{protocolResponse}</p>
        </div>
      )}

      {/* Hotel Quick Info Card */}
      {selectedHotel && !selectedCategory && (
        <div className="glass-card p-4 space-y-3 animate-fade-in">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-sm">{selectedHotel.name}</h3>
              <p className="text-xs text-muted-foreground">{selectedHotel.group}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
              {selectedHotel.city}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {selectedHotel.city}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> {selectedHotel.phone}
            </span>
            <span className="flex items-center gap-1">
              <Waves className="w-3 h-3" /> {selectedHotel.pool.includes("لا يوجد") ? "لا يوجد مسبح" : "يوجد مسبح"}
            </span>
            <span className="flex items-center gap-1">
              <Coffee className="w-3 h-3" /> {selectedHotel.coffeeShop.includes("لا يوجد") ? "لا يوجد" : "يوجد كوفي"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">اختر نوع الاستفسار أعلاه لعرض بروتوكول الرد</p>
        </div>
      )}

      {/* Empty state */}
      {!selectedHotelId && (
        <div className="text-center py-12 text-muted-foreground">
          <SearchIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>اختر فندقاً من القائمة للبدء</p>
        </div>
      )}
    </div>
  );
};

export default HotelSearch;
