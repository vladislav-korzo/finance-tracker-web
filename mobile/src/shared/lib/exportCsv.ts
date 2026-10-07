import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Toast from 'react-native-toast-message';

/** Quote a CSV field if it contains separators, quotes or newlines. */
function escapeField(value: string): string {
  if (/[";\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Write the CSV to a cache file and open the native share sheet. */
async function writeAndShare(filename: string, csv: string): Promise<void> {
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.write(csv);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Экспорт недоступен на этом устройстве');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: filename,
  });
}

/**
 * Build a CSV string and share it. Uses `;` as separator (Excel-RU friendly)
 * and prepends a UTF-8 BOM so Cyrillic renders correctly. The file is written to
 * the cache directory and handed to the OS share sheet via `expo-sharing`.
 */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const lines = [headers, ...rows].map((row) =>
    row.map((cell) => escapeField(String(cell))).join(';')
  );
  const csv = '﻿' + lines.join('\r\n');

  // Fire-and-forget to preserve the synchronous `void` signature of the web API.
  // The caller shows its own success toast immediately, matching web behaviour
  // where `a.click()` returns before the download completes.
  void writeAndShare(filename, csv).catch((err) => {
    Toast.show({
      type: 'error',
      text1: 'Не удалось экспортировать',
      text2: err instanceof Error ? err.message : undefined,
    });
  });
}
