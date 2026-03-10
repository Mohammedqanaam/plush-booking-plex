import { describe, expect, it } from "vitest";
import { themePresets, quickIntents, knowledgeEntries } from "@/data/operations";

describe("operations data module", () => {
  it("exports themePresets as a non-empty array", () => {
    expect(Array.isArray(themePresets)).toBe(true);
    expect(themePresets.length).toBeGreaterThan(0);
  });

  it("each themePreset has required fields", () => {
    for (const preset of themePresets) {
      expect(typeof preset.id).toBe("string");
      expect(preset.id.length).toBeGreaterThan(0);
      expect(typeof preset.name).toBe("string");
      expect(typeof preset.description).toBe("string");
    }
  });

  it("themePreset ids are unique", () => {
    const ids = themePresets.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("exports quickIntents as a non-empty array of strings", () => {
    expect(Array.isArray(quickIntents)).toBe(true);
    expect(quickIntents.length).toBeGreaterThan(0);
    for (const intent of quickIntents) {
      expect(typeof intent).toBe("string");
    }
  });

  it("exports knowledgeEntries as a non-empty array", () => {
    expect(Array.isArray(knowledgeEntries)).toBe(true);
    expect(knowledgeEntries.length).toBeGreaterThan(0);
  });

  it("each knowledgeEntry has required fields", () => {
    for (const entry of knowledgeEntries) {
      expect(["string", "number"]).toContain(typeof entry.id);
      expect(typeof entry.group).toBe("string");
      expect(typeof entry.title).toBe("string");
      expect(Array.isArray(entry.tags)).toBe(true);
      expect(typeof entry.body).toBe("string");
    }
  });

  it("knowledgeEntry ids are unique", () => {
    const ids = knowledgeEntries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("themePreset ids match the enterprise theme map keys", () => {
    const knownThemeIds = new Set([
      "executive-dark-glass",
      "luxury-lavender",
      "hospitality-premium-gold",
      "signature-cosmic",
      "signature-obsidian",
    ]);
    for (const preset of themePresets) {
      expect(knownThemeIds.has(preset.id)).toBe(true);
    }
  });
});
