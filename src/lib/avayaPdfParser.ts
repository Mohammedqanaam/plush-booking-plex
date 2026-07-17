export type AvayaPdfTextItem = {
  text: string;
  x: number;
  y: number;
};

export type AvayaPdfPage = {
  width: number;
  items: AvayaPdfTextItem[];
};

type EmployeeIdentity = {
  key: string;
  employeeId: string;
  name: string;
};

type ParserHelpers = {
  employeeIdentity: (value: unknown) => EmployeeIdentity;
  durationToSeconds: (value: unknown) => number;
};

type PdfInboundEntry = EmployeeIdentity & {
  avgRingingSeconds: number;
  answeredCalls: number;
  missedCalls: number;
  inboundDurationSeconds: number;
};

type PdfDurationEntry = EmployeeIdentity & {
  seconds: number;
  events: number;
};

export type ParsedAvayaPdf =
  | { kind: "inbound"; rangeStart: string; rangeEnd: string; entries: PdfInboundEntry[] }
  | { kind: "dnd" | "timecard"; rangeStart: string; rangeEnd: string; entries: PdfDurationEntry[] };

type PdfLine = {
  width: number;
  y: number;
  items: AvayaPdfTextItem[];
  text: string;
};

const normalizeText = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();

const lineText = (items: AvayaPdfTextItem[]) => normalizeText(
  [...items]
    .sort((left, right) => left.x - right.x)
    .map((item) => item.text)
    .join(" "),
);

const linesForPage = (page: AvayaPdfPage): PdfLine[] => {
  const sorted = page.items
    .filter((item) => normalizeText(item.text))
    .sort((left, right) => right.y - left.y || left.x - right.x);
  const grouped: Array<{ y: number; items: AvayaPdfTextItem[] }> = [];

  for (const item of sorted) {
    const current = grouped[grouped.length - 1];
    if (current && Math.abs(current.y - item.y) <= 2.75) {
      current.items.push(item);
      current.y = (current.y + item.y) / 2;
    } else {
      grouped.push({ y: item.y, items: [item] });
    }
  }

  return grouped.map((line) => ({
    width: page.width,
    y: line.y,
    items: line.items,
    text: lineText(line.items),
  }));
};

const DATE_PATTERN = /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}\s+\d{1,2}:\d{2}:\d{2}\s+[AP]M\b/i;

const reportRange = (pages: AvayaPdfPage[]) => {
  const dates: string[] = [];
  pages.forEach((page) => {
    linesForPage(page).forEach((line) => {
      const match = line.text.match(DATE_PATTERN)?.[0];
      if (match && !dates.includes(match)) dates.push(match);
    });
  });
  return { rangeStart: dates[0] || "", rangeEnd: dates[1] || "" };
};

const classifyPdf = (pages: AvayaPdfPage[]) => {
  const firstPageText = linesForPage(pages[0] || { width: 0, items: [] })
    .map((line) => line.text)
    .join(" ");
  if (/User\s+Inbound\s+Summary/i.test(firstPageText)) return "inbound" as const;
  if (/Agent\s+Realtime\s+Feature\s+Trace/i.test(firstPageText)) return "dnd" as const;
  if (/Agent\s+Time\s+Card/i.test(firstPageText)) return "timecard" as const;
  return null;
};

