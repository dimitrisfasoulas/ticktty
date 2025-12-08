import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import path from "path";
import fs from "fs";
import os from "os";

describe("Config Utility (Integration)", () => {
  const originalHome = process.env.HOME;
  const tempHome = path.join(os.tmpdir(), "ticktty-test-" + Date.now());
  const configDir = path.join(tempHome, ".config/ticktty");
  const configPath = path.join(configDir, "default.json");

  let loadConfig;
  let saveConfig;

  // Cleanup helper
  const rmDir = (dir) => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };

  beforeEach(async () => {
    vi.resetModules();

    // Set HOME to temp dir before importing config
    process.env.HOME = tempHome;

    // Ensure clean state
    rmDir(tempHome);

    // Import module
    const mod = await import("../src/utils/config");
    loadConfig = mod.loadConfig;
    saveConfig = mod.saveConfig;
  });

  afterEach(() => {
    // Restore HOME and cleanup
    process.env.HOME = originalHome;
    rmDir(tempHome);
  });

  it("should return default config if file does not exist", () => {
    const config = loadConfig();
    expect(config).toEqual({ style: "digital", fontIndex: 0 });
  });

  it("should return parsed config if file exists", () => {
    // Setup real file
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(
      configPath,
      JSON.stringify({ style: "analog", fontIndex: 1 })
    );

    const config = loadConfig();
    expect(config).toEqual({ style: "analog", fontIndex: 1 });
  });

  it("should return default config if parsing fails", () => {
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, "invalid json");

    const config = loadConfig();
    expect(config).toEqual({ style: "digital", fontIndex: 0 });
  });

  it("should save config to disk", () => {
    saveConfig({ style: "text", fontIndex: 2 });

    expect(fs.existsSync(configPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(content).toEqual({ style: "text", fontIndex: 2 });
  });
});
