import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { parse } from "@iarna/toml";

describe("netlify config", () => {
  it("parses netlify.toml without syntax errors", () => {
    const content = fs.readFileSync("netlify.toml", "utf8");
    const parsed = parse(content);
    expect(parsed).toBeTypeOf("object");
    expect((parsed as Record<string, unknown>).build).toBeTruthy();
  });
});
