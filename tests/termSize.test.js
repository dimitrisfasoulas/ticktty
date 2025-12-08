import { describe, it, expect, vi, afterEach } from "vitest";
import { getSize } from "../src/utils/termSize";

describe("termSize Utility", () => {
  const originalStdout = process.stdout;

  afterEach(() => {
    Object.defineProperty(process, "stdout", {
      value: originalStdout,
      writable: true,
    });
  });

  it("should return process.stdout dimensions", () => {
    // Mock stdout
    const mockStdout = {
      rows: 40,
      columns: 100,
    };
    Object.defineProperty(process, "stdout", {
      value: mockStdout,
      writable: true,
    });

    const size = getSize();
    expect(size).toEqual({ rows: 40, columns: 100 });
  });

  it("should provide defaults if stdout dimensions are undefined", () => {
    const mockStdout = {}; // No rows/cols
    Object.defineProperty(process, "stdout", {
      value: mockStdout,
      writable: true,
    });

    const size = getSize();
    expect(size).toEqual({ rows: 24, columns: 80 });
  });
});
