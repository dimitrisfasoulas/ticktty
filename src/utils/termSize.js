/**
 * Gets the current terminal size.
 * @returns {{rows: number, columns: number}} Object containing rows and columns
 */
function getSize() {
  return {
    rows: process.stdout.rows || 24,
    columns: process.stdout.columns || 80,
  };
}

module.exports = { getSize };
