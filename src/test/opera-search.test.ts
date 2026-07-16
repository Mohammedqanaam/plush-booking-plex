import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  normalizeOperaReservations,
  validateOperaSearchInput,
} from "../../netlify/functions/_shared/opera";
import operaSearch from "../../netlify/functions/opera-search";

describe("OPERA reservation search", () => {
  it("accepts a narrow read-only reservation lookup", () => {
    const result = validateOperaSearchInput({
      environment: "legacy",
      hotelId: "RUH01",
      query: "123456",
      arrivalStartDate: "2026-07-01",
      arrivalEndDate: "2026-07-05",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects broad date ranges and incomplete date pairs", () => {
    expect(validateOperaSearchInput({
      environment: "new",
      hotelId: "RUH01",
      query: "Aldosari",
      arrivalStartDate: "2026-01-01",
      arrivalEndDate: "2026-03-01",
    }).ok).toBe(false);

    expect(validateOperaSearchInput({
      environment: "new",
      hotelId: "RUH01",
      query: "Aldosari",
      departureStartDate: "2026-07-01",
    }).ok).toBe(false);
  });

  it("returns only the operational reservation summary", () => {
    const normalized = normalizeOperaReservations({
      reservations: {
        reservationInfo: [{
          reservationIdList: [
            { type: "Reservation", id: "9988" },
            { type: "Confirmation", id: "ABC123" },
          ],
          reservationGuest: {
            givenName: "Sara",
            surname: "Guest",
            phoneNumber: "0500000000",
            email: "guest@example.com",
          },
          roomStay: {
            arrivalDate: "2026-07-01",
            departureDate: "2026-07-03",
            roomType: "DLX",
            roomNumber: "310",
            numberOfRooms: "1",
          },
          reservationStatus: "Reserved",
          hotelId: "RUH01",
          hotelName: "Riyadh",
          reservationPaymentMethod: {
            cardNumber: "4111111111111111",
          },
        }],
        totalResults: 1,
      },
    });

    expect(normalized.reservations[0]).toEqual({
      confirmationNumber: "ABC123",
      reservationId: "9988",
      guestName: "Sara Guest",
      status: "Reserved",
      arrivalDate: "2026-07-01",
      departureDate: "2026-07-03",
      hotelId: "RUH01",
      hotelName: "Riyadh",
      roomType: "DLX",
      roomNumber: "310",
      numberOfRooms: 1,
    });
    expect(JSON.stringify(normalized)).not.toContain("0500000000");
    expect(JSON.stringify(normalized)).not.toContain("4111111111111111");
  });

  it("enforces an authenticated admin session in the server function", () => {
    const source = readFileSync("netlify/functions/opera-search.ts", "utf8");
    expect(source).toContain("validateSession(req)");
    expect(source).toContain('role === "superadmin" || role === "admin"');
    expect(source).toContain('path: "/api/admin/opera-search"');
    expect(source).not.toContain("MD.ALDOSARI");
    expect(source).not.toMatch(/MAq\$/);
  });

  it("rejects an anonymous request before reading OPERA configuration", async () => {
    const response = await operaSearch(new Request("https://example.com/api/admin/opera-search"));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: "الجلسة غير صالحة." });
  });
});
