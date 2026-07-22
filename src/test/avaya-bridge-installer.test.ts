import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Avaya bridge installer", () => {
  it("runs the recurring PowerShell task without showing a console window", () => {
    const installer = readFileSync(resolve(process.cwd(), "scripts/install-avaya-bridge.ps1"), "utf8");

    expect(installer).toContain("-NonInteractive -WindowStyle Hidden");
    expect(installer).toContain("New-ScheduledTaskAction -Execute $powerShell -Argument $actionArguments");
  });
});
