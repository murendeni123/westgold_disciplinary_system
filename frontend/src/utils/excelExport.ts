import XLSX from 'xlsx-js-style';

// ── Style Constants ──────────────────────────────────────────────────────────
const COLORS = {
  headerBg: '1F2937',      // dark charcoal
  headerText: 'FFFFFF',     // white
  sectionBg: '374151',      // medium charcoal
  sectionText: 'FFFFFF',    // white
  altRowBg: 'F3F4F6',       // light gray
  borderColor: 'D1D5DB',    // gray-300
  greenBg: '059669',        // emerald
  greenText: 'FFFFFF',
  redBg: 'DC2626',          // red
  redText: 'FFFFFF',
  amberBg: 'D97706',        // amber
  amberText: 'FFFFFF',
};

const BORDER_STYLE = {
  top: { style: 'thin', color: { rgb: COLORS.borderColor } },
  bottom: { style: 'thin', color: { rgb: COLORS.borderColor } },
  left: { style: 'thin', color: { rgb: COLORS.borderColor } },
  right: { style: 'thin', color: { rgb: COLORS.borderColor } },
};

const headerStyle = {
  font: { bold: true, color: { rgb: COLORS.headerText }, sz: 12, name: 'Calibri' },
  fill: { fgColor: { rgb: COLORS.headerBg } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: BORDER_STYLE,
};

const sectionTitleStyle = {
  font: { bold: true, color: { rgb: COLORS.sectionText }, sz: 13, name: 'Calibri' },
  fill: { fgColor: { rgb: COLORS.sectionBg } },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: BORDER_STYLE,
};

const cellStyle = {
  font: { sz: 11, name: 'Calibri' },
  alignment: { vertical: 'center' },
  border: BORDER_STYLE,
};

const altCellStyle = {
  ...cellStyle,
  fill: { fgColor: { rgb: COLORS.altRowBg } },
};

const numberStyle = {
  ...cellStyle,
  alignment: { horizontal: 'center', vertical: 'center' },
};

const altNumberStyle = {
  ...altCellStyle,
  alignment: { horizontal: 'center', vertical: 'center' },
};

// ── Helper: Auto-size columns based on content ──────────────────────────────
function autoSizeColumns(headers: string[], data: any[][]): { wch: number }[] {
  return headers.map((header, colIdx) => {
    let maxLen = header.length;
    data.forEach((row) => {
      const val = row[colIdx];
      const len = val != null ? String(val).length : 0;
      if (len > maxLen) maxLen = len;
    });
    return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
  });
}

// ── Helper: Apply styles to a worksheet ─────────────────────────────────────
function styleSheet(
  ws: XLSX.WorkSheet,
  headerRowIndex: number,
  headers: string[],
  dataRowCount: number
) {
  // Style header row
  for (let col = 0; col < headers.length; col++) {
    const addr = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
    if (ws[addr]) ws[addr].s = headerStyle;
  }
  // Style data rows with alternating colors
  for (let row = 0; row < dataRowCount; row++) {
    const isAlt = row % 2 === 1;
    for (let col = 0; col < headers.length; col++) {
      const addr = XLSX.utils.encode_cell({ r: headerRowIndex + 1 + row, c: col });
      if (!ws[addr]) continue;
      const val = ws[addr].v;
      const isNum = typeof val === 'number';
      ws[addr].s = isNum ? (isAlt ? altNumberStyle : numberStyle) : (isAlt ? altCellStyle : cellStyle);
    }
  }
}

/**
 * Export data to a professionally formatted Excel file
 */
export const exportToExcel = (
  reportName: string,
  headers: string[],
  data: any[][],
  sheetName: string = 'Report'
) => {
  const workbook = XLSX.utils.book_new();

  // Title row + blank row + header + data
  const titleRow = [reportName.replace(/_/g, ' ').toUpperCase()];
  const dateRow = [`Generated: ${new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}`];
  const blankRow: string[] = [];
  const worksheetData = [titleRow, dateRow, blankRow, headers, ...data];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Merge title cell across all columns
  const lastCol = headers.length - 1;
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
  ];

  // Style title
  const titleAddr = XLSX.utils.encode_cell({ r: 0, c: 0 });
  if (worksheet[titleAddr]) {
    worksheet[titleAddr].s = {
      font: { bold: true, sz: 16, color: { rgb: COLORS.headerText }, name: 'Calibri' },
      fill: { fgColor: { rgb: COLORS.greenBg } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }
  // Style date row
  const dateAddr = XLSX.utils.encode_cell({ r: 1, c: 0 });
  if (worksheet[dateAddr]) {
    worksheet[dateAddr].s = {
      font: { italic: true, sz: 10, color: { rgb: '6B7280' }, name: 'Calibri' },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }

  // Style header and data (header is at row 3)
  styleSheet(worksheet, 3, headers, data.length);

  // Auto-size columns
  worksheet['!cols'] = autoSizeColumns(headers, data);

  // Row heights
  worksheet['!rows'] = [
    { hpx: 32 }, // title
    { hpx: 20 }, // date
    { hpx: 8 },  // blank
    { hpx: 28 }, // headers
    ...data.map(() => ({ hpx: 22 })),
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${reportName}_${timestamp}.xlsx`);
};

/**
 * Export multiple sheets to a single professionally formatted Excel file
 */
export const exportMultiSheetExcel = (
  reportName: string,
  sheets: Array<{
    name: string;
    headers: string[];
    data: any[][];
  }>
) => {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const safeName = sheet.name.replace(/[\\\/\?\*\[\]]/g, '').slice(0, 31);
    const titleRow = [safeName];
    const dateRow = [`Generated: ${new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}`];
    const blankRow: string[] = [];
    const worksheetData = [titleRow, dateRow, blankRow, sheet.headers, ...sheet.data];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const lastCol = Math.max(sheet.headers.length - 1, 0);

    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
    ];

    const titleAddr = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (worksheet[titleAddr]) {
      worksheet[titleAddr].s = {
        font: { bold: true, sz: 14, color: { rgb: COLORS.headerText }, name: 'Calibri' },
        fill: { fgColor: { rgb: COLORS.greenBg } },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
    }
    const dateAddr = XLSX.utils.encode_cell({ r: 1, c: 0 });
    if (worksheet[dateAddr]) {
      worksheet[dateAddr].s = {
        font: { italic: true, sz: 10, color: { rgb: '6B7280' }, name: 'Calibri' },
        alignment: { horizontal: 'center' },
      };
    }

    styleSheet(worksheet, 3, sheet.headers, sheet.data.length);
    worksheet['!cols'] = autoSizeColumns(sheet.headers, sheet.data);
    worksheet['!rows'] = [
      { hpx: 30 },
      { hpx: 20 },
      { hpx: 8 },
      { hpx: 26 },
      ...sheet.data.map(() => ({ hpx: 22 })),
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, safeName);
  });

  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${reportName}_${timestamp}.xlsx`);
};

/**
 * Export a comprehensive school report with multiple sections per sheet
 * Used for "Overall", "Per Grade", "Per Class", and "Per Student" reports
 */
export const exportComprehensiveReport = (
  reportName: string,
  sections: Array<{
    title: string;
    headers: string[];
    data: any[][];
  }>,
  sheetName: string = 'Report'
) => {
  const workbook = XLSX.utils.book_new();
  const rows: any[][] = [];

  // Report title
  rows.push([reportName.replace(/_/g, ' ').toUpperCase()]);
  rows.push([`Generated: ${new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`]);
  rows.push([]);

  const merges: any[] = [];
  const sectionMeta: { titleRow: number; headerRow: number; dataCount: number; headers: string[] }[] = [];

  // Determine max column count across all sections
  const maxCols = Math.max(...sections.map((s) => s.headers.length), 1);

  // Merge title rows
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: maxCols - 1 } });
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: maxCols - 1 } });

  sections.forEach((section) => {
    const titleRowIdx = rows.length;
    // Section title (merged)
    rows.push([section.title.toUpperCase()]);
    merges.push({ s: { r: titleRowIdx, c: 0 }, e: { r: titleRowIdx, c: maxCols - 1 } });

    const headerRowIdx = rows.length;
    rows.push(section.headers);

    sectionMeta.push({
      titleRow: titleRowIdx,
      headerRow: headerRowIdx,
      dataCount: section.data.length,
      headers: section.headers,
    });

    section.data.forEach((row) => rows.push(row));

    // Summary row if numeric data
    const numericCols = section.headers.map((_, i) =>
      section.data.length > 0 && typeof section.data[0][i] === 'number' ? i : -1
    ).filter((i) => i >= 0);
    if (numericCols.length > 0 && section.data.length > 0) {
      const totalRow = section.headers.map((_, i) => {
        if (i === 0) return 'TOTAL';
        if (numericCols.includes(i)) {
          return section.data.reduce((sum, row) => sum + (Number(row[i]) || 0), 0);
        }
        return '';
      });
      rows.push(totalRow);
    }

    rows.push([]); // spacing between sections
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!merges'] = merges;

  // Style report title
  const titleAddr = XLSX.utils.encode_cell({ r: 0, c: 0 });
  if (worksheet[titleAddr]) {
    worksheet[titleAddr].s = {
      font: { bold: true, sz: 18, color: { rgb: COLORS.headerText }, name: 'Calibri' },
      fill: { fgColor: { rgb: COLORS.greenBg } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }
  const dateAddr = XLSX.utils.encode_cell({ r: 1, c: 0 });
  if (worksheet[dateAddr]) {
    worksheet[dateAddr].s = {
      font: { italic: true, sz: 10, color: { rgb: '6B7280' }, name: 'Calibri' },
      alignment: { horizontal: 'center' },
    };
  }

  // Style each section
  sectionMeta.forEach((meta) => {
    // Section title row
    const sTitleAddr = XLSX.utils.encode_cell({ r: meta.titleRow, c: 0 });
    if (worksheet[sTitleAddr]) worksheet[sTitleAddr].s = sectionTitleStyle;

    // Header + data rows
    styleSheet(worksheet, meta.headerRow, meta.headers, meta.dataCount);

    // Style TOTAL row if it exists
    const totalRowIdx = meta.headerRow + 1 + meta.dataCount;
    for (let c = 0; c < meta.headers.length; c++) {
      const addr = XLSX.utils.encode_cell({ r: totalRowIdx, c });
      if (worksheet[addr] && worksheet[addr].v !== '' && worksheet[addr].v != null) {
        worksheet[addr].s = {
          font: { bold: true, sz: 11, name: 'Calibri' },
          fill: { fgColor: { rgb: 'E5E7EB' } },
          alignment: { horizontal: typeof worksheet[addr].v === 'number' ? 'center' : 'left', vertical: 'center' },
          border: BORDER_STYLE,
        };
      }
    }
  });

  // Auto-size columns based on all data
  const colWidths: number[] = new Array(maxCols).fill(12);
  rows.forEach((row) => {
    row.forEach((val: any, i: number) => {
      const len = val != null ? String(val).length + 3 : 0;
      if (len > colWidths[i]) colWidths[i] = Math.min(len, 45);
    });
  });
  worksheet['!cols'] = colWidths.map((w) => ({ wch: w }));

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${reportName}_${timestamp}.xlsx`);
};
