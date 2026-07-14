import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../../netlify/functions/_shared/security";

describe("Netlify password storage", () => {
  it("stores a derived password hash rather than the original password", () => {
    const password = "A-strong-admin-password";
    const encoded = hashPassword(password);

    expect(encoded).not.toContain(password);
    expect(encoded).toMatch(/^pbkdf2_sha256\$310000\$/);
    expect(verifyPassword(password, encoded)).toBe(true);
    expect(verifyPassword("wrong-password", encoded)).toBe(false);
  });

  it("rejects malformed password records", () => {
    expect(verifyPassword("anything", "plain-text-value")).toBe(false);
  });
});
