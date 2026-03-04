export type ComplaintCategoryMap = Record<string, string[]>;

export const BRAND_PREFIX: Record<string, string> = {
  Boudl: "BO",
  Braira: "BR",
  Narcissus: "NA",
  Aber: "AB",
};

export const COMPLAINT_CATEGORIES: ComplaintCategoryMap = {
  "مشاكل النظافة والخدمات الفندقية": [
    "تأخر تنظيف الغرفة",
    "نقص المناشف",
    "عدم تغيير أغطية السرير",
    "نظافة دورة المياه",
    "عدم تعبئة مستلزمات الضيافة",
  ],
  "مشاكل خدمة الموظفين": [
    "تأخر الاستقبال",
    "سلوك غير لائق من الموظف",
    "ضعف التواصل",
    "بطء الاستجابة",
    "معلومات غير صحيحة",
  ],
  "مشاكل الحجز والشؤون المالية": [
    "تخصيص غرفة غير صحيحة",
    "الحجز غير موجود",
    "خطأ في الفاتورة",
    "تأخر الاسترجاع",
    "خلاف على مبلغ التأمين",
  ],
  "مشاكل المطعم والضيافة": [
    "تأخر تقديم الطلب",
    "مشكلة في جودة الطعام",
    "خطأ في الطلب",
    "ضعف خدمة المطعم",
    "عدم مراعاة النظام الغذائي الخاص",
  ],
  "مشاكل المرافق": [
    "عطل في أجهزة النادي",
    "نظافة المسبح",
    "مشكلة في مواقف السيارات",
    "تعطل المصعد",
    "نظافة المناطق العامة",
  ],
  "مشاكل تقنية": [
    "تعطل شبكة الواي فاي",
    "التلفاز لا يعمل",
    "خلل في بطاقة الدخول",
    "مشكلة في القفل الذكي",
    "تعطل مقبس الكهرباء",
  ],
  "مشاكل الأمن والسلامة": [
    "دخول غير مصرح به",
    "ملاحظة أمنية بخصوص مفقودات",
    "تأخر التعامل مع حالة طارئة",
    "مشكلة في إنذار الحريق",
    "بلاغ عن منطقة غير آمنة",
  ],
  "مشاكل السياسات والإدارة": [
    "عدم وضوح السياسة",
    "تأخر التصعيد",
    "خلاف على التعويض",
    "عدم توفر المدير",
    "عدم الالتزام بالإجراءات",
  ],
  "حالات خاصة ونادرة": [
    "دعم حالة طبية طارئة",
    "حالة حساسة لضيف مهم",
    "ملاحظة بخصوص إجراء قانوني",
    "تصعيد عبر وسائل التواصل",
    "حادثة بين أكثر من فرع",
  ],
};

export const DEFAULT_WHATSAPP_TEMPLATE = `رقم الشكوى: {{complaintNo}}\nالعلامة التجارية: {{brand}}\nالفرع: {{branch}}\nتصنيف الشكوى: {{mainCategory}}\nالتصنيف الفرعي: {{subCategory}}\n\nاسم الضيف: {{guestName}}\nرقم الحجز: {{bookingMobile}}\nرقم الجناح: {{suiteNumber}}\nتاريخ الدخول: {{checkInDate}}\nحالة النزيل داخل الفندق: {{inHouse}}\nالأولوية: {{urgency}}\n\nيرجى التعامل حسب البروتوكول التشغيلي.`;

export const DEFAULT_EMAIL_TEMPLATE = `
<h2>Complaint {{complaintNo}}</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
  <tr><td><b>العلامة التجارية</b></td><td>{{brand}}</td></tr>
  <tr><td><b>الفرع</b></td><td>{{branch}}</td></tr>
  <tr><td><b>تصنيف الشكوى</b></td><td>{{mainCategory}}</td></tr>
  <tr><td><b>التصنيف الفرعي</b></td><td>{{subCategory}}</td></tr>
  <tr><td><b>الأولوية</b></td><td>{{urgency}}</td></tr>
  <tr><td><b>اسم الضيف</b></td><td>{{guestName}}</td></tr>
  <tr><td><b>رقم الحجز</b></td><td>{{bookingMobile}}</td></tr>
  <tr><td><b>رقم الجناح</b></td><td>{{suiteNumber}}</td></tr>
  <tr><td><b>تاريخ الدخول</b></td><td>{{checkInDate}}</td></tr>
  <tr><td><b>داخل الفندق</b></td><td>{{inHouse}}</td></tr>
  <tr><td><b>ملاحظات</b></td><td>{{notes}}</td></tr>
</table>
`;

export function applyTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, val ?? ""),
    template,
  );
}
