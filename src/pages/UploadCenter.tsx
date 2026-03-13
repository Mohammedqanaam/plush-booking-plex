import { Link } from "react-router-dom";
import { CloudUpload } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const UploadCenter = () => {
  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <PageHeader title="مركز رفع البيانات" subtitle="إرشادات واضحة وسريعة للوصول إلى أدوات الرفع." icon={CloudUpload} />
      <div className="glass-card p-4 space-y-3">
        <p className="text-xs text-muted-foreground">
          الصفحة للعرض فقط. رفع أو إعادة تعيين البيانات يتم من لوحة الأدمن بعد تسجيل الدخول.
        </p>
        <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm space-y-2">
          <p>للتحكم في الرفع:</p>
          <ul className="list-disc pr-4 space-y-1">
            <li>سجّل الدخول كأدمن.</li>
            <li>ادخل إلى تبويب رفع CSV داخل لوحة الإدارة.</li>
          </ul>
          <Link className="underline text-primary" to="/admin/login">الانتقال إلى تسجيل دخول الأدمن</Link>
        </div>
        <p className="text-sm text-muted-foreground">
          هذه الصفحة للعرض فقط. رفع وتحديث البيانات متاح فقط من لوحة الأدمن بعد تسجيل الدخول.
        </p>
        <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
          <p>لإدارة الرفع:</p>
          <ul className="list-disc pr-4 space-y-1 mt-2">
            <li>سجّل الدخول إلى لوحة الأدمن.</li>
            <li>انتقل إلى تبويب <strong>رفع CSV</strong>.</li>
            <li>نفّذ الرفع أو حذف البيانات من هناك فقط.</li>
          </ul>
        </div>
        <Link to="/admin/login" className="inline-flex h-10 items-center rounded-lg gold-gradient px-4 text-primary-foreground">
          دخول لوحة الأدمن
        </Link>
      </div>
    </div>
  );
};

export default UploadCenter;
