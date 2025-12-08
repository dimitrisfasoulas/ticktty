#!/usr/bin/env node

/**
 * Terminal Timer (ttimer)
 * A CLI-based clock and countdown timer with multiple display styles.
 *
 * Features:
 * - Clock mode (default)
 * - Timer mode (countdown)
 * - Styles: Digital (figlet), Analog (ASCII), Text
 * - Fullscreen, centered layout
 * - Interactive controls (styles, quit)
 */

const { Command } = require("commander");
const program = new Command();
const render = require("./renderers");
const termSize = require("./utils/termSize");
const logUpdate = require("log-update");
const parseDuration =
  require("parse-duration").default || require("parse-duration");
const readline = require("readline");
const notifier = require("node-notifier");
const { loadConfig, saveConfig } = require("./utils/config");

const ansiEscapes = require("ansi-escapes");
// Polyfill for missing codes in ansi-escapes v4
ansiEscapes.enterAlternateScreen = "\u001B[?1049h";
ansiEscapes.leaveAlternateScreen = "\u001B[?1049l";

let currentStyle = "digital";
const FONTS = [
  "Standard",
  "Ghost",
  "Slant",
  "Small",
  "Big",
  "Banner",
  "Larry 3D",
];
let currentFontIndex = 0;

/**
 * Starts the countdown timer.
 * Handles interval updates, style switching, and cleanup on completion.
 *
 * @param {number} durationMs - Duration in milliseconds.
 * @param {object} options - Command options.
 */
function startTimer(durationMs, options) {
  const endTime = Date.now() + durationMs;
  const label = options.label ? options.label : "Timer";

  process.stdout.write(ansiEscapes.cursorHide);
  process.stdout.write(ansiEscapes.enterAlternateScreen);

  const interval = setInterval(() => {
    const remaining = endTime - Date.now();

    // Check if style changed interactively
    const style = currentStyle; // Use global state updated by keypress
    const font = FONTS[currentFontIndex];

    if (remaining <= 0) {
      clearInterval(interval);
      render.render(0, style, label, font);
      logUpdate.done();
      process.stdout.write(ansiEscapes.cursorShow); // Show cursor
      process.stdout.write(ansiEscapes.leaveAlternateScreen); // Leave alt screen
      notifier.notify({
        title: "Terminal Timer",
        message: `${label} finished!`,
        sound: true,
      });
      process.exit(0);
    } else {
      render.render(remaining, style, label, font);
    }
  }, 100);
}

/**
 * Starts the continuous clock display.
 *
 * @param {object} options - Command options.
 */
function startClock(options) {
  process.stdout.write(ansiEscapes.cursorHide);
  process.stdout.write(ansiEscapes.enterAlternateScreen);

  setInterval(() => {
    // Check if style changed interactively
    const style = currentStyle;
    const font = FONTS[currentFontIndex];
    render.render(new Date(), style, null, font);
  }, 100);
}

// Handle SIGINT for graceful exit
process.on("SIGINT", () => {
  process.stdout.write(ansiEscapes.cursorShow);
  process.stdout.write(ansiEscapes.leaveAlternateScreen);
  process.exit();
});

program
  .name("ticktty")
  .description("Terminal Timer - A CLI clock and timer")
  .version("1.0.0")
  .argument("[duration]", 'Duration for timer (e.g., 10s, 1m, "1h 30m")')
  .option("-s, --style <style>", "Style of display (digital, analog, text)")
  .option("-l, --label <text>", "Label for the timer")
  .helpOption("-h, --help", "Display help for command")
  .addHelpText(
    "after",
    `
Examples:
  $ ttimer                 # Start clock
  $ ttimer 10s             # Start 10s timer
  $ ttimer 5m -s analog    # Start 5m timer with analog style
  $ ttimer --h             # Show this help
`
  )
  .option("--h", "Display help for command", { hidden: true })
  .on("option:h", () => {
    program.help();
  })
  .action((duration, options) => {
    // Load config
    const config = loadConfig();

    // Determine initial state
    // CLI option > Config > Default
    if (options.style) {
      currentStyle = options.style;
      saveConfig({
        style: currentStyle,
        fontIndex: config.fontIndex || 0,
      });
    } else {
      currentStyle = config.style || "digital";
    }

    currentFontIndex = config.fontIndex || 0;

    // Setup Keypress
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    process.stdin.on("keypress", (str, key) => {
      if (key.name === "q" || (key.ctrl && key.name === "c")) {
        process.stdout.write(ansiEscapes.cursorShow);
        process.stdout.write(ansiEscapes.leaveAlternateScreen);
        process.exit();
      }

      let changed = false;
      if (key.name === "d") {
        currentStyle = "digital";
        changed = true;
      }
      if (key.name === "a") {
        currentStyle = "analog";
        changed = true;
      }
      if (key.name === "t") {
        currentStyle = "text";
        changed = true;
      }
      if (key.name === "f") {
        currentFontIndex = (currentFontIndex + 1) % FONTS.length;
        changed = true;
      }

      if (changed) {
        saveConfig({
          style: currentStyle,
          fontIndex: currentFontIndex,
        });
      }
    });

    if (duration) {
      const ms = parseDuration(duration);
      if (!ms) {
        console.error("Invalid duration format");
        process.exit(1);
      }
      startTimer(ms, options);
    } else {
      startClock(options);
    }
  });

program.parse();
