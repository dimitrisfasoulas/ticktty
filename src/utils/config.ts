import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".config", "ticktty");
const CONFIG_FILE = path.join(CONFIG_DIR, "default.json");

export interface Config {
  style: string;
  fontIndex: number;
  useGlyphs?: boolean;
}

const DEFAULT_CONFIG: Config = {
  style: "digital",
  fontIndex: 0,
  useGlyphs: undefined,
};

/**
 * Loads the configuration from disk.
 * Returns default config if file doesn't exist or error occurs.
 * @returns {Config} The configuration object.
 */
export function loadConfig(): Config {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return { ...DEFAULT_CONFIG };
    }
    const data = fs.readFileSync(CONFIG_FILE, "utf8");
    return { ...DEFAULT_CONFIG, ...(JSON.parse(data) as Partial<Config>) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Saves the configuration to disk.
 * Creates directory if it doesn't exist.
 * @param {Config} config - The configuration object to save.
 */
export function saveConfig(config: Config): void {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
  } catch {
    // ignore
  }
}
