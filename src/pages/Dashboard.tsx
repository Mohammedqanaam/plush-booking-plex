import { CalendarCheck, CalendarX, BarChart3, Hotel } from "lucide-react";

const mockStats = {
  total: 1247,
  confirmed: 1089,
  cancelled: 158,
  cancelRate: 12.7,
};

const kpis = [
  {
    label: "إجمالي الحجوزات",
    value: mockStats.total,
    icon: Hotel,
    color: "text-primary",
  },
  {
    label: "الحجوزات المؤكدة",
    value: mockStats.confirmed,
    icon: CalendarCheck,
    color: "text-success",
  },
  {
    label: "الإلغاءات",
    value: mockStats.cancelled,
    icon: CalendarX,
    color: "text-destructive",
  },
  {
    label: "نسبة الإلغاء",
    value: `${mockStats.cancelRate}%`,
    icon: BarChart3,
    color: "text-warning",
  },
];

const Dashboard = () => {
  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">لوحة التحكم</h2>
        <p className="text-muted-foreground text-sm">
          نظرة عامة على إحصائيات الحجوزات
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            className="kpi-card"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <p className={`text-2xl font-bold ${kpi.color} animate-count-up`}>
              {kpi.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity placeholder */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-3 gold-text">آخر النشاطات</h3>
        <div className="space-y-3">
          {[
            { hotel: "فندق الريتز كارلتون", status: "مؤكد", time: "منذ 5 دقائق" },
            { hotel: "فندق هيلتون", status: "ملغي", time: "منذ 12 دقيقة" },
            { hotel: "فندق شيراتون", status: "مؤكد", time: "منذ 30 دقيقة" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{item.hotel}</p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  item.status === "مؤكد"
                    ? "bg-success/15 text-success"
                    : "bg-destructive/15 text-destructive"
                }`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
