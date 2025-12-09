import logUpdate from "log-update";
import chalk from "chalk";
import figlet from "figlet";
type Fonts = string; // Simplified type alias
import * as termSize from "../utils/termSize";
import stripAnsi from "strip-ansi";

interface FontMetrics {
  blockWidth: number;
  sepWidth: number;
  height: number;
}

/**
 * Formats milliseconds into HH:MM:SS duration string.
 * @param ms - The duration in milliseconds.
 * @returns Formatted string "HH:MM:SS".
 */
function formatDuration(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Formats a Date object into HH:MM:SS time string.
 * @param date - The date object.
 * @returns Formatted string "HH:MM:SS".
 */
function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Generates an ASCII art analog clock.
 * Features a circular dial, hour/minute markers, and approximated hands.
 * Adjusts closely to a 2:1 aspect ratio for circular appearance in terminals.
 *
 * @param dateOrMs - Date object for clock, or remaining ms for timer.
 * @param isTimer - True if dateOrMs is a duration (timer mode).
 * @param useGlyphs - True to use Nerd Font glyphs, false for standard block chars.
 * @returns The multi-line ASCII string of the clock.
 */
function getAnalogClock(
  dateOrMs: Date | number,
  isTimer: boolean,
  useGlyphs: boolean,
): string {
  let hours: number, minutes: number, seconds: number;

  if (isTimer && typeof dateOrMs === "number") {
    const totalSeconds = Math.ceil(dateOrMs / 1000);
    seconds = totalSeconds % 60;
    minutes = Math.floor(totalSeconds / 60) % 60;
    hours = Math.floor(totalSeconds / 3600) % 12;
  } else if (!isTimer && dateOrMs instanceof Date) {
    hours = dateOrMs.getHours() % 12;
    minutes = dateOrMs.getMinutes();
    seconds = dateOrMs.getSeconds();
  } else {
    // Fallback/Error case
    hours = 0;
    minutes = 0;
    seconds = 0;
  }

  const radius = 21;
  const sizeY = 45;
  const sizeX = 90; // extra padding
  const centerY = Math.floor(sizeY / 2);
  const centerX = Math.floor(sizeX / 2);

  const board: string[][] = Array.from(
    { length: sizeY },
    () => Array(sizeX).fill(" ") as string[],
  );

  // Character sets for the clock face and hands.
  // Uses Nerd Font glyphs if enabled, otherwise falls back to standard block elements.
  const chars = useGlyphs
    ? {
        dialHour: "\uf111", //  (Circle)
        dialMinute: "\uf192", //  (Dot Circle) or \uf444
        dialOther: "·",
        handHour: "\u2588", // block
        handMinute: "\uf111", // 
        handSecond: "\uf192", // 
        center: "\uf017", //  (Clock)
      }
    : {
        dialHour: "●",
        dialMinute: "•",
        dialOther: "·",
        handHour: "█",
        handMinute: "●",
        handSecond: "·",
        center: "⊕",
      };

  // Draw Dial
  for (let r = 0; r < 360; r += 2) {
    const rad = r * (Math.PI / 180);
    const y = Math.round(centerY + Math.sin(rad) * radius);
    const x = Math.round(centerX + Math.cos(rad) * radius * 2);

    if (y >= 0 && y < sizeY && x >= 0 && x < sizeX) {
      if (r % 30 === 0) {
        board[y][x] = chalk.white.bold(chars.dialHour);
      } else if (r % 6 === 0) {
        board[y][x] = chalk.gray(chars.dialMinute);
      } else {
        board[y][x] = chalk.dim(chars.dialOther);
      }
    }
  }

  // Draw Numbers
  const numbers = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2];
  numbers.forEach((num, i) => {
    const rad = i * 30 * (Math.PI / 180);
    const numR = radius - 2;
    const y = Math.round(centerY + Math.sin(rad) * numR);
    const x = Math.round(centerX + Math.cos(rad) * numR * 2);
    if (y >= 0 && y < sizeY && x >= 0 && x < sizeX) {
      if (num > 9) {
        if (x > 0) board[y][x - 1] = Math.floor(num / 10).toString();
        board[y][x] = (num % 10).toString();
      } else {
        board[y][x] = num.toString();
      }
    }
  });

  const drawHand = (
    value: number,
    total: number,
    lengthRatio: number,
    char: string,
    colorFunc: (s: string) => string,
  ) => {
    const angle = (value / total) * 2 * Math.PI - Math.PI / 2;
    const handLength = radius * lengthRatio;

    for (let r = 0; r <= handLength; r += 0.5) {
      const y = Math.round(centerY + Math.sin(angle) * r);
      const x = Math.round(centerX + Math.cos(angle) * r * 2);

      if (y >= 0 && y < sizeY && x >= 0 && x < sizeX) {
        board[y][x] = colorFunc(char);
      }
    }
  };

  // Hands with different lengths and characters
  // Order: Seconds (Bottom) -> Minutes -> Hours (Top)
  drawHand(seconds, 60, 0.9, chars.handSecond, chalk.blue); // Second
  drawHand(minutes, 60, 0.75, chars.handMinute, chalk.green.bold); // Minute
  drawHand(hours + minutes / 60, 12, 0.5, chars.handHour, chalk.red.bold); // Hour

  board[centerY][centerX] = chalk.white(chars.center);

  return board.map((row) => row.join("")).join("\n");
}

