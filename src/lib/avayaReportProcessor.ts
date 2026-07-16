import type ExcelJS from "exceljs";

export type AvayaFileKind = "inbound" | "dnd" | "timecard";

export type AvayaEmployeeResult = {
  key: string;
  employeeId: string;
  name: string;
  avgRingingSeconds: number;
  answeredCalls: number;
  missedCalls: number;
  inboundDurationSeconds: number;
  dndDurationSeconds: number;
  loggedInDurationSeconds: number;
  dndEvents: number;
  loginSessions: number;
  hasInbound: boolean;
  hasDnd: boolean;
  hasTimecard: boolean;
};

export type AvayaReportResult = {
  rangeStart: string;
  rangeEnd: string;
  employees: AvayaEmployeeResult[];
  warnings: string[];
  sourceCounts: Record<AvayaFileKind, number>;
};

type InboundEntry = {
  key: string;
  employeeId: string;
  name: string;
  avgRingingSeconds: number;
  answeredCalls: number;
  missedCalls: number;
  inboundDurationSeconds: number;
};

type DurationEntry = {
  key: string;
  employeeId: string;
  name: string;
  seconds: number;
  events: number;
};

const REPORT_TITLES: Record<AvayaFileKind, string> = {
  inbound: "User Inbound Summary",
  dnd: "Agent Realtime Feature Trace new",
  timecard: "Agent Time Card",
};

const normalizeText = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();

export const employeeIdentity = (value: unknown) => {
  const name = normalizeText(value);
  const employeeId = name.match(/\((\d+)\)\s*$/)?.[1] || "";
  const normalizedName = name
    .replace(/\(\d+\)\s*$/, "")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, "");
  return {
    name,
    employeeId,
    key: employeeId ? `id:${employeeId}` : `name:${normalizedName}`,
  };
};

export const durationToSeconds = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.round(value * 86_400));
  const text = normalizeText(value);
  const match = text.match(/^(\d+):(\d{1,2}):(\d{1,2})$/);
  if (!match) return 0;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
};

export const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Math.round(seconds || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remaining = safe % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
};

export const classifyAvayaWorkbook = (workbook: ExcelJS.Workbook): AvayaFileKind | null => {
  const firstSheet = workbook.worksheets[0];
  const title = normalizeText(firstSheet?.getCell(1, 1).text);
  if (title.includes(REPORT_TITLES.inbound)) return "inbound";
  if (title.startsWith("Agent Realtime Feature Trace")) return "dnd";
  if (title.includes(REPORT_TITLES.timecard)) return "timecard";
  return null;
};

const loadWorkbook = async (file: File) => {
  const { default: ExcelRuntime } = await import("exceljs");
  const workbook = new ExcelRuntime.Workbook();
  const bytes = new Uint8Array(await file.arrayBuffer());
  await workbook.xlsx.load(bytes as never);
  const totalRows = workbook.worksheets.reduce((total, worksheet) => total + worksheet.rowCount, 0);
  if (workbook.worksheets.length > 100 || totalRows > 100_000) throw new Error("ملف Avaya أكبر من حدود المعالجة الآمنة.");
  return workbook;
};

const parseInbound = (workbook: ExcelJS.Workbook) => {
  const worksheet = workbook.worksheets.find((sheet) => normalizeText(sheet.getCell(3, 1).text) === "User");
  if (!worksheet) throw new Error("تعذر العثور على جدول User Inbound Summary.");
  const entries: InboundEntry[] = [];
  for (let rowNumber = 4; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const identity = employeeIdentity(row.getCell(1).text);
    const totalCalls = Number(row.getCell(2).value || 0);
    if (!identity.name || !Number.isFinite(totalCalls) || totalCalls <= 0) continue;
    entries.push({
      ...identity,
      avgRingingSeconds: durationToSeconds(row.getCell(5).text || row.getCell(5).value),
      answeredCalls: Number(row.getCell(8).value || 0),
      missedCalls: Number(row.getCell(10).value || 0),
      inboundDurationSeconds: durationToSeconds(row.getCell(3).text || row.getCell(3).value),
    });
  }
  return {
    entries,
    rangeStart: normalizeText(worksheet.getCell(2, 1).text),
    rangeEnd: normalizeText(worksheet.getCell(2, 2).text),
  };
};

