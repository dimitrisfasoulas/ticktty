/**
 * Gets the current terminal size.
 * @returns {{rows: number, columns: number}} Object containing rows and columns
 */
export function getSize(): { rows: number; columns: number } {
  return {
    rows: process.stdout.rows || 24,
    columns: process.stdout.columns || 80,
  };
}
