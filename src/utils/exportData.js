import * as XLSX from 'xlsx';

/**
 * Export data to Excel (.xlsx)
 * @param {Array} data - array of raw data objects
 * @param {Array} columns - [{ header: 'Column Title', key: 'fieldKey', render?: (row) => string }]
 * @param {string} filename - filename without extension
 */
export function exportToExcel(data, columns, filename = 'export') {
  const rows = data.map((row) => {
    const obj = {};
    columns.forEach((col) => {
      obj[col.header] = col.render ? col.render(row) : (row[col.key] ?? '');
    });
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-width columns
  const colWidths = columns.map((col) => ({
    wch: Math.max(
      col.header.length + 2,
      ...rows.map((r) => String(r[col.header] || '').length)
    ),
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