const parseDurationWorkbook = (workbook: ExcelJS.Workbook, kind: "dnd" | "timecard") => {
  const entries: DurationEntry[] = [];
  for (const worksheet of workbook.worksheets) {
    const identity = employeeIdentity(worksheet.getCell(2, 1).text || worksheet.name);
    if (!identity.name) continue;
    let seconds = 0;
    let events = 0;
    for (let rowNumber = 5; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      if (kind === "dnd" && normalizeText(worksheet.getCell(rowNumber, 2).text) !== "Do Not Disturb") continue;
      const durationCell = worksheet.getCell(rowNumber, kind === "dnd" ? 5 : 4);
      const duration = durationToSeconds(durationCell.text || durationCell.value);
      if (duration <= 0) continue;
      seconds += duration;
      events += 1;
    }
    entries.push({ ...identity, seconds, events });
  }
  const firstSheet = workbook.worksheets[0];
  return {
    entries,
    rangeStart: normalizeText(firstSheet?.getCell(3, 1).text),
    rangeEnd: normalizeText(firstSheet?.getCell(3, 2).text),
  };
};

export const mergeAvayaEntries = (
  inbound: InboundEntry[],
  dnd: DurationEntry[],
  timecard: DurationEntry[],
): AvayaEmployeeResult[] => {
  const merged = new Map<string, AvayaEmployeeResult>();
  const ensure = (entry: Pick<InboundEntry, "key" | "employeeId" | "name">) => {
    const current = merged.get(entry.key);
    if (current) return current;
    const created: AvayaEmployeeResult = {
      key: entry.key,
      employeeId: entry.employeeId,
      name: entry.name,
      avgRingingSeconds: 0,
      answeredCalls: 0,
      missedCalls: 0,
      inboundDurationSeconds: 0,
      dndDurationSeconds: 0,
      loggedInDurationSeconds: 0,
      dndEvents: 0,
      loginSessions: 0,
      hasInbound: false,
      hasDnd: false,
      hasTimecard: false,
    };
    merged.set(entry.key, created);
    return created;
  };

  inbound.forEach((entry) => Object.assign(ensure(entry), entry, { hasInbound: true }));
  dnd.forEach((entry) => Object.assign(ensure(entry), { dndDurationSeconds: entry.seconds, dndEvents: entry.events, hasDnd: true }));
  timecard.forEach((entry) => Object.assign(ensure(entry), { loggedInDurationSeconds: entry.seconds, loginSessions: entry.events, hasTimecard: true }));

  return Array.from(merged.values()).sort((a, b) => b.missedCalls - a.missedCalls || b.answeredCalls - a.answeredCalls);
};

export const analyzeAvayaFiles = async (files: File[]): Promise<AvayaReportResult> => {
  if (files.length !== 3) throw new Error("اختر تقارير Avaya الثلاثة المطلوبة.");
  const parsed = await Promise.all(files.map(async (file) => ({ file, workbook: await loadWorkbook(file) })));
  const byKind = new Map<AvayaFileKind, { file: File; workbook: ExcelJS.Workbook }>();
  parsed.forEach((item) => {
    const kind = classifyAvayaWorkbook(item.workbook);
    if (!kind) throw new Error(`الملف ${item.file.name} ليس من تقارير Avaya المدعومة.`);
    if (byKind.has(kind)) throw new Error(`تم اختيار تقرير ${REPORT_TITLES[kind]} أكثر من مرة.`);
    byKind.set(kind, item);
  });
  if (byKind.size !== 3) throw new Error("يجب اختيار User Inbound وFeature Trace وTime Card.");

  const inbound = parseInbound(byKind.get("inbound")!.workbook);
  const dnd = parseDurationWorkbook(byKind.get("dnd")!.workbook, "dnd");
  const timecard = parseDurationWorkbook(byKind.get("timecard")!.workbook, "timecard");
  const ranges = [inbound, dnd, timecard].map((source) => `${source.rangeStart}|${source.rangeEnd}`);
  const warnings: string[] = [];
  if (new Set(ranges).size > 1) warnings.push("الفترات الزمنية بين الملفات غير متطابقة؛ راجع تواريخ التصدير قبل الاعتماد.");

  const employees = mergeAvayaEntries(inbound.entries, dnd.entries, timecard.entries);
  const incomplete = employees.filter((employee) => !employee.hasInbound || !employee.hasDnd || !employee.hasTimecard).length;
  if (incomplete) warnings.push(`${incomplete} موظفًا لديهم بيانات ناقصة في أحد التقارير.`);

  return {
    rangeStart: inbound.rangeStart,
    rangeEnd: inbound.rangeEnd,
    employees,
    warnings,
    sourceCounts: { inbound: inbound.entries.length, dnd: dnd.entries.length, timecard: timecard.entries.length },
  };
};

