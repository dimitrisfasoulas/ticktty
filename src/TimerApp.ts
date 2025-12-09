import * as render from "./renderers";
import ansiEscapes from "ansi-escapes";
import logUpdate from "log-update";
import notifier from "node-notifier";
import { saveConfig } from "./utils/config";

export type TimerMode = "clock" | "timer";

/**
 * Represents the configuration options for the TimerApp.
 */
export interface TimerAppOptions {
  /** The visual style of the timer (e.g., "digital", "analog", "text"). */
  style: string;
  /** The index of the currently selected font from the available fonts list. */
  fontIndex: number;
  /** Whether to use special glyphs (Nerd Fonts) for rendering. */
  useGlyphs: boolean;
  /** Optional label to display above the timer. */
  label?: string;
  /** List of available Figlet fonts. */
  fonts: string[];
}

/**
 * The main application class for TickTTY.
 * Manages the state of the clock/timer, handles the main loop,
 * and delegates rendering to the renderer module.
 */
export class TimerApp {
  private style: string;
  private fontIndex: number;
  private useGlyphs: boolean;
  private readonly fonts: string[];
  private readonly label: string;
  private mode: TimerMode = "clock";

  private interval?: NodeJS.Timeout;
  private endTime = 0;
  private isPaused = false;
  private remainingMs = 0;

  /**
   * Creates a new instance of TimerApp.
   * @param options - The configuration options for the app.
   */
  constructor(options: TimerAppOptions) {
    this.style = options.style;
    this.fontIndex = options.fontIndex;
    this.useGlyphs = options.useGlyphs;
    this.fonts = options.fonts;
    this.label = options.label ?? "Timer";
  }

  /**
   * Starts the application in Clock mode.
   * Displays the current time continuously.
   */
  public startClock(): void {
    this.cleanup();
    this.mode = "clock";
    this.initDisplay();

    this.interval = setInterval(() => {
      this.tick();
    }, 100);
  }

  /**
   * Starts the application in Timer mode.
   * Counts down from the specified duration.
   * @param durationMs - The duration of the timer in milliseconds.
   */
  public startTimer(durationMs: number): void {
    this.cleanup();
    this.mode = "timer";
    this.endTime = Date.now() + durationMs;
    this.isPaused = false;
    this.initDisplay();

    this.interval = setInterval(() => {
      this.tick();
    }, 100);
  }

  /**
   * Initializes the display by hiding the cursor and entering the alternate screen buffer.
   */
  private initDisplay(): void {
    process.stdout.write(ansiEscapes.cursorHide);
    process.stdout.write(ansiEscapes.enterAlternateScreen);
  }

  /**
   * The main loop tick function.
   * Called every 100ms to update the display.
   * Handles logic for both Clock and Timer modes.
   */
  private tick(): void {
    const font = this.fonts[this.fontIndex];

    if (this.mode === "timer" && !this.isPaused) {
      // Calculate remaining time
      const remaining = this.endTime - Date.now();

      // Check for timer completion
      if (remaining <= 0) {
        this.finish();
        return;
      }
      render.render(
        remaining,
        this.style,
        this.label,
        font,
        false,
        this.useGlyphs,
      );
    } else if (this.mode === "clock") {
      // In clock mode, we simply render the current date/time
      render.render(new Date(), this.style, null, font, false, this.useGlyphs);
    }
  }

  /**
   * Handles timer completion.
   * Stops the tick loop, renders the final "0" state,
   * sends a system notification, and exits the process.
   */
  private finish(): void {
    if (this.interval) clearInterval(this.interval);
    const font = this.fonts[this.fontIndex];
    // Render one last time at 0 to show completion state
    render.render(0, this.style, this.label, font, false, this.useGlyphs);
    logUpdate.done();
    this.cleanupDisplay();

    notifier.notify({
      title: "TickTTY",
      message: `${this.label} finished!`,
      sound: true,
    });
    process.exit(0);
  }

  /**
   * Toggles the pause state of the timer.
   * Only applicable in Timer mode.
   */
  public togglePause(): void {
    if (this.mode !== "timer") return;

    if (this.isPaused) {
      // Resume: Update the end time to account for the duration paused
      this.isPaused = false;
      this.startTimer(this.remainingMs);
    } else {
      // Pause: Calculate remaining time and stop the tick loop
      this.remainingMs = this.endTime - Date.now();
      this.isPaused = true;
      if (this.interval) clearInterval(this.interval);

      const font = this.fonts[this.fontIndex];
      render.render(
        this.remainingMs,
        this.style,
        "PAUSED",
        font,
        true,
        this.useGlyphs,
      );
    }
  }

  /**
   * Resets the timer to the original duration.
   * @param durationMs - The duration to reset to.
   */
  public resetTimer(durationMs: number): void {
    if (this.mode === "timer") {
      this.startTimer(durationMs);
    }
  }

  /**
   * Sets the visual style of the application.
   * Saves the preference to the config.
   * @param newStyle - The new style to apply.
   */
  public setStyle(newStyle: string): void {
    if (this.style !== newStyle) {
      this.style = newStyle;
      this.saveState();
    }
  }

  /**
   * Cycles to the next available font.
   * Only applicable in 'digital' style mode.
   * Saves the preference to the config.
   */
  public cycleFont(): void {
    if (this.style === "digital") {
      this.fontIndex = (this.fontIndex + 1) % this.fonts.length;
      this.saveState();
    }
  }

  /**
   * Toggles the usage of Nerd Font glyphs.
   * Only applicable in 'analog' style mode.
   * Saves the preference to the config.
   */
  public toggleGlyphs(): void {
    if (this.style === "analog") {
      this.useGlyphs = !this.useGlyphs;
      this.saveState();
    }
  }

  /**
   * Exits the application gracefully.
   * Cleans up the display (shows cursor, restores screen) before exiting.
   */
  public quit(): void {
    this.cleanupDisplay();
    process.exit(0);
  }

  /**
   * Clears the active interval timer.
   */
  private cleanup(): void {
    if (this.interval) clearInterval(this.interval);
  }

  /**
   * Restores the terminal state.
   * Shows the cursor | Leaves alternate screen buffer.
   */
  private cleanupDisplay(): void {
    process.stdout.write(ansiEscapes.cursorShow);
    process.stdout.write(ansiEscapes.leaveAlternateScreen);
  }

  /**
   * Persists the current configuration (style, font, glyphs) to disk.
   */
  private saveState(): void {
    saveConfig({
      style: this.style,
      fontIndex: this.fontIndex,
      useGlyphs: this.useGlyphs,
    });
  }
}
