export type BookingRow = Record<string, string | number | undefined>

export type AgentStats = {
  agent: string
  confirmed: number
  cancelled: number
  total: number
  cancelRate: number
}

const normalizeKey = (value: string) =>
  value
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\s_\/-]+/g, "")
    .trim()

function getAnyValue(record: BookingRow, keys: string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (value !== undefined && String(value).trim()) return String(value)
  }

  const entries = Object.entries(record)
  const normalizedTargets = keys.map(normalizeKey)

  for (const [rawKey, rawValue] of entries) {
    if (rawValue === undefined || !String(rawValue).trim()) continue
    const normalized = normalizeKey(rawKey)

    if (normalizedTargets.includes(normalized)) return String(rawValue)

    if (normalizedTargets.some((target) => normalized.includes(target) || target.includes(normalized))) {
      return String(rawValue)
    }
  }

  return ""
}

export function classifyBookingStatus(status: string): "confirmed" | "cancelled" {
  const s = String(status || "").trim().toUpperCase()
  if (s === "C" || s === "NS") return "cancelled"
  return "confirmed"
}

export function processBookings(rows: BookingRow[]): AgentStats[] {
  const map = new Map<string, AgentStats>()

  rows.forEach((row) => {
    const agent = getAnyValue(row, [
      "Agent name",
      "Agent Name",
      "agent name",
      "Agent",
      "Employee",
      "Employee Name",
      "User Name",
      "اسم الموظف",
      "الموظف",
      "اسم المندوب",
      "المندوب",
    ]).replace(/\s+/g, " ").trim()

    if (!agent) return

    const statusRaw = getAnyValue(row, [
      "All stute",
      "All Stute",
      "all stute",
      "Status",
      "status",
      "Booking Status",
      "BookingStatus",
      "حالة الحجز",
      "الحالة",
    ])

    const status = classifyBookingStatus(statusRaw)
    const current = map.get(agent) || {
      agent,
      confirmed: 0,
      cancelled: 0,
      total: 0,
      cancelRate: 0,
    }

    if (status === "cancelled") current.cancelled += 1
    else current.confirmed += 1

    current.total += 1
    map.set(agent, current)
  })

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      cancelRate: item.total ? Number(((item.cancelled / item.total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total - a.total)
}

export function summarizeBookings(rows: BookingRow[]) {
  let confirmed = 0
  let cancelled = 0

  rows.forEach((row) => {
    const statusRaw =
      String(
        row["All stute"] ??
        row["All Stute"] ??
        row["all stute"] ??
        row["Status"] ??
        row["status"] ??
        ""
      )

    const status = classifyBookingStatus(statusRaw)
    if (status === "cancelled") cancelled += 1
    else confirmed += 1
  })

  const total = rows.length

  return {
    confirmed,
    cancelled,
    total,
    cancelRate: total ? Number(((cancelled / total) * 100).toFixed(1)) : 0,
  }
}
