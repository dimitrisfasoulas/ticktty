import { spawn } from "child_process";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import chalk from "chalk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST_PATH = resolve(__dirname, "../dist/index.cjs");

interface TestCase {
  name: string;
  args: string[];
}

const testCases: TestCase[] = [
  { name: "Default 1s timer", args: ["1s"] },
  { name: "Digital style", args: ["1s", "-s", "digital"] },
  { name: "Analog style", args: ["1s", "-s", "analog"] },
  { name: "Text style", args: ["1s", "-s", "text"] },
  { name: "Custom label", args: ["1s", "--label", "Smoke Test"] },
];

async function runTest(testCase: TestCase): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(chalk.blue(`Running test: ${testCase.name}`));

    // Run the compiled script
    const child = spawn("node", [DIST_PATH, ...testCase.args], {
      stdio: ["pipe", "ignore", "pipe"], // Pipe stdin to send 'q' if needed, ignore stdout to keep clean, pipe stderr to catch errors
    });

    let stderr = "";

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    // Timer to kill process if it hangs (should finish in ~1s + overhead)
    const timeout = setTimeout(() => {
      console.log(chalk.yellow(`  > Timeout reached, sending 'q' to quit...`));
      child.stdin.write("q");
      child.stdin.end();

      // Give it a moment to exit gracefully
      setTimeout(() => {
        if (!child.killed) {
          child.kill();
        }
      }, 1000);
    }, 2500);

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0 && !stderr) {
        console.log(chalk.green(`  ✓ Passed`));
        resolve(true);
      } else {
        console.error(chalk.red(`  ✗ Failed (Exit code: ${String(code)})`));
        if (stderr) console.error(chalk.red(`  Stderr: ${stderr}`));
        resolve(false);
      }
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      console.error(chalk.red(`  ✗ Failed (Process error: ${err.message})`));
      resolve(false);
    });
  });
}

async function main() {
  console.log(chalk.bold("Starting Smoke Tests..."));

  // First check if dist exists
  try {
    const fs = await import("fs");
    if (!fs.existsSync(DIST_PATH)) {
      console.error(
        chalk.red(
          "Error: dist/index.cjs not found. Run 'npm run build' first.",
        ),
      );
      process.exit(1);
    }
  } catch {
    // ignore
  }

  let passed = 0;
  for (const testCase of testCases) {
    const success = await runTest(testCase);
    if (success) passed++;
  }

  console.log("\n" + chalk.bold("Summary:"));
  if (passed === testCases.length) {
    console.log(chalk.green(`All ${String(testCases.length)} tests passed!`));
    process.exit(0);
  } else {
    console.error(
      chalk.red(`${String(testCases.length - passed)} tests failed.`),
    );
    process.exit(1);
  }
}

void main();
