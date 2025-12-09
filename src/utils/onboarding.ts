import readline from "readline";
import chalk from "chalk";

/**
 * Checks if the user wants to enable Nerd Font glyphs.
 * Only runs if the preference is undefined.
 * @returns {Promise<boolean>} True if user enables glyphs.
 */
export async function checkGlyphSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Determine a test glyph.
    // nf-fa-lock (LOCK) is \uf023
    // nf-fa-clock_o (CLOCK) is \uf017
    // Let's use the Lock icon as suggested by the user prompt "do you see a lock".
    const testGlyph = "\uf023";

    console.log("\n" + chalk.cyan.bold("TickTTY Configuration Setup"));
    console.log("We can use Nerd Font glyphs for a prettier display.");
    console.log(
      `\nDo you see a lock icon here? [ ${chalk.yellow(testGlyph)} ]`,
    );

    rl.question("\n(y/n) > ", (answer) => {
      rl.close();
      const normalize = answer.trim().toLowerCase();
      if (normalize === "y" || normalize === "yes") {
        console.log(chalk.green("Great! Enabling glyphs."));
        resolve(true);
      } else {
        console.log(chalk.yellow("Okay, sticking to standard characters."));
        resolve(false);
      }
    });
  });
}
