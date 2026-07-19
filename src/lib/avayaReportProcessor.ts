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
  rawLoggedInDurationSeconds: number;
  excessDurationSeconds: number;
  dndEvents: number;
  loginSessions: number;
  shiftStartTimestamp: number | null;
  shiftEndTimestamp: number | null;
  shiftSpanSeconds: number;
  disconnectedDurationSeconds: number;
  reconnectionCount: number;
  hasOpenSession: boolean;
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

export type InboundEntry = {
  key: string;
  employeeId: string;
  name: string;
  avgRingingSeconds: number;
  answeredCalls: number;
  missedCalls: number;
  inboundDurationSeconds: number;
};

export type DurationEntry = {
  key: string;
  employeeId: string;
  name: string;
  seconds: number;
  events: number;
  shiftStartTimestamp?: number | null;
  shiftEndTimestamp?: number | null;
  shiftSpanSeconds?: number;
  disconnectedDurationSeconds?: number;
  reconnectionCount?: number;
  hasOpenSession?: boolean;
};

export type ParsedAvayaSource =
  | { kind: "inbound"; rangeStart: string; rangeEnd: string; entries: InboundEntry[] }
  | { kind: "dnd" | "timecard"; rangeStart: string; rangeEnd: string; entries: DurationEntry[] };

export type AvayaWorkbookInput = {
  name: string;
  bytes: Uint8Array;
};

const REPORT_TITLES: Record<AvayaFileKind, string> = {
  inbound: "User Inbound Summary",
  dnd: "Agent Realtime Feature Trace new",
  timecard: "Agent Time Card",
};

export const MAX_SHIFT_SECONDS = 9 * 60 * 60;

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

export const actualLoggedInDuration = (employee: Pick<AvayaEmployeeResult, "loggedInDurationSeconds"> & Partial<Pick<AvayaEmployeeResult, "rawLoggedInDurationSeconds">>) => (
  employee.rawLoggedInDurationSeconds ?? employee.loggedInDurationSeconds ?? 0
);

export const approvedLoggedInDuration = (employee: Pick<AvayaEmployeeResult, "loggedInDurationSeconds"> & Partial<Pick<AvayaEmployeeResult, "rawLoggedInDurationSeconds">>) => (
  Math.min(actualLoggedInDuration(employee), MAX_SHIFT_SECONDS)
);

export const shiftOverlapDuration = (employee: Pick<AvayaEmployeeResult, "loggedInDurationSeconds"> & Partial<Pick<AvayaEmployeeResult, "rawLoggedInDurationSeconds" | "excessDurationSeconds">>) => (
  employee.excessDurationSeconds ?? Math.max(0, actualLoggedInDuration(employee) - MAX_SHIFT_SECONDS)
);

export const normalizeAvayaEmployeeResult = (employee: AvayaEmployeeResult): AvayaEmployeeResult => {
  const rawDuration = actualLoggedInDuration(employee);
  return {
    ...employee,
    rawLoggedInDurationSeconds: rawDuration,
    loggedInDurationSeconds: Math.min(rawDuration, MAX_SHIFT_SECONDS),
    excessDurationSeconds: Math.max(0, rawDuration - MAX_SHIFT_SECONDS),
    shiftStartTimestamp: employee.shiftStartTimestamp ?? null,
    shiftEndTimestamp: employee.shiftEndTimestamp ?? null,
    shiftSpanSeconds: employee.shiftSpanSeconds || 0,
    disconnectedDurationSeconds: employee.disconnectedDurationSeconds || 0,
    reconnectionCount: employee.reconnectionCount ?? Math.max(0, (employee.loginSessions || 0) - 1),
    hasOpenSession: employee.hasOpenSession ?? false,
  };
};

const AVAYA_MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

