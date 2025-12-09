/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      fileName: () => "index.cjs",
      formats: ["cjs"],
    },
    rollupOptions: {
      external: [
        "commander",
        "chalk",
        "figlet",
        "log-update",
        "node-notifier",
        "readline",
        "ansi-escapes",
        "fs",
        "path",
        "os",
        "events",
      ],
    },
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    target: "node16",
  },
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      include: ["src/**/*.ts"],
      exclude: ["src/types.d.ts", "src/**/*.test.ts", "src/index.ts"],
    },
  },
});
