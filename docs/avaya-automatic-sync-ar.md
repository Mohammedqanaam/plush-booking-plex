# الربط التلقائي مع Avaya Call Reporting

## تدفق البيانات

1. يصدر Avaya التقارير بصيغة `XLSX` إلى مجلد مخصص داخل جهاز الدوام.
2. تعمل مهمة Windows باسم `RES Avaya Report Sync` كل خمس دقائق.
3. يرفع الموصل الملفات الجديدة إلى `https://www.res-dashbord.com/api/avaya/sync` عبر HTTPS.
4. تتحقق دالة Netlify من المفتاح والحجم والبصمة، ثم تصنف التقرير من محتواه.
5. عند اكتمال التقارير الثلاثة للفترة نفسها، تُدمج النتيجة وتظهر تلقائياً في `/admin/avaya-reports`.

الملفات المطلوبة لكل فترة:

- `User Inbound Summary`
- `Agent Realtime Feature Trace new`
- `Agent Time Card`

## إعداد Netlify

أنشئ متغير بيئة سرياً باسم `AVAYA_SYNC_KEY` بقيمة عشوائية لا تقل عن 32 حرفاً. لا تضع المفتاح داخل المستودع أو `netlify.toml`.

## إعداد جهاز Avaya

خصص مجلداً للتصدير، مثلاً:

```text
C:\Users\<windows-user>\Documents\Avaya Exports
```

اضبط التقارير الثلاثة في Avaya على الفترة الزمنية نفسها وعلى صيغة `XLSX`. يمكن استخدام جدولة Avaya إن كانت مفعلة، أو تصدير الملفات إلى المجلد نفسه يدوياً؛ الموصل يلتقط أي ملف جديد تلقائياً.

شغّل المثبت من PowerShell تحت حساب Windows الذي سيشغّل المهمة:

```powershell
.\scripts\install-avaya-bridge.ps1 -ExportDirectory "$env:USERPROFILE\Documents\Avaya Exports"
```

سيطلب المثبت مفتاح `AVAYA_SYNC_KEY` بطريقة آمنة، ثم يحفظه مشفراً بـ DPAPI بحيث لا يستطيع فكّه إلا حساب Windows نفسه.

## التشغيل والتحقق

- سجل التشغيل: `%LOCALAPPDATA%\RES-Avaya-Bridge\bridge.log`
- حالة الملفات المرفوعة: `%LOCALAPPDATA%\RES-Avaya-Bridge\state.json`
- إعدادات الموصل: `%LOCALAPPDATA%\RES-Avaya-Bridge\config.json`
- المفتاح المشفر: `%LOCALAPPDATA%\RES-Avaya-Bridge\secret.txt`

بعد وصول الملفات الثلاثة، افتح صفحة الإدارة واضغط `تحديث`. ستظهر شارة `مزامن تلقائياً` مع وقت آخر تحديث.

## حدود الأمان

- يقبل المسار ملفات `XLSX` فقط وبحد أقصى 3 ميجابايت للملف.
- يمنع تكرار الملف باستخدام بصمة SHA-256.
- لا تُحفظ ملفات Avaya الخام بعد اكتمال المعالجة.
- لا يظهر مفتاح المزامنة في الواجهة أو السجلات.
- تعمل المهمة عندما يكون حساب Windows المثبّت عليه مسجلاً للدخول.
