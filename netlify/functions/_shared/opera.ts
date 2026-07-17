export type OperaEnvironmentId = "legacy" | "new";
export type OperaAuthScheme = "client_credentials" | "resource_owner";

export type OperaHotel = {
  id: string;
  name: string;
};

export type OperaConfig = {
  id: OperaEnvironmentId;
  label: string;
  uiUrl: string;
  gatewayUrl: string;
  clientId: string;
  clientSecret: string;
  appKey: string;
  enterpriseId: string;
  authScheme: OperaAuthScheme;
  integrationUsername: string;
  integrationPassword: string;
  scope: string;
  hotels: OperaHotel[];
  configured: boolean;
  missing: string[];
};

export type OperaSearchInput = {
  environment: OperaEnvironmentId;
  hotelId: string;
  query: string;
  arrivalStartDate?: string;
  arrivalEndDate?: string;
  departureStartDate?: string;
  departureEndDate?: string;
};

export type OperaReservationSummary = {
  confirmationNumber: string;
  reservationId: string;
  guestName: string;
  status: string;
  arrivalDate: string;
  departureDate: string;
  hotelId: string;
  hotelName: string;
  roomType: string;
  roomNumber: string;
  numberOfRooms: number | null;
};

const ENVIRONMENT_META: Record<OperaEnvironmentId, { label: string; uiUrl: string; prefix: string }> = {
  legacy: {
    label: "السعودية / النظام القديم",
    uiUrl: "https://mtce11.oraclehospitality.eu-frankfurt-1.ocs.oraclecloud.com/BHG/operacloud",
    prefix: "OPERA_LEGACY",
  },
  new: {
    label: "النظام الجديد",
    uiUrl: "https://mtce2.oraclehospitality.eu-frankfurt-1.ocs.oraclecloud.com/BHG/operacloud/faces/adf.task-flow?adf.tfId=opera-cloud-index&adf.tfDoc=/WEB-INF/taskflows/opera-cloud-index.xml",
    prefix: "OPERA_NEW",
  },
};

const envValue = (name: string) => Netlify.env.get(name)?.trim() || "";

const normalizeGatewayUrl = (value: string) => {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "";
    return url.toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
};

const normalizeHotel = (value: unknown): OperaHotel | null => {
  if (typeof value === "string") {
    const id = value.trim();
    return /^[A-Za-z0-9_.-]{1,40}$/.test(id) ? { id, name: id } : null;
  }
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = String(record.id || record.hotelId || record.code || "").trim();
  const name = String(record.name || record.label || id).trim();
  if (!/^[A-Za-z0-9_.-]{1,40}$/.test(id)) return null;
  return { id, name: name.slice(0, 100) || id };
};

const parseHotels = (raw: string): OperaHotel[] => {
  if (!raw) return [];
  let candidates: unknown[] = [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) candidates = parsed;
  } catch {
    candidates = raw.split(",").map((entry) => {
      const [id, ...nameParts] = entry.split(":");
      return { id, name: nameParts.join(":") || id };
    });
  }

  const unique = new Map<string, OperaHotel>();
  for (const candidate of candidates.slice(0, 250)) {
    const hotel = normalizeHotel(candidate);
    if (hotel) unique.set(hotel.id, hotel);
  }
  return Array.from(unique.values());
};

export const readOperaConfig = (id: OperaEnvironmentId): OperaConfig => {
  const meta = ENVIRONMENT_META[id];
  const prefix = meta.prefix;
  const rawScheme = envValue(prefix + "_AUTH_SCHEME");
  const authScheme: OperaAuthScheme = rawScheme === "resource_owner" ? "resource_owner" : "client_credentials";
  const gatewayUrl = normalizeGatewayUrl(envValue(prefix + "_GATEWAY_URL"));
  const clientId = envValue(prefix + "_CLIENT_ID");
  const clientSecret = envValue(prefix + "_CLIENT_SECRET");
  const appKey = envValue(prefix + "_APP_KEY");
  const enterpriseId = envValue(prefix + "_ENTERPRISE_ID");
  const integrationUsername = envValue(prefix + "_INTEGRATION_USERNAME");
  const integrationPassword = envValue(prefix + "_INTEGRATION_PASSWORD");
  const hotels = parseHotels(envValue(prefix + "_HOTELS"));

  const required: Array<[string, string | OperaHotel[]]> = [
    [prefix + "_GATEWAY_URL", gatewayUrl],
    [prefix + "_CLIENT_ID", clientId],
    [prefix + "_CLIENT_SECRET", clientSecret],
    [prefix + "_APP_KEY", appKey],
    [prefix + "_HOTELS", hotels],
  ];
  if (authScheme === "client_credentials") {
    required.push([prefix + "_ENTERPRISE_ID", enterpriseId]);
  } else {
    required.push(
      [prefix + "_INTEGRATION_USERNAME", integrationUsername],
      [prefix + "_INTEGRATION_PASSWORD", integrationPassword],
    );
  }

  const missing = required
    .filter(([, value]) => Array.isArray(value) ? value.length === 0 : !value)
    .map(([name]) => name);

  return {
    id,
    label: meta.label,
    uiUrl: meta.uiUrl,
    gatewayUrl,
    clientId,
    clientSecret,
    appKey,
    enterpriseId,
    authScheme,
    integrationUsername,
    integrationPassword,
    scope: envValue(prefix + "_SCOPE") || "urn:opc:hgbu:ws:__myscopes__",
    hotels,
    configured: missing.length === 0,
    missing,
  };
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const validateDatePair = (start: string, end: string, label: string): string | null => {
  if (!start && !end) return null;
  if (!start || !end) return "أدخل تاريخ بداية ونهاية " + label + ".";
  if (!ISO_DATE.test(start) || !ISO_DATE.test(end)) return "صيغة تاريخ " + label + " غير صحيحة.";

  const startTime = Date.parse(start + "T00:00:00Z");
  const endTime = Date.parse(end + "T00:00:00Z");
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) {
    return "نطاق تاريخ " + label + " غير صحيح.";
  }
  if ((endTime - startTime) / 86_400_000 > 31) {
    return "اجعل نطاق تاريخ " + label + " 31 يومًا أو أقل.";
  }
  return null;
};