const fontMetricsCache: Record<string, FontMetrics> = {};

/**
 * Computes the maximum width and height for a specific font's digit characters.
 * Useful for determining if the terminal is large enough to display the digital clock.
 * Cached to avoid re-calculation.
 *
 * @param font - The Figlet font name.
 * @returns An object containing block width, separator width, and height.
 */
function getFontMetrics(font: Fonts): FontMetrics {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (fontMetricsCache[font]) {
    return fontMetricsCache[font];
  }

  let maxBlockWidth = 0;
  let height = 0;

  // Measure all digits 0-59 (covering minutes/seconds range).
  // This ensures we calculate the maximum width for any two-digit time component.
  for (let i = 0; i <= 59; i++) {
    const numStr = i.toString().padStart(2, "0");
    const art = figlet.textSync(numStr, { font: font });
    const lines = art.split("\n");
    height = Math.max(height, lines.length);
    const width = Math.max(...lines.map((l) => l.length));
    maxBlockWidth = Math.max(maxBlockWidth, width);
  }

  const sepArt = figlet.textSync(":", { font: font });
  const sepLines = sepArt.split("\n");
  const sepWidth = Math.max(...sepLines.map((l) => l.length));
  height = Math.max(height, sepLines.length);

  const metrics = {
    blockWidth: maxBlockWidth,
    sepWidth: sepWidth,
    height: height,
  };

  fontMetricsCache[font] = metrics;
  return metrics;
}

const digitCache: Record<string, Record<string, string[]>> = {};

/**
 * Generates an ASCII art digital clock "HH:MM:SS".
 * Uses caching to optimize performance, as `figlet.textSync` is expensive.
 * We render and cache distinct parts (HH, MM, SS, separators) and assemble them.
 *
 * @param text - The time string "HH:MM:SS".
 * @param font - The Figlet font to use.
 * @returns The multi-line ASCII string.
 */
function getDigitalClock(text: string, font: Fonts = "Standard"): string {
  // text is "HH:MM:SS"
  const metrics = getFontMetrics(font);
  // We need to render segments.
  // To preserve exact original behavior (kerning within "12"), we cache the components: HH, MM, SS.
  // There are only 60 possible values for MM and SS. And 24 for HH.
  // Total 60 unique two-digit strings.
  // Caching "00" to "59" is very cheap and efficient.

  const getCachedBlock = (str: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!digitCache[font]) digitCache[font] = {};
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!digitCache[font][str]) {
      digitCache[font][str] = figlet.textSync(str, { font }).split("\n");
    }
    return digitCache[font][str];
  };

  const parts = text.split(":");
  const hLines = getCachedBlock(parts[0]);
  const mLines = getCachedBlock(parts[1]);
  const sLines = getCachedBlock(parts[2]);
  const sepLines = getCachedBlock(":");

  // Helper to center or pad lines to a target width so everything aligns
  const padBlockLines = (lines: string[], targetWidth: number) => {
    return Array.from({ length: metrics.height }, (_, i) => {
      const line = lines[i] || "";
      const padding = Math.max(0, targetWidth - line.length);
      const leftPad = Math.floor(padding / 2);
      return (
        " ".repeat(leftPad) + line + " ".repeat(Math.max(0, padding - leftPad))
      );
    });
  };

  const hBlock = padBlockLines(hLines, metrics.blockWidth);
  const mBlock = padBlockLines(mLines, metrics.blockWidth);
  const sBlock = padBlockLines(sLines, metrics.blockWidth);
  const sepBlock = padBlockLines(sepLines, metrics.sepWidth);

  // Join columns together line by line
  return hBlock
    .map((line, i) => line + sepBlock[i] + mBlock[i] + sepBlock[i] + sBlock[i])
    .join("\n");
}

