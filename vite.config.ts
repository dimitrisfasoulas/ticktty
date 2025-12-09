import { defineConfig } from "vite";
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
        "parse-duration",
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
});
