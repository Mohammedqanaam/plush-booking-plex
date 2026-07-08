import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ChartLine,
  ChartPie,
  Check,
  CircleUser,
  FolderOpen,
  Headphones,
  LockOpen,
  Send,
  Shield,
  BriefcaseBusiness,
  X,
} from "lucide-react";

const THEME = {
  bg: "bg-[#FDFBF7]",
  card: "bg-[#FFFFFF] border border-[#F0EBE1] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] rounded-2xl",
  textMain: "text-[#2C3E50]",
  textMuted: "text-[#7F8C8D]",
  goldText: "text-[#C19B6C]",
  goldBg: "bg-[#C19B6C] hover:bg-[#A07E50]",
  navBg: "bg-[#FFFFFF] border-t border-[#F0EBE1]",
} as const;

const HOTEL_BRANDS = {
  بودل: ["بودل الفيحاء", "بودل الصحافة", "بودل التحلية", "بودل المونسية", "بودل أبها"],
  عابر: ["عابر أبها", "عابر الياسمين", "عابر التخصصي", "عابر المونسية"],
  بريرا: ["بريرا العليا", "بريرا قرطبة", "بريرا النخيل", "بريرا الوزارات"],
  نارسس: ["نارسس رويال", "نارسس أبحر"],
} as const;

type Brand = keyof typeof HOTEL_BRANDS;
type PrototypeRoute = "/" | "/agents" | "/contact" | "/profile" | "/admin";
type LoginMode = "login" | "reset";

type ContactFormData = {
  brand: Brand | "";
  branch: string;
  guestName: string;
  guestPhone: string;
  reason: string;
};

const PREVIEW_BASE_PATH = "/boudl-preview";
const VALID_ROUTES: PrototypeRoute[] = ["/", "/agents", "/contact", "/profile", "/admin"];
const emptyContactForm: ContactFormData = { brand: "", branch: "", guestName: "", guestPhone: "", reason: "" };

const getRouteFromWindow = (): PrototypeRoute => {
  const relativePath = window.location.pathname.replace(PREVIEW_BASE_PATH, "") || "/";
  return VALID_ROUTES.includes(relativePath as PrototypeRoute) ? (relativePath as PrototypeRoute) : "/";
};

const getPreviewPath = (route: PrototypeRoute) => `${PREVIEW_BASE_PATH}${route === "/" ? "" : route}`;

