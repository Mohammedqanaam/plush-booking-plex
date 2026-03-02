import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const roots = ["src", "netlify/functions"];
const exts = new Set([".ts", ".tsx", ".mts", ".js", ".jsx"]);

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (exts.has(path.extname(entry.name))) out.push(full);
  }

  return out;
}

describe("repository hygiene", () => {
  it("contains no unresolved git conflict markers", () => {
    const files = roots.flatMap((root) => walk(root));
    const offenders: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      if (
        content.includes("<<<" + "<<<< ") ||
        content.includes("===" + "====") ||
        content.includes(">>>" + ">>>> ")
      ) {
        offenders.push(file);
      }
    }

    expect(offenders).toEqual([]);
  });
});
