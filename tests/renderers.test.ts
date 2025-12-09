import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from "vitest";
import { render } from "../src/renderers/index";

describe("Renderers (Integration)", () => {
  let stdoutSpy: MockInstance;

  beforeEach(() => {
    stdoutSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it("should render digital clock (integration)", () => {
    const date = new Date(2023, 0, 1, 10, 0, 0); // 10:00:00

    render(date, "digital", null);

    expect(stdoutSpy).toHaveBeenCalled();
    const calls = stdoutSpy.mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join("");
    // Digital clock outputs ASCII art, so we can't search for "10:00:00" easily.
    // We can check for the footer which is always present in digital mode
    expect(calls).toContain("Font: Standard");
    // And ensure it's not empty
    expect(calls.length).toBeGreaterThan(50);
  });

  it("should render analog clock (integration)", () => {
    // Mock large terminal
    const originalRows = process.stdout.rows;
    const originalCols = process.stdout.columns;
    process.stdout.rows = 50;
    process.stdout.columns = 100;

    const date = new Date(2023, 0, 1, 10, 0, 0); // 10:00:00

    try {
      render(date, "analog", null);

      expect(stdoutSpy).toHaveBeenCalled();
      const calls = stdoutSpy.mock.calls
        .map((c: unknown[]) => String(c[0]))
        .join("");
      // Check for analog clock specific characters
      // We check for the center point and face markers which are reliable
      expect(calls).toContain("⊕");
      expect(calls).toContain("12");
    } finally {
      process.stdout.rows = originalRows;
      process.stdout.columns = originalCols;
    }
  });

  it("should render analog timer (integration)", () => {
    // Mock large terminal
    const originalRows = process.stdout.rows;
    const originalCols = process.stdout.columns;
    process.stdout.rows = 50;
    process.stdout.columns = 100;

    const ms = 65000;
    try {
      render(ms, "analog", "My Timer");
      expect(stdoutSpy).toHaveBeenCalled();
      const calls = stdoutSpy.mock.calls.map((c) => c[0]).join("");
      expect(calls).toContain("●");
    } finally {
      process.stdout.rows = originalRows;
      process.stdout.columns = originalCols;
    }
  });

  it("should render text style (integration)", () => {
    const date = new Date(2023, 0, 1, 10, 30, 0); // 10:30:00

    render(date, "text", null);

    expect(stdoutSpy).toHaveBeenCalled();
    const calls = stdoutSpy.mock.calls.map((c) => c[0]).join("");
    // Text style outputs literal text
    expect(calls).toContain("10:30:00");
  });

  it("should render timer duration in text style", () => {
    const ms = 65000; // 1m 5s
    render(ms, "text", "My Timer");

    expect(stdoutSpy).toHaveBeenCalled();
    const calls = stdoutSpy.mock.calls.map((c) => c[0]).join("");
    expect(calls).toContain("00:01:05");
    expect(calls).toContain("My Timer");
  });
  it("should render paused state", () => {
    const ms = 65000;
    render(ms, "text", "My Timer", "Standard", true);

    expect(stdoutSpy).toHaveBeenCalled();
    const calls = stdoutSpy.mock.calls.map((c) => c[0]).join("");
    expect(calls).toContain("PAUSED");
  });
});
