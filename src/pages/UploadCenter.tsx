import { useState } from "react";
import { api } from "@/lib/api";

const UploadCenter = () => {
  const [status, setStatus] = useState("");

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <div className="glass-card p-4 space-y-3">
        <h2 className="text-2xl font-bold">مركز رفع البيانات</h2>
        <p className="text-xs text-muted-foreground">رفع CSV وتحليل مباشر وتحديث تلقائي للوحة الرئيسية وقسم الموظفين.</p>
        <input
          type="file"
          accept=".csv"
          className="w-full text-sm"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const text = await file.text();
              const result = await api.uploadBookings(text);
              setStatus(`✅ تم رفع الملف بنجاح. سجلات: ${result.total ?? "-"}`);
            } catch {
              setStatus("❌ فشل رفع الملف. تأكد من الصيغة والأعمدة.");
            }
          }}
        />
        <div className="flex gap-2">
          <button className="h-10 px-4 rounded-lg border" onClick={() => api.resetBookings().then(() => setStatus("تم حذف بيانات الرفع الحالي")).catch(() => setStatus("تعذر حذف البيانات"))}>حذف الرفع السابق</button>
          <button className="h-10 px-4 rounded-lg gold-gradient text-primary-foreground" onClick={() => setStatus("تمت إعادة التحليل (نسخة تجريبية)")}>إعادة التحليل</button>
        </div>
        {status && <p className="text-sm">{status}</p>}
      </div>
    </div>
  );
};

export default UploadCenter;