export default function BoudlPrototype() {
  const [currentRoute, setCurrentRoute] = useState<PrototypeRoute>(() => getRouteFromWindow());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [empId, setEmpId] = useState("");
  const [empPassword, setEmpPassword] = useState("");
  const [resetUser, setResetUser] = useState("");
  const [contactSuccess, setContactSuccess] = useState(false);
  const [ticketNo, setTicketNo] = useState("");
  const [formData, setFormData] = useState<ContactFormData>(emptyContactForm);

  const branchOptions = useMemo(() => (formData.brand ? HOTEL_BRANDS[formData.brand] : []), [formData.brand]);

  const navigate = useCallback((route: PrototypeRoute) => {
    setCurrentRoute(route);
    window.history.pushState({ route }, "", getPreviewPath(route));
  }, []);

  useEffect(() => {
    const onPopState = () => setCurrentRoute(getRouteFromWindow());
    window.addEventListener("popstate", onPopState);
    window.history.replaceState({ route: currentRoute }, "", getPreviewPath(currentRoute));
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, branch: "" }));
  }, [formData.brand]);

  const handleLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoggedIn(true);
    setShowLoginModal(false);
    navigate("/profile");
  };

  const handleResetSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetEmailSent(true);
    window.setTimeout(() => {
      setResetEmailSent(false);
      setLoginMode("login");
      setShowLoginModal(false);
      setResetUser("");
    }, 4000);
  };

  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTicketNo(`REQ-${Math.floor(1000 + Math.random() * 9000)}`);
    setContactSuccess(true);
    window.setTimeout(() => {
      setContactSuccess(false);
      setFormData(emptyContactForm);
    }, 4000);
  };

  return (
    <div dir="rtl" className={`min-h-screen ${THEME.bg} font-sans flex flex-col lg:max-w-md mx-auto relative shadow-2xl lg:border-x border-[#F0EBE1]`} style={{ fontFamily: "'Cairo', sans-serif" }}>
      <header className="pt-8 pb-4 px-6 sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-[#F0EBE1] flex justify-between items-center">
        <h1 className={`text-lg font-black tracking-widest ${THEME.textMain}`}>إدارة الحجز المركزي</h1>
        {isLoggedIn ? (
          <button onClick={() => navigate("/profile")} className={`flex items-center gap-1 text-xs font-bold ${THEME.goldText} bg-[#FDFBF7] px-3 py-1.5 rounded-xl border border-[#F0EBE1]`}><CircleUser size={16} /><span>ملفي</span></button>
        ) : (
          <button onClick={() => { setLoginMode("login"); setShowLoginModal(true); }} className={`flex items-center gap-1 text-xs font-bold ${THEME.textMuted} hover:text-[#C19B6C] transition-colors`}><LockOpen size={16} /><span>تسجيل دخول</span></button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-5 pb-24">
        {currentRoute === "/" && <DashboardView />}
        {currentRoute === "/agents" && <EmptyView title="قائمة الموظفين" icon={<BriefcaseBusiness className="text-[#7F8C8D] opacity-50" size={32} />} message="لا توجد بيانات متاحة للموظفين" />}
        {currentRoute === "/contact" && (contactSuccess ? <SuccessTicket ticketNo={ticketNo} /> : <ContactForm formData={formData} branchOptions={branchOptions} setFormData={setFormData} onSubmit={handleContactSubmit} />)}
        {currentRoute === "/profile" && <ProfileView onLogout={() => { setIsLoggedIn(false); navigate("/"); }} />}
        {currentRoute === "/admin" && <AdminView />}
      </main>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className={`${THEME.card} w-full max-w-sm p-6 relative animate-slide-up`}>
            <button onClick={() => setShowLoginModal(false)} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600" aria-label="إغلاق"><X size={20} /></button>
            {loginMode === "login" ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <h3 className={`text-base font-bold ${THEME.textMain} text-center mb-2`}>تسجيل دخول الموظف</h3>
                <Field label="الرقم الوظيفي" value={empId} onChange={setEmpId} placeholder="EMP-XXXX" />
                <Field label="الرقم السري" value={empPassword} onChange={setEmpPassword} placeholder="••••••••" type="password" />
                <button type="submit" className={`w-full ${THEME.goldBg} text-white font-bold py-3 rounded-xl transition-transform active:scale-95`}>دخول</button>
                <div className="text-center pt-2"><button type="button" onClick={() => setLoginMode("reset")} className={`text-xs font-bold ${THEME.goldText} hover:underline`}>طلب استعادة الرقم السري</button></div>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <h3 className={`text-base font-bold ${THEME.textMain} text-center mb-2`}>استعادة الرقم السري</h3>
                {resetEmailSent ? <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-center text-xs text-green-700 font-bold">تم إرسال رابط استعادة الرقم السري إلى الإيميل المسجل للموظف بنجاح.</div> : <><Field label="اسم مستخدم الموظف (User)" value={resetUser} onChange={setResetUser} placeholder="أدخل اسم المستخدم أو الإيميل..." /><button type="submit" className={`w-full ${THEME.goldBg} text-white font-bold py-3 rounded-xl transition-transform active:scale-95`}>إرسال رابط الاستعادة</button><div className="text-center pt-2"><button type="button" onClick={() => setLoginMode("login")} className={`text-xs font-bold ${THEME.textMuted} hover:underline`}>العودة لتسجيل الدخول</button></div></>}
              </form>
            )}
          </div>
        </div>
      )}

      {currentRoute !== "/admin" && <BottomNavigation currentRoute={currentRoute} navigate={navigate} />}
      <style dangerouslySetInnerHTML={{ __html: `.animate-fade-in{animation:fadeIn .4s cubic-bezier(.4,0,.2,1) forwards}.animate-slide-up{animation:slideUp .3s cubic-bezier(.4,0,.2,1) forwards}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes slideUp{from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}}.pb-safe{padding-bottom:env(safe-area-inset-bottom,1rem)}` }} />
    </div>
  );
}

