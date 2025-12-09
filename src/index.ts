#!/usr/bin/env node

/**
 * ticktty - Terminal Timer
 * A CLI-based clock and countdown timer with multiple display styles.
 *
 * Features:
 * - Clock mode (default)
 * - Timer mode (countdown)
 * - Styles: Digital (figlet), Analog (ASCII), Text
 * - Fullscreen, centered layout
 * - Interactive controls (styles, quit)
 */

import { Command, Option } from "commander";
import parseDuration from "parse-duration";
import readline from "readline";
import ansiEscapes from "ansi-escapes";

import { loadConfig, saveConfig } from "./utils/config";
import { checkGlyphSupport } from "./utils/onboarding";

const program = new Command();

// Polyfill for ANSI escape codes that may be missing in older versions of ansi-escapes.
// Creates a safe reference to allow mutation for polyfilling.
const extendedAnsi = ansiEscapes as {
  enterAlternateScreen?: string;
  leaveAlternateScreen?: string;
} & typeof ansiEscapes;

if (!extendedAnsi.enterAlternateScreen) {
  extendedAnsi.enterAlternateScreen = "\u001B[?1049h";
}
if (!extendedAnsi.leaveAlternateScreen) {
  extendedAnsi.leaveAlternateScreen = "\u001B[?1049l";
}

const FONTS: string[] = [
  "Standard",
  "Ghost",
  "Slant",
  "Small",
  "Big",
  "Banner",
  "Larry 3D",
];

/**
 * CLI Options interface.
 */
interface Options {
  /** Visual style: "digital", "analog", or "text" */
  style?: string;
  /** Label text for the timer */
  label?: string;
}

/**
 * Interface for Node.js keypress events.
 */
interface KeypressEvent {
  name?: string;
  ctrl?: boolean;
  sequence?: string;
}

// Handle SIGINT for graceful exit
process.on("SIGINT", () => {
  // Ensure cursor is shown and alternate screen is left before exiting
  // This serves as a failsafe if the app instance cleanup isn't triggered.
  process.stdout.write(ansiEscapes.cursorShow);
  process.stdout.write(ansiEscapes.leaveAlternateScreen);
  process.exit();
});

import { TimerApp } from "./TimerApp";

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
`,
  )
  .addOption(new Option("--h", "Display help for command").hideHelp())
  .on("option:h", () => {
    program.help();
  })
  .action(async (duration: string | undefined, options: Options) => {
    // Load config
    const config = loadConfig();

    let useGlyphs = config.useGlyphs;

    // Helper to start app
    const run = () => {
      const initialStyle = options.style ?? config.style;
      const initialFontIndex = config.fontIndex;

      const app = new TimerApp({
        style: initialStyle,
        fontIndex: initialFontIndex,
        useGlyphs: useGlyphs ?? false, // Default to false if still undefined
        label: options.label,
        fonts: FONTS,
      });

      // Setup Keypress
      readline.emitKeypressEvents(process.stdin);
      if (process.stdin.isTTY) process.stdin.setRawMode(true);

      process.stdin.on(
        "keypress",
        (_str: string | undefined, key: KeypressEvent) => {
          if (key.name === "q" || (key.ctrl && key.name === "c")) {
            app.quit();
          }

          if (key.name === "d") {
            app.setStyle("digital");
          }
          if (key.name === "a") {
            app.setStyle("analog");
          }
          if (key.name === "t") {
            app.setStyle("text");
          }
          if (key.name === "f") {
            app.cycleFont();
          }
          if (key.name === "g") {
            app.toggleGlyphs();
          }

          if (key.name === "r" && duration) {
            const ms = parseDuration(duration) as number | null | undefined;
            app.resetTimer(ms ?? 0);
          }

          if (key.name === "space") {
            app.togglePause();
          }
        },
      );

      if (duration) {
        const ms = parseDuration(duration) as number | null | undefined;
        if (!ms) {
          console.error("Invalid duration format");
          process.exit(1);
        }
        app.startTimer(ms);
      } else {
        app.startClock();
      }
    };

    if (useGlyphs === undefined) {
      useGlyphs = await checkGlyphSupport();
      saveConfig({ ...config, useGlyphs });
      run();
    } else {
      run();
    }
  });

program.parse();
