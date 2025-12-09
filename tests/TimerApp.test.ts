import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TimerApp } from "../src/TimerApp";
import * as renderers from "../src/renderers";
import * as config from "../src/utils/config";

// Mock dependencies
vi.mock("../src/renderers");
vi.mock("../src/utils/config");
vi.mock("log-update", () => ({ default: { done: vi.fn() } }));
vi.mock("node-notifier", () => ({ default: { notify: vi.fn() } }));
vi.mock("ansi-escapes", () => ({
  default: {
    cursorHide: "",
    cursorShow: "",
    enterAlternateScreen: "",
    leaveAlternateScreen: "",
  },
}));

describe("TimerApp", () => {
  let app: TimerApp;
  const defaultOptions = {
    style: "digital",
    fontIndex: 0,
    useGlyphs: false,
    fonts: ["Standard", "Ghost"],
    label: "Test Timer",
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    app = new TimerApp(defaultOptions);
    // Mock process.stdout.write to avoid cluttering test output
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process, "exit").mockImplementation(() => {
      return undefined as never;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should initialize with provided options", () => {
    expect(app).toBeDefined();
  });

  it("should start clock mode", () => {
    app.startClock();
    vi.advanceTimersByTime(150);
    expect(renderers.render).toHaveBeenCalled();
  });

  it("should start timer mode and countdown", () => {
    app.startTimer(1000);
    vi.advanceTimersByTime(150);
    expect(renderers.render).toHaveBeenCalledTimes(1);
    // Should pass remaining time (approx 850ms left after 150ms tick? No, 100ms interval)
    // The exact remaining time depends on Date.now(), which is mocked by fake timers usually
    // but here we are just checking it calls render.
  });

  it("should finish timer when time expires", () => {
    app.startTimer(100);
    vi.advanceTimersByTime(200); // Wait enough for it to finish
    expect(renderers.render).toHaveBeenCalledWith(
      0,
      expect.any(String),
      expect.any(String),
      expect.any(String),
      false,
      false,
    );
    // It might be called multiple times, last one is "0"
  });

  it("should toggle pause", () => {
    app.startTimer(5000);
    vi.advanceTimersByTime(100);

    // Pause
    app.togglePause();
    vi.clearAllMocks(); // clear render calls
    vi.advanceTimersByTime(1000); // Wait, should not tick
    expect(renderers.render).not.toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(String),
      expect.any(String),
      expect.any(String),
      false,
      false,
    );
    // But it SHOULD have called render ONCE for the pause state

    // Resume
    app.togglePause();
    vi.advanceTimersByTime(100);
    expect(renderers.render).toHaveBeenCalled();
  });

  it("should reset timer", () => {
    app.startTimer(5000);
    vi.advanceTimersByTime(1000);
    app.resetTimer(5000);
    // Logic resets start time. Hard to verify without inspecting private state,
    // but we can verify it doesn't crash and keeps running.
    vi.advanceTimersByTime(100);
    expect(renderers.render).toHaveBeenCalled();
  });

  it("should set style and save config", () => {
    app.setStyle("analog");
    expect(config.saveConfig).toHaveBeenCalledWith(
      expect.objectContaining({ style: "analog" }),
    );
  });

  it("should fail to set same style", () => {
    app.setStyle("digital");
    expect(config.saveConfig).not.toHaveBeenCalled();
  });

  it("should cycle font only in digital mode", () => {
    app.setStyle("digital");
    app.cycleFont(); // Index 0 -> 1
    expect(config.saveConfig).toHaveBeenCalledWith(
      expect.objectContaining({ fontIndex: 1 }),
    );

    app.setStyle("analog");
    vi.clearAllMocks();
    app.cycleFont();
    expect(config.saveConfig).not.toHaveBeenCalled();
  });

  it("should toggle glyphs only in analog mode", () => {
    app.setStyle("analog");
    app.toggleGlyphs();
    expect(config.saveConfig).toHaveBeenCalledWith(
      expect.objectContaining({ useGlyphs: true }),
    );

    app.setStyle("digital");
    vi.clearAllMocks();
    app.toggleGlyphs();
    expect(config.saveConfig).not.toHaveBeenCalled();
  });

  it("should quit app", () => {
    app.quit();
    expect(process.exit).toHaveBeenCalledWith(0);
  });
});
