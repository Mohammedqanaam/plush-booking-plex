import { Link } from "react-router-dom";
import { ArrowLeft, CloudUpload, LockKeyhole, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const UploadCenter = () => {
  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <PageHeader title="مركز رفع البيانات" subtitle="دليل واضح وسريع للوصول الآمن إلى أدوات الرفع من لوحة الأدمن." icon={CloudUpload} />

      <section className="page-surface space-y-4">
        <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4 space-y-2">
          <p className="text-sm inline-flex items-center gap-2 font-medium"><LockKeyhole className="w-4 h-4 text-primary" /> هذه الصفحة مخصصة للعرض فقط.</p>
          <p className="text-xs text-muted-foreground">رفع أو إعادة تعيين البيانات يتم من لوحة الأدمن بعد تسجيل الدخول، ومتاح فقط للمستخدمين المخولين.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border border-border/70 bg-secondary/25 p-3">
            <p className="font-semibold">1) تسجيل الدخول</p>
            <p className="text-xs text-muted-foreground mt-1">ادخل بحساب أدمن للوصول إلى تبويب الرفع.</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-secondary/25 p-3">
            <p className="font-semibold">2) تبويب رفع CSV</p>
            <p className="text-xs text-muted-foreground mt-1">اختر الملف وتحقق من التنسيق قبل التنفيذ.</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-secondary/25 p-3">
            <p className="font-semibold">3) مراجعة النتيجة</p>
            <p className="text-xs text-muted-foreground mt-1">تحقق من عدد السجلات ورسائل النجاح/الفشل.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/admin/login" className="inline-flex h-11 items-center gap-2 rounded-xl gold-gradient px-4 text-primary-foreground font-medium">
            <ShieldCheck className="w-4 h-4" /> دخول لوحة الأدمن
          </Link>
          <Link to="/admin" className="inline-flex h-11 items-center gap-2 rounded-xl border border-border/70 bg-secondary/40 px-4">
            الذهاب إلى لوحة الإدارة <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default UploadCenter;