export const validateOperaSearchInput = (
  value: unknown,
): { ok: true; value: OperaSearchInput } | { ok: false; error: string } => {
  if (!value || typeof value !== "object") return { ok: false, error: "طلب البحث غير صحيح." };
  const input = value as Record<string, unknown>;
  const environment = input.environment;
  if (environment !== "legacy" && environment !== "new") {
    return { ok: false, error: "اختر بيئة OPERA صحيحة." };
  }

  const hotelId = String(input.hotelId || "").trim();
  if (!/^[A-Za-z0-9_.-]{1,40}$/.test(hotelId)) {
    return { ok: false, error: "اختر الفندق المطلوب." };
  }

  const query = String(input.query || "").trim().replace(/\s+/g, " ");
  const hasControlCharacter = Array.from(query).some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
  if (query.length < 2 || query.length > 80 || hasControlCharacter) {
    return { ok: false, error: "أدخل رقم تأكيد أو اسم ضيف من حرفين إلى 80 حرفًا." };
  }

  const dates = {
    arrivalStartDate: String(input.arrivalStartDate || "").trim(),
    arrivalEndDate: String(input.arrivalEndDate || "").trim(),
    departureStartDate: String(input.departureStartDate || "").trim(),
    departureEndDate: String(input.departureEndDate || "").trim(),
  };

  const arrivalError = validateDatePair(dates.arrivalStartDate, dates.arrivalEndDate, "الوصول");
  if (arrivalError) return { ok: false, error: arrivalError };
  const departureError = validateDatePair(dates.departureStartDate, dates.departureEndDate, "المغادرة");
  if (departureError) return { ok: false, error: departureError };

  return {
    ok: true,
    value: {
      environment,
      hotelId,
      query,
      ...dates,
    },
  };
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const stringValue = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const reservationIdByType = (reservation: Record<string, unknown>, type: string) => {
  const ids = asArray(reservation.reservationIdList).map(asRecord);
  return stringValue(ids.find((item) => stringValue(item.type).toLowerCase() === type.toLowerCase())?.id);
};

const guestName = (reservation: Record<string, unknown>) => {
  const direct = asRecord(reservation.reservationGuest);
  const directName = [stringValue(direct.givenName), stringValue(direct.surname)].filter(Boolean).join(" ");
  if (directName) return directName;

  const guestsContainer = asRecord(reservation.reservationGuests);
  const guests = asArray(guestsContainer.reservationGuest).length
    ? asArray(guestsContainer.reservationGuest)
    : asArray(reservation.reservationGuests);
  const firstGuest = asRecord(guests[0]);
  const profile = asRecord(asRecord(firstGuest.profileInfo).profile);
  const customer = asRecord(profile.customer);
  const personName = asRecord(asArray(customer.personName)[0]);
  return [stringValue(personName.givenName), stringValue(personName.surname)].filter(Boolean).join(" ");
};

const reservationItems = (payload: unknown): unknown[] => {
  const root = asRecord(payload);
  const direct = asRecord(root.reservations);
  if (Array.isArray(direct.reservationInfo)) return direct.reservationInfo;

  const getReservations = asRecord(root.getReservations);
  const response = asRecord(getReservations.response);
  const nested = asRecord(response.reservations);
  if (Array.isArray(nested.reservationInfo)) return nested.reservationInfo;
  if (Array.isArray(root.reservationInfo)) return root.reservationInfo;
  return [];
};

export const normalizeOperaReservations = (payload: unknown): {
  reservations: OperaReservationSummary[];
  totalResults: number;
  hasMore: boolean;
} => {
  const items = reservationItems(payload);
  const reservations = items.slice(0, 100).map((item) => {
    const reservation = asRecord(item);
    const roomStay = asRecord(reservation.roomStay);
    const roomCount = Number(roomStay.numberOfRooms);
    return {
      confirmationNumber: reservationIdByType(reservation, "Confirmation"),
      reservationId: reservationIdByType(reservation, "Reservation"),
      guestName: guestName(reservation),
      status: stringValue(reservation.computedReservationStatus || reservation.reservationStatus),
      arrivalDate: stringValue(roomStay.arrivalDate),
      departureDate: stringValue(roomStay.departureDate),
      hotelId: stringValue(reservation.hotelId),
      hotelName: stringValue(reservation.hotelName),
      roomType: stringValue(roomStay.roomType),
      roomNumber: stringValue(roomStay.roomNumber),
      numberOfRooms: Number.isFinite(roomCount) ? roomCount : null,
    };
  });

  const root = asRecord(payload);
  const nested = asRecord(asRecord(asRecord(root.getReservations).response).reservations);
  const direct = asRecord(root.reservations);
  const total = Number(nested.totalResults ?? direct.totalResults ?? reservations.length);
  return {
    reservations,
    totalResults: Number.isFinite(total) ? total : reservations.length,
    hasMore: Boolean(nested.hasMore ?? direct.hasMore),
  };
};
