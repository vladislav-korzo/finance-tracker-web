/** Quote a CSV field if it contains separators, quotes or newlines. */
function escapeField(value: string): string {
  if (/[";\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Build a CSV string and trigger a download. Uses `;` as separator (Excel-RU
 * friendly) and prepends a UTF-8 BOM so Cyrillic renders correctly.
 */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const lines = [headers, ...rows].map((row) =>
    row.map((cell) => escapeField(String(cell))).join(';')
  );
  const csv = '﻿' + lines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