export const avayaTimestamp = (value: unknown): number | null => {
  const text = normalizeText(value);
  const match = text.match(/(?:^|,\s*)([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+([AP]M)$/i);
  if (!match) return null;
  const month = AVAYA_MONTHS[match[1].toLocaleLowerCase("en")];
  if (month === undefined) return null;
  let hour = Number(match[4]) % 12;
  if (match[7].toLocaleUpperCase("en") === "PM") hour += 12;
  const timestamp = Date.UTC(Number(match[3]), month, Number(match[2]), hour, Number(match[5]), Number(match[6]));
  return Number.isFinite(timestamp) ? timestamp : null;
};

export const formatAvayaClock = (timestamp: number | null | undefined) => {
  if (timestamp === null || timestamp === undefined || !Number.isFinite(timestamp)) return "—";
  const date = new Date(timestamp);
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}:${String(date.getUTCSeconds()).padStart(2, "0")}`;
};

export type AvayaTimecardSession = { start: number; end: number | null };

export const summarizeTimecardSessions = (input: AvayaTimecardSession[]) => {
  const sessions = [...input].sort((left, right) => left.start - right.start);
  const shiftStartTimestamp = sessions[0]?.start ?? null;
  const closedEnds = sessions.flatMap((session) => session.end === null ? [] : [session.end]);
  const shiftEndTimestamp = closedEnds.length ? Math.max(...closedEnds) : null;
  let disconnectedDurationSeconds = 0;
  let previousEnd: number | null = null;
  sessions.forEach((session) => {
    if (previousEnd !== null && session.start > previousEnd) disconnectedDurationSeconds += Math.round((session.start - previousEnd) / 1000);
    if (session.end !== null) previousEnd = previousEnd === null ? session.end : Math.max(previousEnd, session.end);
  });
  return {
    shiftStartTimestamp,
    shiftEndTimestamp,
    shiftSpanSeconds: shiftStartTimestamp !== null && shiftEndTimestamp !== null
      ? Math.max(0, Math.round((shiftEndTimestamp - shiftStartTimestamp) / 1000))
      : 0,
    disconnectedDurationSeconds,
    reconnectionCount: Math.max(0, sessions.length - 1),
    hasOpenSession: sessions.some((session) => session.end === null),
  };
};

export const classifyAvayaWorkbook = (workbook: ExcelJS.Workbook): AvayaFileKind | null => {
  const firstSheet = workbook.worksheets[0];
  const title = normalizeText(firstSheet?.getCell(1, 1).text);
  if (title.includes(REPORT_TITLES.inbound)) return "inbound";
  if (title.startsWith("Agent Realtime Feature Trace")) return "dnd";
  if (title.includes(REPORT_TITLES.timecard)) return "timecard";
  return null;
};

const loadWorkbookBytes = async (bytes: Uint8Array) => {
  if (!bytes.byteLength || bytes.byteLength > 15 * 1024 * 1024) {
    throw new Error("ملف Avaya أكبر من حدود المعالجة الآمنة.");
  }
  const { default: ExcelRuntime } = await import("exceljs");
  const workbook = new ExcelRuntime.Workbook();
  await workbook.xlsx.load(bytes as never);
  const totalRows = workbook.worksheets.reduce((total, worksheet) => total + worksheet.rowCount, 0);
  if (workbook.worksheets.length > 100 || totalRows > 100_000) throw new Error("ملف Avaya أكبر من حدود المعالجة الآمنة.");
  return workbook;
};

export const parseAvayaWorkbookBytes = async (
  bytes: Uint8Array,
  fileName = "Avaya.xlsx",
): Promise<ParsedAvayaSource> => {
  const workbook = await loadWorkbookBytes(bytes);
  const kind = classifyAvayaWorkbook(workbook);
  if (!kind) throw new Error(`الملف ${fileName} ليس من تقارير Avaya المدعومة.`);
  if (kind === "inbound") return { kind, ...parseInbound(workbook) };
  return { kind, ...parseDurationWorkbook(workbook, kind) };
};

const parseWorkbookFile = async (file: File): Promise<ParsedAvayaSource> => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return parseAvayaWorkbookBytes(bytes, file.name);
};

const parseAvayaFile = async (file: File): Promise<ParsedAvayaSource> => {
  const extension = file.name.toLocaleLowerCase("en").split(".").pop();
  if (extension === "xlsx") return parseWorkbookFile(file);
  if (extension === "pdf") {
    const { loadAndParseAvayaPdf } = await import("./avayaPdfParser");
    return loadAndParseAvayaPdf(file, { employeeIdentity, durationToSeconds, avayaTimestamp, summarizeTimecardSessions }) as Promise<ParsedAvayaSource>;
  }
  throw new Error(`الملف ${file.name} غير مدعوم. استخدم PDF أو XLSX.`);
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
    const sessions: AvayaTimecardSession[] = [];
    for (let rowNumber = 5; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      if (kind === "dnd" && normalizeText(worksheet.getCell(rowNumber, 2).text) !== "Do Not Disturb") continue;
      const durationCell = worksheet.getCell(rowNumber, kind === "dnd" ? 5 : 4);
      const duration = durationToSeconds(durationCell.text || durationCell.value);
      if (duration <= 0) continue;
      seconds += duration;
      events += 1;
      if (kind === "timecard") {
        const start = avayaTimestamp(worksheet.getCell(rowNumber, 2).text || worksheet.getCell(rowNumber, 2).value);
        const end = avayaTimestamp(worksheet.getCell(rowNumber, 3).text || worksheet.getCell(rowNumber, 3).value);
        if (start !== null) sessions.push({ start, end });
      }
    }
    entries.push({
      ...identity,
      seconds,
      events,
      ...(kind === "timecard" ? summarizeTimecardSessions(sessions) : {}),
    });
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
      rawLoggedInDurationSeconds: 0,
      excessDurationSeconds: 0,
      dndEvents: 0,
      loginSessions: 0,
      shiftStartTimestamp: null,
      shiftEndTimestamp: null,
      shiftSpanSeconds: 0,
      disconnectedDurationSeconds: 0,
      reconnectionCount: 0,
      hasOpenSession: false,
      hasInbound: false,
      hasDnd: false,
      hasTimecard: false,
    };
    merged.set(entry.key, created);
    return created;
  };

  inbound.forEach((entry) => Object.assign(ensure(entry), entry, { hasInbound: true }));
  dnd.forEach((entry) => Object.assign(ensure(entry), { dndDurationSeconds: entry.seconds, dndEvents: entry.events, hasDnd: true }));
  timecard.forEach((entry) => {
    const approvedSeconds = Math.min(entry.seconds, MAX_SHIFT_SECONDS);
    Object.assign(ensure(entry), {
      loggedInDurationSeconds: approvedSeconds,
      rawLoggedInDurationSeconds: entry.seconds,
      excessDurationSeconds: Math.max(0, entry.seconds - approvedSeconds),
      loginSessions: entry.events,
      shiftStartTimestamp: entry.shiftStartTimestamp ?? null,
      shiftEndTimestamp: entry.shiftEndTimestamp ?? null,
      shiftSpanSeconds: entry.shiftSpanSeconds ?? 0,
      disconnectedDurationSeconds: entry.disconnectedDurationSeconds ?? 0,
      reconnectionCount: entry.reconnectionCount ?? Math.max(0, entry.events - 1),
      hasOpenSession: entry.hasOpenSession ?? false,
      hasTimecard: true,
    });
  });

  return Array.from(merged.values())
    .map(normalizeAvayaEmployeeResult)
    .sort((a, b) => b.missedCalls - a.missedCalls || b.answeredCalls - a.answeredCalls);
};

const mergeParsedSources = (
  parsed: Array<{ name: string; source: ParsedAvayaSource }>,
): AvayaReportResult => {
  const byKind = new Map<AvayaFileKind, { name: string; source: ParsedAvayaSource }>();
  parsed.forEach((item) => {
    const kind = item.source.kind;
    if (byKind.has(kind)) throw new Error(`تم اختيار تقرير ${REPORT_TITLES[kind]} أكثر من مرة.`);
    byKind.set(kind, item);
  });
  if (byKind.size !== 3) throw new Error("يجب اختيار User Inbound وFeature Trace وTime Card.");

  const inbound = byKind.get("inbound")!.source as Extract<ParsedAvayaSource, { kind: "inbound" }>;
  const dnd = byKind.get("dnd")!.source as Extract<ParsedAvayaSource, { kind: "dnd" | "timecard" }>;
  const timecard = byKind.get("timecard")!.source as Extract<ParsedAvayaSource, { kind: "dnd" | "timecard" }>;
  const ranges = [inbound, dnd, timecard].map((source) => `${source.rangeStart}|${source.rangeEnd}`);
  const warnings: string[] = [];
  if (new Set(ranges).size > 1) warnings.push("الفترات الزمنية بين الملفات غير متطابقة؛ راجع تواريخ التصدير قبل الاعتماد.");

  const employees = mergeAvayaEntries(inbound.entries, dnd.entries, timecard.entries);
  const incomplete = employees.filter((employee) => !employee.hasInbound || !employee.hasDnd || !employee.hasTimecard).length;
  if (incomplete) warnings.push(`${incomplete} موظفًا لديهم بيانات ناقصة في أحد التقارير.`);
  const overlapping = employees.filter((employee) => employee.excessDurationSeconds > 0).length;
  if (overlapping) warnings.push(`${overlapping} موظفًا تجاوز مجموع جلساتهم 9 ساعات؛ عُزلت المدة الزائدة كتداخل شفت ولم تدخل في مدة العمل المعتمدة.`);

  return {
    rangeStart: inbound.rangeStart,
    rangeEnd: inbound.rangeEnd,
    employees,
    warnings,
    sourceCounts: { inbound: inbound.entries.length, dnd: dnd.entries.length, timecard: timecard.entries.length },
  };
};

export const analyzeAvayaWorkbookInputs = async (
  inputs: AvayaWorkbookInput[],
): Promise<AvayaReportResult> => {
  if (inputs.length !== 3) throw new Error("اختر تقارير Avaya الثلاثة المطلوبة.");
  const parsed: Array<{ name: string; source: ParsedAvayaSource }> = [];
  for (const input of inputs) {
    parsed.push({ name: input.name, source: await parseAvayaWorkbookBytes(input.bytes, input.name) });
  }
  return mergeParsedSources(parsed);
};

export const analyzeAvayaFiles = async (files: File[]): Promise<AvayaReportResult> => {
  if (files.length !== 3) throw new Error("اختر تقارير Avaya الثلاثة المطلوبة.");
  const parsed: Array<{ name: string; source: ParsedAvayaSource }> = [];
  // PDF.js can consume considerable memory on mobile, so the three reports are intentionally read in sequence.
  for (const file of files) parsed.push({ name: file.name, source: await parseAvayaFile(file) });
  return mergeParsedSources(parsed);
};

const riskLevel = (employee: AvayaEmployeeResult) => {
  if (!employee.hasInbound || !employee.hasDnd || !employee.hasTimecard) return "incomplete";
  if (shiftOverlapDuration(employee) > 0) return "overlap";
  const approvedDuration = approvedLoggedInDuration(employee);
  if (employee.missedCalls >= 20 || employee.avgRingingSeconds >= 12 || employee.dndDurationSeconds > 3600 || approvedDuration < 7 * 3600) return "high";
  if (employee.missedCalls >= 10 || employee.avgRingingSeconds >= 10 || approvedDuration < 8 * 3600) return "review";
  return "good";
};

export const employeeRiskLevel = riskLevel;

export const createAvayaExportWorkbook = async (report: AvayaReportResult, logoBytes?: Uint8Array) => {
  const { default: ExcelRuntime } = await import("exceljs");
  const workbook = new ExcelRuntime.Workbook();
  workbook.creator = "RES Dashboard";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("تقرير المكالمات", { views: [{ state: "frozen", ySplit: 8, rightToLeft: false }] });
  sheet.mergeCells("A1:L5");
  if (logoBytes?.byteLength) {
    const logoId = workbook.addImage({ buffer: logoBytes as never, extension: "jpeg" });
    sheet.addImage(logoId, { tl: { col: 5.1, row: 0.1 }, ext: { width: 105, height: 105 } });
  }
  sheet.mergeCells("A6:L6");
  sheet.getCell("A6").value = "تقرير مكالمات الحجز المركزي";
  sheet.mergeCells("A7:L7");
  sheet.getCell("A7").value = `${report.rangeStart} — ${report.rangeEnd}`;
  sheet.getRow(8).values = ["User", "Shift Start", "Shift End", "Shift Span", "Approved Work (Max 9h)", "Shift Overlap", "Session Gaps", "Reconnects", "Avg Ringing", "Answered", "Missed", "DND Duration"];
  report.employees.forEach((employee) => {
    sheet.addRow([
      employee.name,
      formatAvayaClock(employee.shiftStartTimestamp),
      employee.hasOpenSession ? "Online" : formatAvayaClock(employee.shiftEndTimestamp),
      formatDuration(employee.shiftSpanSeconds),
      formatDuration(approvedLoggedInDuration(employee)),
      formatDuration(shiftOverlapDuration(employee)),
      formatDuration(employee.disconnectedDurationSeconds || 0),
      employee.reconnectionCount ?? Math.max(0, (employee.loginSessions || 0) - 1),
      formatDuration(employee.avgRingingSeconds),
      employee.answeredCalls,
      employee.missedCalls,
      formatDuration(employee.dndDurationSeconds),
    ]);
  });

  sheet.columns = [{ width: 28 }, { width: 14 }, { width: 14 }, { width: 15 }, { width: 22 }, { width: 17 }, { width: 16 }, { width: 12 }, { width: 16 }, { width: 13 }, { width: 12 }, { width: 16 }];
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
    row.eachCell((cell, columnNumber) => {
      cell.alignment = { vertical: "middle", horizontal: columnNumber === 1 ? "left" : "center" };
      cell.border = { bottom: { style: "thin", color: { argb: "FFD7DDD9" } } };
    });
    sheet.getCell(rowNumber, 1).font = { bold: true, color: { argb: "FF064E3B" } };
    if (approvedLoggedInDuration(employee) < 7 * 3600) sheet.getCell(rowNumber, 5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFD9DE" } };
    if (shiftOverlapDuration(employee) > 0) sheet.getCell(rowNumber, 6).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFD6EE" } };
    if (employee.disconnectedDurationSeconds > 0) sheet.getCell(rowNumber, 7).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE9C2" } };
    if (employee.avgRingingSeconds >= 10) sheet.getCell(rowNumber, 9).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF200" } };
    if (employee.missedCalls >= 20) sheet.getCell(rowNumber, 11).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFD9DE" } };
    if (employee.dndDurationSeconds > 3600) sheet.getCell(rowNumber, 12).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE9C2" } };
  }
  sheet.autoFilter = { from: "A8", to: `L${sheet.rowCount}` };
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
