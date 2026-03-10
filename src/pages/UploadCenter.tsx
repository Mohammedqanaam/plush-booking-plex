import { Link } from "react-router-dom";

const UploadCenter = () => {
  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <div className="glass-card p-4 space-y-3">
        <h2 className="text-2xl font-bold">مركز رفع البيانات</h2>
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
      </div>
    </div>
  );
};

export default UploadCenter;