function DashboardView() {
  return <div className="space-y-6 animate-fade-in"><h2 className={`text-xl font-bold ${THEME.textMain}`}>مؤشرات الأداء</h2><div className="grid grid-cols-2 gap-4"><Metric icon={<ChartLine className={THEME.goldText} />} label="إجمالي الحجوزات" /><Metric icon={<Headphones className={THEME.goldText} />} label="طلبات التواصل" /></div><div className={`${THEME.card} p-10 text-center flex flex-col items-center justify-center border-dashed`}><FolderOpen className={`${THEME.textMuted} mb-3 opacity-50`} size={32} /><p className={`text-sm ${THEME.textMuted}`}>لا توجد بيانات للعرض حالياً</p></div></div>;
}
function Metric({ icon, label }: { icon: JSX.Element; label: string }) { return <div className={`${THEME.card} p-5 text-center`}><div className="w-10 h-10 mx-auto bg-[#FDFBF7] rounded-full flex items-center justify-center mb-2">{icon}</div><p className={`text-2xl font-black ${THEME.textMain}`}>--</p><p className={`text-xs ${THEME.textMuted} mt-1`}>{label}</p></div>; }
function EmptyView({ title, icon, message }: { title: string; icon: JSX.Element; message: string }) { return <div className="space-y-6 animate-fade-in"><h2 className={`text-xl font-bold ${THEME.textMain}`}>{title}</h2><div className={`${THEME.card} p-10 text-center flex flex-col items-center justify-center border-dashed`}>{icon}<p className={`text-sm ${THEME.textMuted} mt-3`}>{message}</p></div></div>; }
function SuccessTicket({ ticketNo }: { ticketNo: string }) { return <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center shadow-sm"><div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><Check size={32} /></div><h3 className="text-lg font-bold text-green-800 mb-2">تم إنشاء طلب التواصل بنجاح</h3><p className="text-sm text-green-700 font-bold bg-white inline-block px-4 py-2 rounded-lg border border-green-100">رقم الطلب: {ticketNo}</p></div>; }
function ContactForm({ formData, branchOptions, setFormData, onSubmit }: { formData: ContactFormData; branchOptions: readonly string[]; setFormData: React.Dispatch<React.SetStateAction<ContactFormData>>; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { return <form onSubmit={onSubmit} className={`${THEME.card} p-5 space-y-4`}><h3 className={`text-sm font-bold ${THEME.textMain} border-b border-[#F0EBE1] pb-3`}>إنشاء طلب تواصل</h3><div className="grid grid-cols-2 gap-4"><div><label className={`block text-xs font-bold ${THEME.textMain} mb-2`}>البراند</label><select required className="w-full bg-[#FDFBF7] border border-[#F0EBE1] rounded-xl p-3 text-sm focus:outline-none focus:border-[#C19B6C] text-[#2C3E50]" value={formData.brand} onChange={(event) => setFormData({ ...formData, brand: event.target.value as Brand | "" })}><option value="">اختر البراند...</option>{Object.keys(HOTEL_BRANDS).map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select></div><div><label className={`block text-xs font-bold ${THEME.textMain} mb-2`}>الفرع</label><select required disabled={!formData.brand} className="w-full bg-[#FDFBF7] border border-[#F0EBE1] rounded-xl p-3 text-sm focus:outline-none focus:border-[#C19B6C] disabled:opacity-50 text-[#2C3E50]" value={formData.branch} onChange={(event) => setFormData({ ...formData, branch: event.target.value })}><option value="">اختر الفرع...</option>{branchOptions.map((branch) => <option key={branch} value={branch}>{branch}</option>)}</select></div></div><Field label="اسم الضيف" value={formData.guestName} onChange={(guestName) => setFormData({ ...formData, guestName })} placeholder="الاسم الكامل" /><Field label="جوال الضيف" value={formData.guestPhone} onChange={(guestPhone) => setFormData({ ...formData, guestPhone })} placeholder="05XXXXXXXX" type="tel" /><div><label className={`block text-xs font-bold ${THEME.textMain} mb-2`}>سبب التواصل</label><textarea required rows={3} placeholder="تفاصيل الطلب..." className="w-full bg-[#FDFBF7] border border-[#F0EBE1] rounded-xl p-3 text-sm focus:outline-none focus:border-[#C19B6C]" value={formData.reason} onChange={(event) => setFormData({ ...formData, reason: event.target.value })} /></div><button type="submit" className={`w-full ${THEME.goldBg} text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 active:scale-95 transition-transform shadow-sm`}><Send size={16} /> إرسال الطلب</button></form>; }
function ProfileView({ onLogout }: { onLogout: () => void }) { return <div className="space-y-6 animate-fade-in"><div className="flex justify-between items-center"><h2 className={`text-xl font-bold ${THEME.textMain}`}>ملف الموظف</h2><button onClick={onLogout} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-xl border border-red-100">تسجيل خروج</button></div><div className={`${THEME.card} p-5 flex items-center gap-4`}><div className="w-14 h-14 bg-[#FDFBF7] border border-[#F0EBE1] text-[#C19B6C] rounded-full flex items-center justify-center shadow-inner"><BriefcaseBusiness size={28} /></div><div><h3 className={`font-bold text-base ${THEME.textMain}`}>محمد الدوسري</h3><p className={`text-xs ${THEME.textMuted} mt-0.5`}>الرقم الوظيفي: <span className="font-mono font-bold">EMP-9942</span></p><p className={`text-[11px] ${THEME.goldText} font-bold mt-0.5`}>إدارة الحجز المركزي</p></div></div><div className="grid grid-cols-2 gap-4"><div className={`${THEME.card} p-4 text-center`}><p className={`text-xs ${THEME.textMuted}`}>مؤشر الإنجاز</p><p className="text-xl font-black text-green-600 mt-1">100%</p></div><div className={`${THEME.card} p-4 text-center`}><p className={`text-xs ${THEME.textMuted}`}>الطلبات المكتملة</p><p className={`text-xl font-black ${THEME.textMain} mt-1`}>--</p></div></div><div className={`${THEME.card} p-5 space-y-4`}><h4 className={`text-xs font-bold ${THEME.textMain} border-b border-[#F0EBE1] pb-2`}>السجل التفصيلي</h4><div className="space-y-3 text-xs"><Row label="الحالة الوظيفية" value="نشط" green /><Row label="تاريخ الانضمام" value="2026/01/01" /><Row label="الإيميل المربوط" value="m.dosari@boudl.com" mono /></div></div></div>; }
function Row({ label, value, green, mono }: { label: string; value: string; green?: boolean; mono?: boolean }) { return <div className="flex justify-between border-b border-[#FDFBF7] pb-2"><span className={THEME.textMuted}>{label}</span><span className={`font-bold ${green ? "text-green-600 bg-green-50 px-2 py-0.5 rounded" : THEME.textMain} ${mono ? "font-mono" : ""}`}>{value}</span></div>; }
function AdminView() { return <div className="space-y-6 animate-fade-in"><h2 className="text-xl font-bold text-red-800">إدارة النظام</h2><div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center"><Shield className="text-red-300 mb-3 mx-auto" size={32} /><p className="text-sm text-red-700 font-bold">هذه الصفحة خاصة بالإدارة العليا فقط.</p></div></div>; }
function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) { return <div><label className={`block text-xs font-bold ${THEME.textMain} mb-2`}>{label}</label><input required type={type} placeholder={placeholder} className="w-full bg-[#FDFBF7] border border-[#F0EBE1] rounded-xl p-3 text-sm focus:outline-none focus:border-[#C19B6C]" value={value} onChange={(event) => onChange(event.target.value)} /></div>; }
function BottomNavigation({ currentRoute, navigate }: { currentRoute: PrototypeRoute; navigate: (route: PrototypeRoute) => void }) { const items = [{ path: "/" as const, label: "الرئيسية", icon: ChartPie }, { path: "/agents" as const, label: "الموظفين", icon: BriefcaseBusiness }, { path: "/contact" as const, label: "التواصل", icon: Headphones }]; return <nav className={`fixed bottom-0 w-full lg:max-w-md mx-auto ${THEME.navBg} z-30 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.03)]`}><div className="flex justify-around items-center h-16 px-2">{items.map((item) => { const Icon = item.icon; const isActive = currentRoute === item.path; return <button key={item.path} onClick={() => navigate(item.path)} className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${isActive ? `${THEME.goldText} scale-110` : `${THEME.textMuted} hover:text-[#2C3E50]`}`}><Icon size={20} /><span className="text-[10px] font-bold">{item.label}</span>{isActive && <div className="w-1 h-1 rounded-full bg-[#C19B6C] absolute bottom-1" />}</button>; })}</div></nav>; }