const riskLevel = (employee: AvayaEmployeeResult) => {
  if (!employee.hasInbound || !employee.hasDnd || !employee.hasTimecard) return "incomplete";
  if (employee.missedCalls >= 20 || employee.avgRingingSeconds >= 12 || employee.dndDurationSeconds > 3600 || employee.loggedInDurationSeconds < 7 * 3600) return "high";
  if (employee.missedCalls >= 10 || employee.avgRingingSeconds >= 10 || employee.loggedInDurationSeconds < 8 * 3600) return "review";
  return "good";
};

export const employeeRiskLevel = riskLevel;

export const createAvayaExportWorkbook = async (report: AvayaReportResult, logoBytes?: Uint8Array) => {
  const { default: ExcelRuntime } = await import("exceljs");
  const workbook = new ExcelRuntime.Workbook();
  workbook.creator = "RES Dashboard";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("تقرير المكالمات", { views: [{ state: "frozen", ySplit: 8, rightToLeft: false }] });
  sheet.mergeCells("A1:F5");
  if (logoBytes?.byteLength) {
    const logoId = workbook.addImage({ buffer: logoBytes as never, extension: "jpeg" });
    sheet.addImage(logoId, { tl: { col: 2.45, row: 0.1 }, ext: { width: 105, height: 105 } });
  }
  sheet.mergeCells("A6:F6");
  sheet.getCell("A6").value = "تقرير مكالمات الحجز المركزي";
  sheet.mergeCells("A7:F7");
  sheet.getCell("A7").value = `${report.rangeStart} — ${report.rangeEnd}`;
  sheet.getRow(8).values = ["User", "Avg Ringing Duration", "Answered Calls", "Missed Calls", "DND Total Duration", "Logged In Duration"];
  report.employees.forEach((employee) => {
    sheet.addRow([
      employee.name,
      formatDuration(employee.avgRingingSeconds),
      employee.answeredCalls,
      employee.missedCalls,
      formatDuration(employee.dndDurationSeconds),
      formatDuration(employee.loggedInDurationSeconds),
    ]);
  });

  sheet.columns = [{ width: 30 }, { width: 22 }, { width: 18 }, { width: 16 }, { width: 22 }, { width: 22 }];
  for (let rowNumber = 1; rowNumber <= 5; rowNumber += 1) sheet.getRow(rowNumber).height = 20;
  sheet.getRow(6).height = 32;
  sheet.getRow(7).height = 24;
  sheet.getRow(8).height = 28;
  sheet.getCell("A6").font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  sheet.getCell("A6").alignment = { horizontal: "center", vertical: "middle", readingOrder: "rtl" };
  sheet.getCell("A6").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF064E3B" } };
  sheet.getCell("A7").font = { size: 10, color: { argb: "FF5F6F69" } };
  sheet.getCell("A7").alignment = { horizontal: "center", vertical: "middle" };
  sheet.getCell("A7").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F1E7" } };
  sheet.getRow(8).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
    cell.alignment = { horizontal: "left", vertical: "middle" };
  });

  for (let rowNumber = 9; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const employee = report.employees[rowNumber - 9];
    const row = sheet.getRow(rowNumber);
    row.height = 23;
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: cell.col === 1 ? "left" : "center" };
      cell.border = { bottom: { style: "thin", color: { argb: "FFD7DDD9" } } };
    });
    sheet.getCell(rowNumber, 1).font = { bold: true, color: { argb: "FF064E3B" } };
    if (employee.avgRingingSeconds >= 10) sheet.getCell(rowNumber, 2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF200" } };
    if (employee.missedCalls >= 20) sheet.getCell(rowNumber, 4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFD9DE" } };
    if (employee.dndDurationSeconds > 3600) sheet.getCell(rowNumber, 5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE9C2" } };
    if (employee.loggedInDurationSeconds < 7 * 3600) sheet.getCell(rowNumber, 6).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFD9DE" } };
  }
  sheet.autoFilter = { from: "A8", to: `F${sheet.rowCount}` };
  sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9, margins: { left: 0.25, right: 0.25, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 } };
  sheet.headerFooter.oddFooter = "مجموعة بودل للضيافة — تقرير داخلي";
  return workbook;
};

export const exportAvayaReport = async (report: AvayaReportResult) => {
  let logoBytes: Uint8Array | undefined;
  try {
    const response = await fetch("/bhg-hospitality-group.jpg");
    if (response.ok) logoBytes = new Uint8Array(await response.arrayBuffer());
  } catch {
    // The report still exports if the logo asset is temporarily unavailable.
  }
  const workbook = await createAvayaExportWorkbook(report, logoBytes);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Central_Reservation_Call_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
