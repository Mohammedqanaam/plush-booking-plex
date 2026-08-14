import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Avaya bridge installer", () => {
  it("runs the recurring PowerShell task without showing a console window", () => {
    const installer = readFileSync(resolve(process.cwd(), "scripts/install-avaya-bridge.ps1"), "utf8");

    expect(installer).toContain("-NonInteractive -WindowStyle Hidden");
    expect(installer).toContain("New-ScheduledTaskAction -Execute $powerShell -Argument $actionArguments");
  });

  it("captures only a visible Avaya application window from an interactive session", () => {
    const capture = readFileSync(resolve(process.cwd(), "scripts/capture-avaya-realtime.ps1"), "utf8");

    expect(capture).toContain("[Environment]::UserInteractive");
    expect(capture).toContain("GetWindowRect");
    expect(capture).toContain('MainWindowTitle -like "*$WindowTitle*"');
    expect(capture).toContain("CopyFromScreen");
    expect(capture).toContain("[Drawing.Imaging.ImageFormat]::Png");
  });
});
