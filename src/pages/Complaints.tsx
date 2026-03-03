import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { branchesByBrand, complaintHierarchy, enterpriseBrands, type BrandCode } from "@/data/enterprise";

type FormState = {
  brand: BrandCode;
  branch: string;
  mainCategory: string;
  subCategory: string;
  urgent: boolean;
  assignedEmployee: string;
  guestFullName: string;
  bookingMobile: string;
  contactMobile: string;
  suiteNumber: string;
  checkInDate: string;
  inHouse: "Yes" | "No";
  notes: string;
};

type ComplaintItem = FormState & { complaintNo: string; createdAt: string };

const firstCategory = Object.keys(complaintHierarchy)[0];

const Complaints = () => {
  const [form, setForm] = useState<FormState>({
    brand: "Boudl",
    branch: "",
    mainCategory: firstCategory,
    subCategory: complaintHierarchy[firstCategory][0],
    urgent: false,
    assignedEmployee: "",
    guestFullName: "",
    bookingMobile: "",
    contactMobile: "",
    suiteNumber: "",
    checkInDate: "",
    inHouse: "Yes",
    notes: "",
  });
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState<string>("");
  const [employees, setEmployees] = useState<string[]>([]);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);

  const availableBranches = useMemo(() => branchesByBrand[form.brand] || [], [form.brand]);
  const subCategories = complaintHierarchy[form.mainCategory] || [];

  const loadReference = async () => {
    const [settings, list] = await Promise.all([api.getSettings(), api.listComplaints()]);
    setEmployees((settings.enterprise?.employees || []).filter((item: any) => item.active).map((item: any) => item.name));
    setComplaints(list.complaints || []);
  };

  useEffect(() => {
    loadReference();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");
    try {
      const payload = { ...form, branch: form.branch || availableBranches[0] || "" };
      const data = await api.submitComplaint(payload);
      setResult(data);
      setStatus("تم إرسال الشكوى بنجاح");
      await loadReference();
    } catch {
      setStatus("فشل في إرسال الشكوى");
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold">قسم الشكاوى</h2>
      <form onSubmit={submit} className="grid md:grid-cols-2 gap-3 glass-card p-4">
        <select className="bg-secondary rounded-lg p-3" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value as BrandCode, branch: "" })}>
          {enterpriseBrands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
        </select>
        <select className="bg-secondary rounded-lg p-3" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
          <option value="">Select branch</option>
          {availableBranches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
        </select>

        <select className="bg-secondary rounded-lg p-3" value={form.mainCategory} onChange={(e) => setForm({ ...form, mainCategory: e.target.value, subCategory: complaintHierarchy[e.target.value][0] })}>
          {Object.keys(complaintHierarchy).map((category) => <option key={category}>{category}</option>)}
        </select>
        <select className="bg-secondary rounded-lg p-3" value={form.subCategory} onChange={(e) => setForm({ ...form, subCategory: e.target.value })}>
          {subCategories.map((sub) => <option key={sub}>{sub}</option>)}
        </select>

        <select className="bg-secondary rounded-lg p-3" value={form.assignedEmployee} onChange={(e) => setForm({ ...form, assignedEmployee: e.target.value })}>
          <option value="">الموظف المسؤول</option>
          {employees.map((name) => <option key={name}>{name}</option>)}
        </select>

        {[
          ["guestFullName", "Guest Full Name"],
          ["bookingMobile", "Booking Mobile"],
          ["contactMobile", "Contact Mobile"],
          ["suiteNumber", "Suite Number"],
        ].map(([k, label]) => (
          <input key={k} required className="bg-secondary rounded-lg p-3" placeholder={label} value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
        ))}

        <input required type="date" className="bg-secondary rounded-lg p-3" value={form.checkInDate} onChange={(e) => setForm({ ...form, checkInDate: e.target.value })} />
        <select className="bg-secondary rounded-lg p-3" value={form.inHouse} onChange={(e) => setForm({ ...form, inHouse: e.target.value as "Yes" | "No" })}>
          <option value="Yes">Guest Currently In-House: Yes</option>
          <option value="No">Guest Currently In-House: No</option>
        </select>

        <label className="flex items-center gap-2"><input type="checkbox" checked={form.urgent} onChange={(e) => setForm({ ...form, urgent: e.target.checked })} /> Urgent</label>
        <textarea className="bg-secondary rounded-lg p-3 md:col-span-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

        <button className="gold-gradient rounded-lg py-3 text-primary-foreground font-semibold md:col-span-2">Submit Complaint</button>
      </form>

      {status && <p className="text-sm text-muted-foreground">{status}</p>}
      {result?.whatsappMessage && (
        <div className="glass-card p-4 space-y-3">
          <pre className="whitespace-pre-wrap text-sm">{result.whatsappMessage}</pre>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg bg-secondary" onClick={() => navigator.clipboard.writeText(result.whatsappMessage)}>Copy</button>
            <a className="px-4 py-2 rounded-lg bg-secondary" target="_blank" href={result.whatsappLink} rel="noreferrer">Open WhatsApp</a>
          </div>
        </div>
      )}

      <div className="glass-card p-4 space-y-3">
        <h3 className="font-semibold">آخر الشكاوى (قابلة للتعديل)</h3>
        <div className="space-y-2">
          {complaints.slice(0, 12).map((item) => (
            <div key={item.complaintNo} className="border border-border/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{item.complaintNo}</span>
                <span>{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <div className="grid md:grid-cols-3 gap-2">
                <input className="bg-secondary rounded-lg p-2" value={item.guestFullName} onChange={(e) => setComplaints((prev) => prev.map((row) => row.complaintNo === item.complaintNo ? { ...row, guestFullName: e.target.value } : row))} />
                <select className="bg-secondary rounded-lg p-2" value={item.assignedEmployee || ""} onChange={(e) => setComplaints((prev) => prev.map((row) => row.complaintNo === item.complaintNo ? { ...row, assignedEmployee: e.target.value } : row))}>
                  <option value="">غير محدد</option>
                  {employees.map((name) => <option key={name}>{name}</option>)}
                </select>
                <input className="bg-secondary rounded-lg p-2" value={item.notes || ""} onChange={(e) => setComplaints((prev) => prev.map((row) => row.complaintNo === item.complaintNo ? { ...row, notes: e.target.value } : row))} />
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 rounded bg-secondary" onClick={async () => { await api.updateComplaint(item); await loadReference(); }}>حفظ</button>
                <button className="px-3 py-1 rounded bg-secondary" onClick={async () => { await api.deleteComplaint(item.complaintNo); await loadReference(); }}>حذف</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Complaints;
