import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Building2, ExternalLink, Hotel, MapPin, Phone, Search, Tags } from "lucide-react";
import { branches, type Branch, type BranchServices } from "@/data/branches";
import { HOTEL_INFORMATION_SHEET_URL, HOTEL_INFORMATION_SNAPSHOT_DATE, sheetOperationalHotels } from "@/data/sheetOperationalData";
import PageHeader from "@/components/PageHeader";

const serviceLabels: Record<keyof BranchServices, string> = {
  breakfast: "الإفطار",
  pool: "المسبح",
  coffeeShop: "المقهى",
  restaurant: "المطعم",
  viewOrBalcony: "الإطلالة أو الشرفة",
  parking: "المواقف",
  meetingRoom: "قاعات الاجتماعات",
  weddingPackage: "باقات المناسبات",
  gym: "النادي",
  laundry: "المغسلة",
  outdoorSeating: "الجلسات الخارجية",
  spa: "السبا",
  jacuzzi: "الجاكوزي أو البانيو",
  kidsArea: "منطقة الأطفال",
};

const sourceDate = HOTEL_INFORMATION_SNAPSHOT_DATE.split("-").reverse().join("/");

const BranchDetails = ({ branch, showHeading = true }: { branch: Branch; showHeading?: boolean }) => {
  const services = Object.entries(branch.services) as Array<[keyof BranchServices, string]>;
  const availableServices = services.filter(([, value]) => !["غير متوفر", "غير محدد"].includes(value));
  const unavailableServices = services.filter(([, value]) => ["غير متوفر", "غير محدد"].includes(value)).map(([key]) => serviceLabels[key]);

  return <div className="space-y-4">
    {showHeading ? (
      <div>
        <h3 className="text-lg font-black">{branch.name}</h3>
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {branch.city} · {branch.brand}</p>
      </div>
    ) : null}

    {branch.contacts.length ? (
      <div className="flex flex-wrap gap-2">
        {branch.contacts.map((contact) => (
          <a key={`${contact.label}-${contact.value}`} href={`tel:${contact.value}`} dir="ltr" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-primary/18 bg-secondary/30 px-3 text-sm">
            <Phone className="h-4 w-4 text-primary" /> {contact.value}
          </a>
        ))}
      </div>
    ) : <p className="text-xs text-muted-foreground">لا يوجد رقم تواصل في المصدر الحالي.</p>}

    <div className="grid gap-2 sm:grid-cols-2">
      {availableServices.map(([key, value]) => (
        <div key={key} className="rounded-xl border border-border/15 bg-secondary/20 p-3 text-sm">
          <p className="text-xs font-bold text-muted-foreground">{serviceLabels[key]}</p>
          <p className="mt-1 leading-6">{value}</p>
        </div>
      ))}
    </div>
    {unavailableServices.length ? <p className="text-xs leading-6 text-muted-foreground">غير متوفر: {unavailableServices.join("، ")}.</p> : null}

    <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border/20 pt-3 text-xs">
      <a href={HOTEL_INFORMATION_SHEET_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
        شيت الفروع · {sourceDate} <ExternalLink className="h-3.5 w-3.5" />
      </a>
      <a href="https://www.boudl.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary">
        موقع بودل <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  </div>;
};

const Branches = () => {
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("الكل");
  const [selectedId, setSelectedId] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);

  const brands = useMemo(() => ["الكل", ...Array.from(new Set(branches.map((branch) => branch.brand)))], []);
  const citiesCount = useMemo(() => new Set(branches.map((branch) => branch.city)).size, []);
  const sourceCoverage = `${branches.length}/${sheetOperationalHotels.length}`;
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return branches.filter((branch) => {
      const matchesBrand = brand === "الكل" || branch.brand === brand;
      const searchable = [branch.name, branch.city, branch.brand, ...branch.contacts.map((contact) => contact.value)].join(" ").toLowerCase();
      return matchesBrand && (!query || searchable.includes(query));
    });
  }, [brand, search]);

  useEffect(() => setVisibleCount(12), [brand, search]);

  const displayed = filtered.slice(0, visibleCount);
  const selected = filtered.find((branch) => branch.id === selectedId);
  const desktopSelected = selected ?? filtered[0];

  return (
    <div className="page-wrap">
      <PageHeader title="الفروع" icon={Building2} />

      <section className="grid grid-cols-3 gap-2" aria-label="ملخص الفروع">
        <div className="branch-summary-card">
          <Hotel className="h-5 w-5" />
          <strong>{branches.length}</strong>
          <span>فرعًا</span>
        </div>
        <div className="branch-summary-card branch-summary-card--blue">
          <MapPin className="h-5 w-5" />
          <strong>{citiesCount}</strong>
          <span>مدن</span>
        </div>
        <div className="branch-summary-card branch-summary-card--green">
          <BadgeCheck className="h-5 w-5" />
          <strong>{sourceCoverage}</strong>
          <span>تغطية الشيت</span>
        </div>
      </section>

      <section className="page-surface">
        <div className="grid gap-2 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input className="h-11 w-full rounded-xl border bg-secondary/70 px-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="اسم الفرع، المدينة، أو رقم الهاتف" />
          </div>
          <select className="h-11 rounded-xl border bg-secondary/70 px-3" value={brand} onChange={(event) => setBrand(event.target.value)}>
            {brands.map((item) => <option key={item} value={item}>{item === "الكل" ? "كل العلامات" : item}</option>)}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1"><Tags className="h-3.5 w-3.5" /> {brands.length - 1} علامات · {sourceDate}</span>
        </div>
      </section>

      {!filtered.length ? (
        <div className="page-surface text-center text-sm text-muted-foreground">لا يوجد فرع مطابق.</div>
      ) : (
        <>
          <section className="space-y-2 md:hidden">
            {displayed.map((branch) => {
              const isSelected = selected?.id === branch.id;
              return (
                <article key={branch.id} className={`page-surface overflow-hidden ${isSelected ? "border-primary/35" : ""}`}>
                  <button type="button" className="w-full text-right" onClick={() => setSelectedId(branch.id)} aria-expanded={isSelected}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-black">{branch.name}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">{branch.city} · <span className="font-semibold text-foreground">{branch.brand}</span></p>
                      </div>
                      <span className="rounded-full border border-primary/18 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">{isSelected ? "مفتوح" : "التفاصيل"}</span>
                    </div>
                    <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">الإفطار: {branch.services.breakfast}</p>
                  </button>
                  {isSelected ? <div className="mt-4 border-t border-border/20 pt-4"><BranchDetails branch={branch} showHeading={false} /></div> : null}
                </article>
              );
            })}
          </section>

          <div className="hidden gap-3 md:grid lg:grid-cols-[1.35fr_.9fr]">
            <section className="page-surface table-scroll">
              <table className="min-w-[760px] w-full text-sm">
                <thead><tr className="text-right text-muted-foreground"><th className="p-2.5">الفرع</th><th className="p-2.5">المدينة</th><th className="p-2.5">العلامة</th><th className="p-2.5">الهاتف</th><th className="p-2.5">الإفطار</th></tr></thead>
                <tbody>
                  {displayed.map((branch) => (
                    <tr key={branch.id} className={`cursor-pointer border-b border-border/40 ${desktopSelected?.id === branch.id ? "bg-primary/10" : ""}`} onClick={() => setSelectedId(branch.id)}>
                      <td className="p-2.5 font-bold">{branch.name}</td>
                      <td className="p-2.5">{branch.city}</td>
                      <td className="p-2.5">{branch.brand}</td>
                      <td className="p-2.5" dir="ltr">{branch.contacts[0]?.value ?? "—"}</td>
                      <td className="max-w-72 p-2.5"><span className="line-clamp-2">{branch.services.breakfast}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {desktopSelected ? <section className="page-surface self-start"><BranchDetails branch={desktopSelected} /></section> : null}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
            <span>عرض {displayed.length} من {filtered.length} فرعًا</span>
            {displayed.length < filtered.length ? (
              <button type="button" className="h-9 rounded-xl border border-primary/20 px-4 font-bold text-primary" onClick={() => setVisibleCount((count) => count + 12)}>عرض المزيد</button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};

export default Branches;
