# TickTTY

<div align="center">
  <h3>A Modern CLI Clock & Timer for your Terminal</h3>
</div>

**TickTTY** (formerly ttimer) is a stylish and feature-rich CLI tool that displays digital clocks, analog clocks, and countdown timers directly in your terminal. It's designed to be minimal, beautiful, and functional.

## Features

- **🕒 Digital Clock**: Large, easy-to-read ASCII digit display.
- **⌚ Analog Clock**: A beautifully rendered ASCII analog clock with moving hands.
- **⏲️ Countdown Timer**: precise timers with visual completion notifications.
- **🎨 Stylish**: Multiple rendering styles (Analog, Digital, Text).
- **🔠 Configurable Fonts**: Cycle through different FIGlet fonts to match your vibe.
- **💾 Persistence**: Automatically saves your last used style and font preferences.
- **🖥️ Adaptive**: Automatically falls back to text mode if your terminal is too small.

## Installation

### NPM (Global)

Install directly from NPM:

```bash
npm install -g ticktty
```

### Arch Linux (AUR)

Install from the AUR using your favorite helper (paru, yay):

```bash
paru -S ticktty
```

## Usage

### Start a Clock

Launch the default interactive clock:

```bash
ticktty
```

### Start a Timer

Set a countdown timer for a specific duration (supports s, m, h):

```bash
ticktty 10m
ticktty 1h30m
ticktty 45s
```

### Options

| Flag                  | Description                                                            |
| --------------------- | ---------------------------------------------------------------------- |
| `-s, --style <style>` | Start with a specific style: `digital` (default), `analog`, or `text`. |
| `-h, --help`          | Display help information.                                              |
| `-V, --version`       | Display version number.                                                |

### Interactive Controls

Once TickTTY is running, use these keys to control it:

- **`q`** or **`Ctrl+C`**: Quit application.
- **`d`**: Switch to **Digital** style.
- **`a`**: Switch to **Analog** style.
- **`t`**: Switch to **Text** style.
- **`f`**: Cycle through available **Fonts** (Digital style only).

## Configuration

Your preferences (style, font) are automatically saved to `~/.config/ticktty/default.json` whenever you change them interactively or via CLI flags.

## License

MIT License. See [LICENSE](./LICENSE) for details.
