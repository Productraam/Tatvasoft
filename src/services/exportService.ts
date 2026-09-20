// Dependency-free tabular export (CSV + Excel-compatible .xls via HTML table).

const triggerDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const escapeCsv = (value: string | number): string => {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportToCsv = (filename: string, headers: string[], rows: (string | number)[][]): void => {
  const lines = [headers.map(escapeCsv).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(','));
  }
  // BOM so Excel opens UTF-8 (₹ symbol) correctly.
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
};

const escapeHtml = (value: string | number): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export const exportToExcel = (
  filename: string,
  title: string,
  headers: string[],
  rows: (string | number)[][]
): void => {
  const headHtml = headers.map((h) => `<th style="background:#f5f5f4;border:1px solid #d6d3d1;padding:4px 8px;text-align:left;">${escapeHtml(h)}</th>`).join('');
  const bodyHtml = rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td style="border:1px solid #e7e5e4;padding:4px 8px;">${escapeHtml(cell)}</td>`)
          .join('')}</tr>`
    )
    .join('');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"/><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${escapeHtml(title).slice(0, 31) || 'Sheet1'}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>${headHtml ? `<thead><tr>${headHtml}</tr></thead>` : ''}<tbody>${bodyHtml}</tbody></table></body></html>`;
  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.xls') ? filename : `${filename}.xls`);
};
