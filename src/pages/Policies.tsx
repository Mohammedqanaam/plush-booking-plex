const items = [
  { title: "سياسة الإلغاء", type: "نص", category: "إلغاء" },
  { title: "سياسة الدفع", type: "PDF", category: "دفع" },
  { title: "سياسة الدخول والخروج", type: "صورة", category: "تشغيل" },
  { title: "تعميم العروض الموسمية", type: "PDF", category: "عروض" },
];

const Policies = () => (
  <div className="p-4 max-w-5xl mx-auto space-y-4">
    <div className="glass-card p-4">
      <h2 className="text-2xl font-bold">التعاميم والسياسات</h2>
      <p className="text-xs text-muted-foreground">عرض ملفات PDF/صور/نصوص مع تصنيف وإدارة كاملة.</p>
    </div>
    <div className="grid sm:grid-cols-2 gap-3">
      {items.map((item) => <div key={item.title} className="glass-card p-4"><p className="text-xs text-primary">{item.category}</p><h3 className="font-semibold">{item.title}</h3><p className="text-xs text-muted-foreground">النوع: {item.type}</p></div>)}
    </div>
  </div>
);

export default Policies;
