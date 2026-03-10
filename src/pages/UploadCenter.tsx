import { Link } from "react-router-dom";

const UploadCenter = () => {
  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <div className="glass-card p-4 space-y-3">
        <h2 className="text-2xl font-bold">مركز رفع البيانات</h2>
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
