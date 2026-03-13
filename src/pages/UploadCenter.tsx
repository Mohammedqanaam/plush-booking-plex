import { Link } from "react-router-dom";
import { CloudUpload, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const UploadCenter = () => {
  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <PageHeader title="مركز رفع البيانات" subtitle="إرشادات واضحة للوصول إلى أدوات الرفع من لوحة الأدمن." icon={CloudUpload} />
      <div className="page-surface">
        <p className="text-sm text-muted-foreground">
          هذه الصفحة للعرض فقط. تنفيذ الرفع/الحذف متاح من لوحة الإدارة بعد تسجيل الدخول.
          رفع أو إعادة تعيين البيانات يتم من لوحة الأدمن بعد تسجيل الدخول.
        </p>

        <div className="rounded-xl border border-border bg-secondary/30 p-3 text-sm space-y-2">
          <p className="inline-flex items-center gap-2 font-medium"><ShieldCheck className="w-4 h-4 text-primary" /> لإدارة بيانات الرفع:</p>
          <ul className="list-disc pr-5 space-y-1 text-muted-foreground">
            <li>سجّل الدخول إلى لوحة الأدمن.</li>
            <li>انتقل إلى تبويب <strong>رفع CSV</strong>.</li>
            <li>نفّذ الرفع أو إعادة التصفير من هناك فقط.</li>
          </ul>
        </div>

        <Link to="/admin/login" className="inline-flex h-11 items-center rounded-xl gold-gradient px-4 text-primary-foreground">
          دخول لوحة الأدمن
        </Link>
      </div>
    </div>
  );
};

export default UploadCenter;
