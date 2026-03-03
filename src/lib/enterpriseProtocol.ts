export type ComplaintCategoryMap = Record<string, string[]>;

export const BRAND_PREFIX: Record<string, string> = {
  Boudl: "BO",
  Braira: "BR",
  Narcissus: "NA",
  Aber: "AB",
};

export const COMPLAINT_CATEGORIES: ComplaintCategoryMap = {
  "مشكلات الغرف والأجنحة": [
    "تعطل التكييف",
    "تسرب مياه",
    "إزعاج وضوضاء",
    "تلف الأثاث",
    "عدم نظافة الجناح",
  ],
  "مشكلات النظافة والتدبير": [
    "تأخر تنظيف الغرفة",
    "نقص المناشف",
    "عدم تغيير البياضات",
    "نظافة دورة المياه",
    "عدم إعادة تعبئة المستلزمات",
  ],
  "مشكلات خدمة الموظفين": [
    "تأخر الاستقبال",
    "سوء تعامل الموظفين",
    "ضعف وضوح التواصل",
    "بطء الاستجابة",
    "معلومات غير صحيحة",
  ],
  "مشكلات الحجز والمالية": [
    "تخصيص غرفة غير صحيحة",
    "الحجز غير موجود",
    "خطأ في الفاتورة",
    "تأخر الاسترجاع",
    "خلاف على مبلغ التأمين",
  ],
  "مشكلات المطعم والضيافة": [
    "تأخر تقديم الطعام",
    "ملاحظة على جودة الطعام",
    "خطأ في الطلب",
    "ضعف خدمة المطعم",
    "عدم مراعاة النظام الغذائي الخاص",
  ],
  "مشكلات المرافق": [
    "عطل في أجهزة النادي",
    "نظافة المسبح",
    "مشكلة في مواقف السيارات",
    "تعطل المصعد",
    "نظافة المناطق العامة",
  ],
  "مشكلات تقنية": [
    "انقطاع اتصال الواي فاي",
    "تعطل التلفاز",
    "خلل بطاقة الدخول",
    "مشكلة في القفل الذكي",
    "تعطل مقبس الكهرباء",
  ],
  "مشكلات الأمن والسلامة": [
    "دخول غير مصرح به",
    "ملاحظة أمنية على فقدان متعلقات",
    "تأخر التعامل مع الطوارئ",
    "ملاحظة على إنذار الحريق",
    "بلاغ عن منطقة غير آمنة",
  ],
  "مشكلات السياسات والإدارة": [
    "سوء توضيح السياسات",
    "تأخر التصعيد",
    "خلاف حول التعويض",
    "عدم توفر المدير",
    "عدم الالتزام بالإجراءات",
  ],
  "حالات خاصة ونادرة": [
    "دعم حالة طبية طارئة",
    "حالة حساسة لكبار الشخصيات",
    "ملاحظة بخصوص إشعار قانوني",
    "تصعيد عبر وسائل التواصل",
    "حادثة بين أكثر من فرع",
  ],
};

export const DEFAULT_WHATSAPP_TEMPLATE = `Complaint No: {{complaintNo}}\nBrand: {{brand}}\nBranch: {{branch}}\nCategory: {{mainCategory}}\nSub-category: {{subCategory}}\n\nGuest Name: {{guestName}}\nSuite No: {{suiteNumber}}\nCheck-in Date: {{checkInDate}}\nGuest In-House: {{inHouse}}\nPriority: {{urgency}}\n\nPlease handle according to operational protocol.`;

export const DEFAULT_EMAIL_TEMPLATE = `
<h2>Complaint {{complaintNo}}</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
  <tr><td><b>Brand</b></td><td>{{brand}}</td></tr>
  <tr><td><b>Branch</b></td><td>{{branch}}</td></tr>
  <tr><td><b>Main Category</b></td><td>{{mainCategory}}</td></tr>
  <tr><td><b>Sub Category</b></td><td>{{subCategory}}</td></tr>
  <tr><td><b>Urgency</b></td><td>{{urgency}}</td></tr>
  <tr><td><b>Guest Name</b></td><td>{{guestName}}</td></tr>
  <tr><td><b>Contact Mobile</b></td><td>{{contactMobile}}</td></tr>
  <tr><td><b>Suite Number</b></td><td>{{suiteNumber}}</td></tr>
  <tr><td><b>Check-in Date</b></td><td>{{checkInDate}}</td></tr>
  <tr><td><b>In House</b></td><td>{{inHouse}}</td></tr>
  <tr><td><b>Notes</b></td><td>{{notes}}</td></tr>
</table>
`;

export function applyTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, val ?? ""),
    template,
  );
}
