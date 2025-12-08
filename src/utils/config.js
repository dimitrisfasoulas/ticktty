const fs = require("fs");
const path = require("path");
const os = require("os");

const CONFIG_DIR = path.join(os.homedir(), ".config", "ticktty");
const CONFIG_FILE = path.join(CONFIG_DIR, "default.json");

const DEFAULT_CONFIG = {
  style: "digital",
  fontIndex: 0,
};

/**
 * Loads the configuration from disk.
 * Returns default config if file doesn't exist or error occurs.
 * @returns {object} The configuration object.
 */
function loadConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return { ...DEFAULT_CONFIG };
    }
    const data = fs.readFileSync(CONFIG_FILE, "utf8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch (err) {
    // console.error("Error loading config:", err);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Saves the configuration to disk.
 * Creates directory if it doesn't exist.
 * @param {object} config - The configuration object to save.
 */
function saveConfig(config) {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
  } catch (err) {
    // console.error("Error saving config:", err);
  }
}

module.exports = {
  loadConfig,
  saveConfig,
};
