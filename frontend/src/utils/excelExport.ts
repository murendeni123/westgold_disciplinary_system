import * as XLSX from 'xlsx';

/**
 * Export data to Excel file with proper formatting
 * @param reportName - Name of the report (used for filename)
 * @param headers - Array of column headers
 * @param data - 2D array of data rows
 * @param sheetName - Name of the worksheet (optional, defaults to 'Report')
 */
export const exportToExcel = (
  reportName: string,
  headers: string[],
  data: any[][],
  sheetName: string = 'Report'
) => {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Prepare data with headers
  const worksheetData = [headers, ...data];

  // Create worksheet from data
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths for better readability
  const columnWidths = headers.map((header) => ({
    wch: Math.max(header.length, 15), // Minimum width of 15 characters
  }));
  worksheet['!cols'] = columnWidths;

  // Style the header row (bold and background color)
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    
    // Add basic styling (note: full styling requires xlsx-style or similar)
    worksheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E2E8F0' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `${reportName}_${timestamp}.xlsx`;

  // Write and download the file
  XLSX.writeFile(workbook, filename);
};

/**
 * Export multiple sheets to a single Excel file
 * @param reportName - Name of the report (used for filename)
 * @param sheets - Array of sheet objects with name, headers, and data
 */
export const exportMultiSheetExcel = (
  reportName: string,
  sheets: Array<{
    name: string;
    headers: string[];
    data: any[][];
  }>
) => {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    // Prepare data with headers
    const worksheetData = [sheet.headers, ...sheet.data];

    // Create worksheet from data
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    const columnWidths = sheet.headers.map((header) => ({
      wch: Math.max(header.length, 15),
    }));
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `${reportName}_${timestamp}.xlsx`;

  // Write and download the file
  XLSX.writeFile(workbook, filename);
};