/**
 * Main render entry point.
 * Clears the screen (via log-update) and renders the current state.
 * Handles fallback to text mode if the terminal is too small for the requested style.
 *
 * @param data - Current Date (clock) or remaining milliseconds (timer).
 * @param style - "digital", "analog", or "text".
 * @param label - Optional label text.
 * @param font - Font name for digital style.
 * @param isPaused - Whether the timer is paused (visual indication).
 * @param useGlyphs - Whether to use Nerd Font glyphs for analog clock.
 */
export function render(
  data: Date | number,
  style: string,
  label: string | null,
  font: Fonts = "Standard",
  isPaused = false,
  useGlyphs = false,
): void {
  const size = termSize.getSize();
  let text = "";
  const isTimer = typeof data === "number";

  if (isTimer) {
    text = formatDuration(data);
  } else {
    text = formatTime(data);
  }

  let content = "";
  if (label) {
    content += chalk.cyan(label) + "\n";
  }

  if (isPaused) {
    content += chalk.bgRed.white.bold(" PAUSED ") + "\n";
  }

  let effectiveStyle = style;
  if (style === "digital") {
    const metrics = getFontMetrics(font);
    const requiredWidth = metrics.blockWidth * 3 + metrics.sepWidth * 2;
    const requiredHeight = metrics.height;

    if (size.columns < requiredWidth || size.rows < requiredHeight + 2) {
      content += chalk.yellow(
        `Terminal too small for digital clock with font '${font}' (needs ${requiredWidth.toString()}x${requiredHeight.toString()}), switching to text.\n`,
      );
      effectiveStyle = "text";
    }
  } else if (style === "analog") {
    if (size.columns < 90 || size.rows < 45) {
      content += chalk.yellow(
        "Terminal too small for large analog clock (needs 90x45), switching to text.\n",
      );
      effectiveStyle = "text";
    }
  }

  if (effectiveStyle === "digital") {
    const art = getDigitalClock(text, font);
    content += chalk.green(art);
    content += chalk.dim(`\nFont: ${font}`);
  } else if (effectiveStyle === "analog") {
    const art = getAnalogClock(data, isTimer, useGlyphs);
    content += art + "\n" + chalk.bold(text);
  } else {
    content += chalk.bold.bgBlack.white(`  ${text}  `);
  }

  const lines = content.split("\n");
  const contentHeight = lines.length;
  const lineWidths = lines.map((l) => stripAnsi(l).length);
  const maxContentWidth = Math.max(...lineWidths);

  let footerText = "q: Quit | d: Digital | a: Analog | t: Text";
  if (style === "digital") {
    footerText += " | f: Cycle Font";
  } else if (style === "analog") {
    footerText += ` | g: Glyphs (${useGlyphs ? "ON" : "OFF"})`;
  }
  if (isTimer) {
    footerText += " | r: Reset | space: Start/Pause";
  }
  const footerHeight = 1;

  const topPad = Math.floor((size.rows - footerHeight - contentHeight) / 2);
  const blockLeftPad = Math.floor((size.columns - maxContentWidth) / 2);

  let output = "";

  for (let i = 0; i < Math.max(0, topPad); i++) output += "\n";

  lines.forEach((line, index) => {
    const lineLen = lineWidths[index];
    const relativePad = Math.floor((maxContentWidth - lineLen) / 2);
    const totalPad = Math.max(0, blockLeftPad + relativePad);
    output += " ".repeat(totalPad) + line + "\n";
  });

  const usedLines = Math.max(0, topPad) + lines.length;
  const bottomPad = size.rows - footerHeight - usedLines;

  for (let i = 0; i < Math.max(0, bottomPad); i++) output += "\n";

  const footerPad = Math.floor(
    (size.columns - stripAnsi(footerText).length) / 2,
  );
  output += " ".repeat(Math.max(0, footerPad)) + chalk.dim(footerText);

  logUpdate(output);
}