const numberValue = (value: unknown) => {
  const parsed = Number(normalizeText(value).replace(/,/g, "").replace(/%$/, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const inboundColumns = (line: PdfLine) => {
  const boundaries = [0, 0.26, 0.335, 0.41, 0.485, 0.565, 0.64, 0.72, 0.795, 0.865, 1.01];
  const cells = Array.from({ length: 10 }, () => [] as AvayaPdfTextItem[]);
  line.items.forEach((item) => {
    const position = line.width ? item.x / line.width : 0;
    const column = boundaries.findIndex((upper, index) => index > 0 && position < upper) - 1;
    if (column >= 0 && column < cells.length) cells[column].push(item);
  });
  return cells.map((items) => lineText(items));
};

const parseInbound = (pages: AvayaPdfPage[], helpers: ParserHelpers): PdfInboundEntry[] => {
  const entries: PdfInboundEntry[] = [];
  pages.forEach((page) => {
    linesForPage(page).forEach((line) => {
      const cells = inboundColumns(line);
      if (!/\(\d+\)\s*$/.test(cells[0])) return;
      const totalCalls = numberValue(cells[1]);
      if (totalCalls <= 0) return;
      entries.push({
        ...helpers.employeeIdentity(cells[0]),
        avgRingingSeconds: helpers.durationToSeconds(cells[4]),
        answeredCalls: numberValue(cells[7]),
        missedCalls: numberValue(cells[9]),
        inboundDurationSeconds: helpers.durationToSeconds(cells[2]),
      });
    });
  });
  return entries;
};

const employeeFromLine = (line: PdfLine, helpers: ParserHelpers) => {
  const leftText = lineText(line.items.filter((item) => item.x < line.width * 0.38));
  if (!/\(\d+\)\s*$/.test(leftText)) return null;
  return helpers.employeeIdentity(leftText);
};

const parseDurations = (pages: AvayaPdfPage[], kind: "dnd" | "timecard", helpers: ParserHelpers): PdfDurationEntry[] => {
  const entries = new Map<string, PdfDurationEntry>();
  let current: EmployeeIdentity | null = null;

  const ensure = (identity: EmployeeIdentity) => {
    const existing = entries.get(identity.key);
    if (existing) return existing;
    const created = { ...identity, seconds: 0, events: 0 };
    entries.set(identity.key, created);
    return created;
  };

  pages.forEach((page) => {
    linesForPage(page).forEach((line) => {
      const identity = employeeFromLine(line, helpers);
      if (identity) {
        current = identity;
        ensure(identity);
        return;
      }
      if (!current || !/Feature\s+ID\s*:/i.test(line.text)) return;
      if (kind === "dnd" && !/Do\s+Not\s+Disturb/i.test(line.text)) return;
      const duration = [...line.items]
        .sort((left, right) => right.x - left.x)
        .map((item) => normalizeText(item.text))
        .find((value) => /^\d+:\d{1,2}:\d{1,2}$/.test(value));
      const seconds = helpers.durationToSeconds(duration);
      if (seconds <= 0) return;
      const entry = ensure(current);
      entry.seconds += seconds;
      entry.events += 1;
    });
  });

  return Array.from(entries.values());
};

export const parseAvayaPdfPages = (pages: AvayaPdfPage[], helpers: ParserHelpers): ParsedAvayaPdf => {
  if (!pages.length) throw new Error("ملف PDF لا يحتوي على صفحات قابلة للقراءة.");
  const kind = classifyPdf(pages);
  if (!kind) throw new Error("ملف PDF ليس من تقارير Avaya الثلاثة المدعومة.");
  const range = reportRange(pages);
  if (kind === "inbound") return { kind, ...range, entries: parseInbound(pages, helpers) };
  return { kind, ...range, entries: parseDurations(pages, kind, helpers) };
};

export const loadAndParseAvayaPdf = async (file: File, helpers: ParserHelpers): Promise<ParsedAvayaPdf> => {
  const [pdfjs, workerModule] = await Promise.all([
    import("pdfjs-dist/legacy/build/pdf.mjs"),
    import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
  ]);
  if (!pdfjs.GlobalWorkerOptions.workerSrc) pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({
    data: bytes,
    isEvalSupported: false,
    useSystemFonts: true,
  });
  let document: Awaited<typeof loadingTask.promise> | null = null;
  try {
    document = await loadingTask.promise;
    if (document.numPages > 100) throw new Error("ملف PDF يتجاوز 100 صفحة ولا يمكن معالجته بأمان.");
    const pages: AvayaPdfPage[] = [];
    let totalItems = 0;
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const textContent = await page.getTextContent();
      const items = textContent.items.flatMap((item) => {
        if (!("str" in item) || !normalizeText(item.str)) return [];
        return [{ text: item.str, x: item.transform[4], y: item.transform[5] }];
      });
      totalItems += items.length;
      if (totalItems > 200_000) throw new Error("ملف PDF يحتوي على بيانات تتجاوز حدود المعالجة الآمنة.");
      pages.push({ width: viewport.width, items });
    }
    return parseAvayaPdfPages(pages, helpers);
  } catch (cause) {
    if (cause instanceof Error && /Avaya|100 صفحة|حدود المعالجة|لا يحتوي/.test(cause.message)) throw cause;
    throw new Error(`تعذر قراءة ${file.name}. تأكد أن الملف PDF أصلي وغير محمي بكلمة مرور.`);
  } finally {
    await document?.destroy();
    await loadingTask.destroy();
  }
};
