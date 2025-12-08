const logUpdate = require("log-update");
const chalk = require("chalk");
const figlet = require("figlet");
const termSize = require("../utils/termSize");
const stripAnsi = require("strip-ansi");
const ansiEscapes = require("ansi-escapes");

/**
 * Formats milliseconds into HH:MM:SS duration string.
 * @param {number} ms - The duration in milliseconds.
 * @returns {string} Formatted string "HH:MM:SS".
 */
function formatDuration(ms) {
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
 * @param {Date} date - The date object.
 * @returns {string} Formatted string "HH:MM:SS".
 */
function formatTime(date) {
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
 * @param {Date|number} dateOrMs - Date object for clock, or remaining ms for timer.
 * @param {boolean} isTimer - True if dateOrMs is a duration (timer mode).
 * @returns {string} The multi-line ASCII string of the clock.
 */
function getAnalogClock(dateOrMs, isTimer) {
  let hours, minutes, seconds;

  if (isTimer) {
    const totalSeconds = Math.ceil(dateOrMs / 1000);
    seconds = totalSeconds % 60;
    minutes = Math.floor(totalSeconds / 60) % 60;
    hours = Math.floor(totalSeconds / 3600) % 12;
  } else {
    hours = dateOrMs.getHours() % 12;
    minutes = dateOrMs.getMinutes();
    seconds = dateOrMs.getSeconds();
  }

  // Requested size logic: fit in 45x150
  // Height 45 -> Radius ~ 21
  // Width should be Radius * 2 (aspect correction) -> 42 * 2 = 84 cols. Fits 150.

  const radius = 21;
  const sizeY = 45;
  const sizeX = 90; // extra padding
  const centerY = Math.floor(sizeY / 2);
  const centerX = Math.floor(sizeX / 2);

  let board = Array(sizeY)
    .fill(null)
    .map(() => Array(sizeX).fill(" "));

  // Draw Dial
  for (let r = 0; r < 360; r += 2) {
    // Dense dots
    const rad = r * (Math.PI / 180);
    const y = Math.round(centerY + Math.sin(rad) * radius);
    const x = Math.round(centerX + Math.cos(rad) * radius * 2); // 2:1 aspect ratio

    if (y >= 0 && y < sizeY && x >= 0 && x < sizeX) {
      // Markers
      if (r % 30 === 0) {
        board[y][x] = chalk.white.bold("O"); // Hour marker
      } else if (r % 6 === 0) {
        board[y][x] = chalk.gray("*"); // Minute marker
      } else {
        board[y][x] = chalk.dim(".");
      }
    }
  }

  // Draw Numbers (rough approximation)
  const numbers = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2];
  numbers.forEach((num, i) => {
    const rad = i * 30 * (Math.PI / 180); // 0 deg is 3 o'clock in trig
    // Position slightly inside rim
    const numR = radius - 2;
    const y = Math.round(centerY + Math.sin(rad) * numR);
    const x = Math.round(centerX + Math.cos(rad) * numR * 2);
    if (y >= 0 && y < sizeY && x >= 0 && x < sizeX) {
      // For double digit numbers, we might need to shift x slightly left?
      // Simplification: just plot center char or simple logic
      if (num > 9) {
        if (x > 0) board[y][x - 1] = Math.floor(num / 10).toString();
        board[y][x] = (num % 10).toString();
      } else {
        board[y][x] = num.toString();
      }
    }
  });

  const drawHand = (
    value,
    total,
    lengthRatio,
    char,
    colorFunc,
    thickness = 0
  ) => {
    const angle = (value / total) * 2 * Math.PI - Math.PI / 2;
    const handLength = radius * lengthRatio;

    // Draw line from center
    // Using high density steps
    for (let r = 0; r <= handLength; r += 0.5) {
      const y = Math.round(centerY + Math.sin(angle) * r);
      const x = Math.round(centerX + Math.cos(angle) * r * 2);

      if (y >= 0 && y < sizeY && x >= 0 && x < sizeX) {
        board[y][x] = colorFunc(char);

        // Thickness?
        // Just simpler to stick to single line for ASCII resolution unless requested
      }
    }
  };

  // Hands with different lengths and characters
  drawHand(hours + minutes / 60, 12, 0.5, "█", chalk.red.bold); // Hour
  drawHand(minutes, 60, 0.75, "●", chalk.green.bold); // Minute
  drawHand(seconds, 60, 0.9, ".", chalk.blue); // Second

  board[centerY][centerX] = chalk.white("⊕");

  return board.map((row) => row.join("")).join("\n");
}

/**
 * Placeholder for centerText function.
 * @deprecated Use manual block centering logic in render() instead.
 */
function centerText(text, size) {
  // Basic centering
  return text;
}

// Cache to store calculated font metrics
const fontMetricsCache = {};

/**
 * Calculates metrics (digit width, height) for a given font.
 * Caches results to avoid re-calculating on every render.
 * @param {string} font - The figlet font name.
 * @returns {object} { digitWidth, sepWidth, height }
 */
function getFontMetrics(font) {
  if (fontMetricsCache[font]) {
    return fontMetricsCache[font];
  }

  // Render all possible two-digit numbers (00-59) to find max width for HH, MM, SS blocks
  let maxBlockWidth = 0;
  let height = 0;

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
  height = Math.max(height, sepLines.length); // Ensure height accounts for separator too

  const metrics = {
    blockWidth: maxBlockWidth, // Renamed from digitWidth to blockWidth for clarity
    sepWidth: sepWidth,
    height: height,
  };

  fontMetricsCache[font] = metrics;
  return metrics;
}

/**
 * Generates monospaced digital clock using composite block rendering.
 * @param {string} text - The time string (HH:MM:SS)
 * @param {string} font - The figlet font to use
 */
function getDigitalClock(text, font = "Standard") {
  const parts = text.split(":"); // [HH, MM, SS]
  const metrics = getFontMetrics(font);

  // Helper to pad ASCII art block
  const padBlock = (art, targetWidth, targetHeight) => {
    const lines = art.split("\n");
    // Pad vertically if needed (though figlet usually consistent)
    while (lines.length < targetHeight) {
      lines.push("");
    }

    return lines.map((line) => {
      const padding = Math.max(0, targetWidth - line.length);
      const leftPad = Math.floor(padding / 2);
      return (
        " ".repeat(leftPad) + line + " ".repeat(Math.max(0, padding - leftPad))
      );
    });
  };

  // Render each component
  const hBlock = padBlock(
    figlet.textSync(parts[0], { font: font }),
    metrics.blockWidth,
    metrics.height
  );
  const mBlock = padBlock(
    figlet.textSync(parts[1], { font: font }),
    metrics.blockWidth,
    metrics.height
  );
  const sBlock = padBlock(
    figlet.textSync(parts[2], { font: font }),
    metrics.blockWidth,
    metrics.height
  );
  const sepBlock = padBlock(
    figlet.textSync(":", { font: font }),
    metrics.sepWidth,
    metrics.height
  );

  let combined = [];
  for (let i = 0; i < metrics.height; i++) {
    combined.push(
      (hBlock[i] || "") +
        (sepBlock[i] || "") +
        (mBlock[i] || "") +
        (sepBlock[i] || "") +
        (sBlock[i] || "")
    );
  }

  return combined.join("\n");
}

function render(data, style, label, font = "Standard") {
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

  let effectiveStyle = style;
  // ... existing style checks ...
  if (style === "digital") {
    const metrics = getFontMetrics(font);
    // Estimate total width: 3 blocks + 2 separators + padding approx
    // 3 * blockWidth + 2 * sepWidth
    // This is a more robust calculation for the required width.
    const requiredWidth = metrics.blockWidth * 3 + metrics.sepWidth * 2;
    const requiredHeight = metrics.height;

    if (size.columns < requiredWidth || size.rows < requiredHeight + 2) {
      // +2 for font info and footer
      content += chalk.yellow(
        `Terminal too small for digital clock with font '${font}' (needs ${requiredWidth}x${requiredHeight}), switching to text.\n`
      );
      effectiveStyle = "text";
    }
  } else if (style === "analog") {
    // Increased requirements for large clock
    if (size.columns < 90 || size.rows < 45) {
      // Adjusted for our large clock
      content += chalk.yellow(
        "Terminal too small for large analog clock (needs 90x45), switching to text.\n"
      );
      effectiveStyle = "text";
    }
  }

  if (effectiveStyle === "digital") {
    // Use monospaced composition for stability
    const art = getDigitalClock(text, font);
    content += chalk.green(art);
    // Show current font in UI
    content += chalk.dim(`\nFont: ${font}`);
  } else if (effectiveStyle === "analog") {
    const art = getAnalogClock(data, isTimer);
    content += art + "\n" + chalk.bold(text);
  } else {
    content += chalk.bold.bgBlack.white(`  ${text}  `);
  }

  // Manual layout for centering content BLOCK + sticky footer
  // Block centering ensures that if one line changes length slightly (but stays smaller than max),
  // the whole block doesn't shift relative to the screen.

  const lines = content.split("\n");
  const contentHeight = lines.length;

  // Calculate global block width
  const lineWidths = lines.map((l) => stripAnsi(l).length);
  const maxContentWidth = Math.max(...lineWidths);

  let footerText = "q: Quit | d: Digital | a: Analog | t: Text";
  if (style === "digital") {
    footerText += " | f: Cycle Font";
  }
  const footerHeight = 1;

  // Vertical Center
  const topPad = Math.floor((size.rows - footerHeight - contentHeight) / 2);

  // Global Horizontal Center for the BLOCK
  const blockLeftPad = Math.floor((size.columns - maxContentWidth) / 2);

  let output = "";

  // Top Pad
  for (let i = 0; i < Math.max(0, topPad); i++) output += "\n";

  // Content (Centered within Block, Block Centered on Screen)
  lines.forEach((line, index) => {
    const lineLen = lineWidths[index];
    // Center line within the block width
    const relativePad = Math.floor((maxContentWidth - lineLen) / 2);
    const totalPad = Math.max(0, blockLeftPad + relativePad);
    output += " ".repeat(totalPad) + line + "\n";
  });

  // Bottom Pad
  const usedLines = topPad + lines.length;
  const bottomPad = size.rows - footerHeight - usedLines;

  for (let i = 0; i < Math.max(0, bottomPad); i++) output += "\n";

  // Footer centered
  const footerPad = Math.floor(
    (size.columns - stripAnsi(footerText).length) / 2
  );
  output += " ".repeat(Math.max(0, footerPad)) + chalk.dim(footerText);

  logUpdate(output);
}

module.exports = { render };
