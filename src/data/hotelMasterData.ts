export type MasterHotel = {
  id: string;
  name: string;
  brand: string;
  city: string;
  breakfast: string;
  pool: string;
  coffeeShop: string;
  restaurant: string;
  viewBalcony: string;
  parking: string;
  meetingHall: string;
  weddingPackage: string;
  gym: string;
  laundry: string;
  outdoorSeating: string;
  spa: string;
  jacuzzi: string;
  kidsSection: string;
  hotelPhone?: string;
  salesPhone?: string;
  roomTypes?: string;
};

export const masterHotels: MasterHotel[] = [
  { id: "br-olaya", name: "بريرا العليا", brand: "بريرا", city: "الرياض", breakfast: "افطار بوفيه / 7:00ص - 11:30ص", pool: "اطفال+رجال/10ص-6م", coffeeShop: "يوجد+لاونج شيشة", restaurant: "يوجد/7ص-11م", viewBalcony: "لايوجد", parking: "يوجد/عامة ومحدودة", meetingHall: "قاعة احتفالات / يمكن تقسيمها 3 أقسام", weddingPackage: "يوجد / حسب اختيارات العميل", gym: "يوجد/24ساعة", laundry: "يوجد", outdoorSeating: "يوجد", spa: "لايوجد", jacuzzi: "لايوجد", kidsSection: "لايوجد", hotelPhone: "112933354", salesPhone: "0598919900", roomTypes: "Superior King 30م²، Superior Twin 30م²، Premier King 30م²، Superior Suite 60م²، Executive Suite 90م²" },
  { id: "br-qurtubah", name: "بريرا قرطبه", brand: "بريرا", city: "الرياض", breakfast: "افطار بوفيه / 6:30 ص - 11:00 ص", pool: "اطفال+رجال/8ص-6م", coffeeShop: "يوجد", restaurant: "يوجد/24ساعة", viewBalcony: "لايوجد", parking: "عامة /جانبية مظللة", meetingHall: "يوجد/عدد غير محدد /قاعة احتفالات", weddingPackage: "يوجد / حسب اختيارات العميل", gym: "يوجد /6ص-10م", laundry: "يوجد", outdoorSeating: "يوجد", spa: "يوجد/1م-2ص", jacuzzi: "جاكوزي /سبا", kidsSection: "لايوجد", hotelPhone: "112254614", salesPhone: "0592301850", roomTypes: "Deluxe King 28م²، Deluxe Twin 28م²، Junior Suite 45م²، Executive Suite 65م²" },
  { id: "br-nakheel", name: "بريرا النخيل", brand: "بريرا", city: "الرياض", breakfast: "افطار بوفيه / 7:00ص - 11:30ص", pool: "اطفال+رجال+نساء /8ص-10م", coffeeShop: "يوجد+لاونج شيشة", restaurant: "يوجد/24ساعة", viewBalcony: "بلكونة+اطلالة/غرف بريميوم كنق", parking: "عامة /بيسمنت", meetingHall: "يوجد/عدد غير محدد /قاعة احتفالات", weddingPackage: "يوجد /850 ريال", gym: "يوجد رجال + نساء /9ص-10م", laundry: "يوجد", outdoorSeating: "يوجد", spa: "يوجد/9ص-10م", jacuzzi: "بانيو/حسب الإمكانية", kidsSection: "لايوجد", hotelPhone: "112523444", salesPhone: "0593229933", roomTypes: "Premium King Balcony 29م²، Premium Twin 36م²، Superior King 33م²، Superior Twin 35م²، Executive 2BR 106م²" },
  { id: "br-wizarat", name: "بريرا الوزارات", brand: "بريرا", city: "الرياض", breakfast: "افطار بوفيه / 7:00ص - 11:00ص", pool: "اطفال+رجال/8ص-6م", coffeeShop: "يوجد", restaurant: "يوجد/24ساعة", viewBalcony: "لايوجد", parking: "عامة /بيسمنت", meetingHall: "يوجد/عدد غير محدد", weddingPackage: "لايوجد", gym: "يوجد /8ص-10م", laundry: "يوجد مغسلة متعاقدة", outdoorSeating: "لايوجد", spa: "لايوجد", jacuzzi: "بانيو/حسب الإمكانية", kidsSection: "لايوجد", hotelPhone: "112765440" },
  { id: "br-yarmouk", name: "بريرا اليرموك", brand: "بريرا", city: "الرياض", breakfast: "افطار بوفيه / 7:00ص - 11:00ص", pool: "*", coffeeShop: "يوجد", restaurant: "يوجد/24ساعة", viewBalcony: "بلكونة/حسب الإمكانية", parking: "عامة /بيسمنت", meetingHall: "يوجد/عدد غير محدد", weddingPackage: "يوجد/حسب اختيارات العميل", gym: "لايوجد", laundry: "يوجد", outdoorSeating: "لايوجد", spa: "لايوجد", jacuzzi: "بانيو/الغرف اعلى من ستاندر", kidsSection: "يوجد", hotelPhone: "112114646" },
  { id: "br-hettin", name: "بريرا حطين", brand: "بريرا", city: "الرياض", breakfast: "--", pool: "--", coffeeShop: "-", restaurant: "-", viewBalcony: "-", parking: "-", meetingHall: "-", weddingPackage: "-", gym: "-", laundry: "-", outdoorSeating: "-", spa: "-", jacuzzi: "-", kidsSection: "-", hotelPhone: "112364247" },
  { id: "ab-yasmin", name: "عابر الياسمين", brand: "عابر", city: "الرياض", breakfast: "افطار صباحي / منيو خدمة الغرف", pool: "اطفال-رجال/9ص-6م", coffeeShop: "لايوجد", restaurant: "فقط خلال فترة الإفطار", viewBalcony: "اطلالة /حسب الإمكانية", parking: "عام+بيسمنت", meetingHall: "يوجد/5 قاعات كل قاعة 50 فرد", weddingPackage: "لايوجد", gym: "يوجد/24ساعة", laundry: "يوجد", outdoorSeating: "لايوجد", spa: "لايوجد", jacuzzi: "لايوجد", kidsSection: "يوجد", hotelPhone: "112114980" },
  { id: "ab-sahafa", name: "عابر الصحافة", brand: "عابر", city: "الرياض", breakfast: "افطار بوفيه / 6:30ص -11:00ص", pool: "اطفال-رجال/9ص-6م", coffeeShop: "لايوجد", restaurant: "فقط خلال فترة الإفطار", viewBalcony: "اطلالة /حسب الإمكانية", parking: "عام+بيسمنت", meetingHall: "يوجد/5 قاعات كل قاعة 50 فرد", weddingPackage: "لايوجد", gym: "يوجد/9ص-6م", laundry: "يوجد", outdoorSeating: "لايوجد", spa: "لايوجد", jacuzzi: "لايوجد", kidsSection: "يوجد", hotelPhone: "112270093" },
  { id: "ab-munisiyah", name: "عابر المونسية", brand: "عابر", city: "الرياض", breakfast: "افطار بوفيه / 6:30ص -10:30ص", pool: "أطفال+رجال/9ص-6م", coffeeShop: "يوجد", restaurant: "يوجد/24ساعة", viewBalcony: "لايوجد", parking: "عام+بيسمنت", meetingHall: "يوجد/ قاعة زواجات", weddingPackage: "لايوجد", gym: "يوجد/9ص-6م", laundry: "يوجد", outdoorSeating: "لايوجد", spa: "لايوجد", jacuzzi: "لايوجد", kidsSection: "يوجد", hotelPhone: "112637693", salesPhone: "0599313943", roomTypes: "Standard 24م²، Deluxe 30م²، Junior Suite 55م²" },
  { id: "ab-takhassusi", name: "عابر التخصصي", brand: "عابر", city: "الرياض", breakfast: "افطار صباحي / منيو خدمة الغرف", pool: "اطفال + رجال / 24H", coffeeShop: "يوجد", restaurant: "لايوجد", viewBalcony: "اطلالة /حسب الإمكانية", parking: "يوجد/عام", meetingHall: "لايوجد", weddingPackage: "لايوجد", gym: "يوجد/24ساعة", laundry: "يوجد", outdoorSeating: "يوجد", spa: "يوجد / 24H", jacuzzi: "لايوجد", kidsSection: "يوجد", hotelPhone: "112163900", roomTypes: "Standard 28م²، Deluxe 33م²، Junior Suite 65م²" },
  { id: "bd-quraish", name: "بودل قريش", brand: "بودل", city: "جدة", breakfast: "افطار بوفيه / 6:30ص -10:30ص", pool: "أطفال+رجال /10ص-10م", coffeeShop: "يوجد", restaurant: "يوجد", viewBalcony: "بلكونة/جونيور سويت حسب الإمكانية", parking: "يوجد/بيسمنت-عامة", meetingHall: "يوجد/25فرد", weddingPackage: "يوجد/حسب اختيارات العميل", gym: "يوجد/10ص-10م", laundry: "يوجد", outdoorSeating: "يوجد", spa: "لايوجد", jacuzzi: "جاكوزي + بانيو/جونير سويت", kidsSection: "لايوجد", hotelPhone: "0126334445" },
  { id: "bd-tahlia", name: "بودل التحلية", brand: "بودل", city: "جدة", breakfast: "افطار بوفيه / 6:30ص -10:30ص", pool: "أطفال/9ص-7م", coffeeShop: "يوجد", restaurant: "يوجد/24ساعة", viewBalcony: "لايوجد", parking: "يوجد/بيسمنت-عامة", meetingHall: "لايوجد", weddingPackage: "يوجد/575ريال", gym: "يوجد 8ص-8م", laundry: "يوجد", outdoorSeating: "لايوجد", spa: "لايوجد", jacuzzi: "لايوجد", kidsSection: "يوجد", hotelPhone: "0122614131" },
  { id: "bd-makkah", name: "بودل مكة اجياد", brand: "بودل", city: "مكة", breakfast: "افطار صباحي / منيو خدمة الغرف", pool: "لايوجد", coffeeShop: "يوجد", restaurant: "لايوجد", viewBalcony: "لايوجد", parking: "عامة", meetingHall: "لايوجد", weddingPackage: "لايوجد", gym: "لايوجد", laundry: "لايوجد", outdoorSeating: "لايوجد", spa: "لايوجد", jacuzzi: "لايوجد", kidsSection: "لايوجد", hotelPhone: "0125506660" },
  { id: "bd-ward", name: "بودل الورود", brand: "بودل", city: "الرياض", breakfast: "افطار بوفيه / 6:30ص -10:30ص", pool: "أطفال + رجال /8ص - 8م", coffeeShop: "يوجد", restaurant: "يوجد", viewBalcony: "لايوجد", parking: "عام+بيسمنت", meetingHall: "لايوجد", weddingPackage: "لايوجد", gym: "يوجد/6ص-9م", laundry: "يوجد", outdoorSeating: "يوجد", spa: "لايوجد", jacuzzi: "لايوجد", kidsSection: "يوجد", hotelPhone: "0114561294" },
  { id: "bd-sahafa", name: "بودل الصحافة", brand: "بودل", city: "الرياض", breakfast: "افطار بوفيه / 6:30ص -10:30ص", pool: "اطفال+رجال/10ص-10م", coffeeShop: "يوجد", restaurant: "يوجد/24ساعة", viewBalcony: "لايوجد", parking: "عام+بيسمنت", meetingHall: "يوجد/12فرد", weddingPackage: "لايوجد", gym: "يوجد/8ص-8م", laundry: "يوجد", outdoorSeating: "يوجد", spa: "لايوجد", jacuzzi: "بانيو/جناح تنفيذي", kidsSection: "يوجد", hotelPhone: "114107033" },
  { id: "bd-malz", name: "بودل الملز", brand: "بودل", city: "الرياض", breakfast: "افطار صباحي / منيو خدمة الغرف", pool: "أطفال + رجال /9ص-6م", coffeeShop: "يوجد", restaurant: "لايوجد", viewBalcony: "لايوجد", parking: "يوجد/عام", meetingHall: "لايوجد", weddingPackage: "لايوجد", gym: "لايوجد", laundry: "يوجد", outdoorSeating: "يوجد", spa: "لايوجد", jacuzzi: "بانيو/حسب الإمكانية", kidsSection: "يوجد", hotelPhone: "112063050" },
  { id: "bd-qasr", name: "بودل القصر", brand: "بودل", city: "الرياض", breakfast: "افطار بوفيه / 6:30ص -10:30ص/ 46 ريال", pool: "أطفال / 9ص - 6م", coffeeShop: "يوجد", restaurant: "يوجد / 24ساعة", viewBalcony: "اطلالة / سويت 2B2 , جونير سويت", parking: "يوجد/عام", meetingHall: "يوجد / 15 فرد", weddingPackage: "يوجد / 633ريال", gym: "يوجد / 9ص - 9م", laundry: "يوجد", outdoorSeating: "لايوجد", spa: "لايوجد", jacuzzi: "لايوجد", kidsSection: "يوجد", hotelPhone: "112255400" },
  { id: "bd-mounsiya", name: "بودل المونسية", brand: "بودل", city: "الرياض", breakfast: "لايوجد/ افطار عابر كبديل", pool: "أطفال+رجال/9ص-6م", coffeeShop: "لايوجد", restaurant: "لايوجد", viewBalcony: "لايوجد", parking: "عام+بيسمنت", meetingHall: "يوجد/20 فرد", weddingPackage: "لايوجد", gym: "يوجد / 8ص - 8م", laundry: "يوجد", outdoorSeating: "لايوجد", spa: "يوجد", jacuzzi: "لايوجد", kidsSection: "لايوجد", hotelPhone: "118103725" },
  { id: "bd-olaya", name: "بودل العليا", brand: "بودل", city: "الرياض", breakfast: "افطار صباحي / منيو خدمة الغرف", pool: "لايوجد", coffeeShop: "يوجد", restaurant: "لايوجد", viewBalcony: "اطلالة /حسب الإمكانية", parking: "يوجد/عام", meetingHall: "لايوجد", weddingPackage: "يوجد/حسب اختيارات العميل", gym: "يوجد/24ساعة", laundry: "يوجد", outdoorSeating: "لايوجد", spa: "لايوجد", jacuzzi: "لايوجد", kidsSection: "لايوجد", hotelPhone: "114626883" },
  { id: "bd-wadi", name: "بودل الوادي", brand: "بودل", city: "الرياض", breakfast: "افطار صباحي / منيو خدمة الغرف", pool: "لايوجد", coffeeShop: "يوجد", restaurant: "لايوجد", viewBalcony: "اطلالة /حسب الإمكانية", parking: "يوجد/عام", meetingHall: "لايوجد", weddingPackage: "يوجد/575ريال", gym: "تحت الإنشاء", laundry: "لايوجد", outdoorSeating: "لايوجد", spa: "لايوجد", jacuzzi: "جاكوزي/ جناح تنفيذي", kidsSection: "يوجد", hotelPhone: "112500010" },
  { id: "nr-royal", name: "نارسس رويال", brand: "نارسس", city: "الرياض", breakfast: "افطار بوفيه / 7:00ص - 11:00 ص", pool: "نسائي + اطفال + رجالي/10ص-10م", coffeeShop: "يوجد", restaurant: "يوجد / 24ساعة", viewBalcony: "اطلالة /MV المملكة SV الفيصلية", parking: "يوجد/بيسمنت -عام", meetingHall: "يوجد/غيرمحدد", weddingPackage: "يوجد/1500 ريال شامل تجهيز الجناح + عشاء", gym: "يوجد", laundry: "يوجد", outdoorSeating: "لايوجد", spa: "يوجد/10ص-10م", jacuzzi: "جاكوزي/سبا + بانيو ببعض الغرف", kidsSection: "-", hotelPhone: "114061515", salesPhone: "صالح 0583053045 / تغريد 0559654930" },
  { id: "nr-obhur", name: "نارسس أبحر", brand: "نارسس", city: "جدة", breakfast: "افطار بوفيه / 6:30ص -11:00ص", pool: "اطفال+رجال+نساء /8ص-8م", coffeeShop: "يوجد/ لاونج شيشة", restaurant: "يوجد", viewBalcony: "اطلالة المنتجع على الحديقة الداخلية", parking: "يوجد/ السيارة ب 100 داخل المنتجع", meetingHall: "يوجد/غيرمحدد", weddingPackage: "يوجد/1847 ريال", gym: "نساء 10ص-10م / رجال 12م-10م", laundry: "يوجد", outdoorSeating: "يوجد", spa: "يوجد", jacuzzi: "جاكوزي/ فيلا جونيور فقط", kidsSection: "يوجد/ صيانة", hotelPhone: "126099100" },
  { id: "nr-hamra", name: "نارسيس الحمرا", brand: "نارسس", city: "جدة", breakfast: "افطار بوفيه / 6:30ص -11:00ص", pool: "مسبح عام /8ص-7م", coffeeShop: "يوجد/ لاونج شيشة", restaurant: "يوجد/24ساعة", viewBalcony: "اطلالة / بالغرف والأجنحة المحددة", parking: "يوجد/خارجية + حراسات امنية", meetingHall: "يوجد/غيرمحدد", weddingPackage: "يوجد/حسب الاختيار بـ500 ريال", gym: "نساء 10ص-10م / رجال 12م-10م", laundry: "يوجد", outdoorSeating: "يوجد", spa: "يوجد/10ص-10م", jacuzzi: "بانيو / جميع الغرف ماعدا التوين", kidsSection: "لايوجد", hotelPhone: "122617700" },
  { id: "ab-abha", name: "عابر أبها", brand: "عابر", city: "أبها", breakfast: "افطار بوفيه / 6:30ص -10:30ص", pool: "لايوجد", coffeeShop: "يوجد", restaurant: "يوجد/6ص-7م", viewBalcony: "لايوجد", parking: "يوجد/بيسمنت-عامة", meetingHall: "يوجد/25 فرد", weddingPackage: "لايوجد", gym: "يوجد/24ساعة", laundry: "يوجد", outdoorSeating: "يوجد", spa: "لايوجد", jacuzzi: "لايوجد", kidsSection: "لايوجد", hotelPhone: "172740880" },
  { id: "ab-khamis", name: "عابر خميس مشيط", brand: "عابر", city: "خميس مشيط", breakfast: "افطار بوفيه / 6:30ص -10:30ص", pool: "أطفال+رجال / 9ص-6م", coffeeShop: "يوجد", restaurant: "يوجد", viewBalcony: "اطلالة /حسب الإمكانية", parking: "يوجد/جانبية", meetingHall: "يوجد", weddingPackage: "لايوجد", gym: "يوجد/9ص-6م", laundry: "يوجد", outdoorSeating: "لايوجد", spa: "لايوجد", jacuzzi: "لايوجد", kidsSection: "لايوجد", hotelPhone: "0509150191" },
  { id: "br-abha", name: "بريرا أبها", brand: "بريرا", city: "أبها", breakfast: "افطار بوفيه / 7:00 ص - 11:00ص", pool: "أطفال +رجال /10ص - 7م", coffeeShop: "يوجد /24س", restaurant: "يوجد/24س", viewBalcony: "اطلالة/جونير سويت او تنفيذي", parking: "يوجد/ عامة", meetingHall: "يوجد/غيرمحدد", weddingPackage: "850 ريال", gym: "يوجد / 7ص الى 11م", laundry: "يوجد/24س", outdoorSeating: "يوجد", spa: "يوجد/ رجال 10ص - 11م", jacuzzi: "بانيو/ الجناح التنفيذي", kidsSection: "لايوجد", hotelPhone: "0172266622" },
  { id: "br-jazan", name: "بريرا جازان", brand: "بريرا", city: "جازان", breakfast: "افطار بوفيه / 7:00 ص - 11:00ص", pool: "أطفال + رجال / 9ص الى 6م", coffeeShop: "يوجد /24س", restaurant: "يوجد / 24س", viewBalcony: "اطلالة على البحر", parking: "يوجد/ خارجية", meetingHall: "يوجد / قاعة افراح - اجتماعات", weddingPackage: "يوجد / حسب اختيارات الضيوف", gym: "يوجد/ 24س", laundry: "يوجد/ 24س", outdoorSeating: "لايوجد", spa: "لايوجد", jacuzzi: "جاكوزي / غرفة بريميوم - جناح تنفيذي", kidsSection: "لايوجد", hotelPhone: "0173265555" },
];

export const managers = [
  { name: "عارف الشميري", role: "مدير اقليمي الرياض", phone: "0590122713" },
  { name: "شاكول", role: "مدير اقليمي فنادق عابر", phone: "0555119759" },
  { name: "ثائر", role: "مدير فندق بريرا قرطبة", phone: "0591672860" },
  { name: "أحمد حجازي", role: "مدير فندق عابر ابها", phone: "0507981174" },
  { name: "مصلح", role: "مدير اقليمي الخبر", phone: "0597223233" },
  { name: "احمد هاشم", role: "مدير اقليمي جدة", phone: "0590153201" },
  { name: "احمد النجار", role: "مدير اقليمي القصيم", phone: "0590122692" },
];

export const systemsLinks = [
  {
    name: "Opera KSA",
    url: "https://mtce11.oraclehospitality.eu-frankfurt-1.ocs.oraclecloud.com/BHG/operacloud/faces/adf.task-flow?adf.tfId=opera-cloud-index",
  },
  {
    name: "Opera KW",
    url: "https://mtce2.oraclehospitality.eu-frankfurt-1.ocs.oraclecloud.com/BHG/operacloud/faces/opera-cloud-index/OperaCloud",
  },
];
