import { describe, it, expect, vi, afterEach, Mock } from "vitest";
import { checkGlyphSupport } from "../src/utils/onboarding";
import readline from "node:readline";

// Explicit mock factory for node:readline
vi.mock("node:readline", () => {
  const fn = vi.fn();
  return {
    default: { createInterface: fn },
    createInterface: fn,
  };
});

vi.mock("ansi-escapes", () => ({
  default: {
    cursorHide: "",
    cursorShow: "",
  },
}));

describe("checkGlyphSupport", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return true when user inputs 'y'", async () => {
    const mockInterface = {
      question: vi.fn((_q: string, cb: (answer: string) => void) => cb("y")),
      close: vi.fn(),
    };
    (readline.createInterface as unknown as Mock).mockReturnValue(
      mockInterface,
    );

    const result = await checkGlyphSupport();
    expect(result).toBe(true);
    expect(mockInterface.question).toHaveBeenCalled();
    expect(mockInterface.close).toHaveBeenCalled();
  });

  it("should return true when user inputs 'yes'", async () => {
    const mockInterface = {
      question: vi.fn((_q: string, cb: (answer: string) => void) => cb("yes")),
      close: vi.fn(),
    };
    (readline.createInterface as unknown as Mock).mockReturnValue(
      mockInterface,
    );

    const result = await checkGlyphSupport();
    expect(result).toBe(true);
  });

  it("should return false when user inputs 'n'", async () => {
    const mockInterface = {
      question: vi.fn((_q: string, cb: (answer: string) => void) => cb("n")),
      close: vi.fn(),
    };
    (readline.createInterface as unknown as Mock).mockReturnValue(
      mockInterface,
    );

    const result = await checkGlyphSupport();
    expect(result).toBe(false);
  });

  it("should return false when user inputs garbage", async () => {
    const mockInterface = {
      question: vi.fn((_q: string, cb: (answer: string) => void) => cb("foo")),
      close: vi.fn(),
    };
    (readline.createInterface as unknown as Mock).mockReturnValue(
      mockInterface,
    );

    const result = await checkGlyphSupport();
    expect(result).toBe(false);
  });
});
