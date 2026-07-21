/**
 * Format an XLSX worksheet with professional styling (fonts, borders, colors).
 * Used for both Excel export and template download features.
 */
export const formatWorksheet = (XLSX: any, ws: any, hasHeader = true, fontName = 'Segoe UI') => {
  if (!ws || !ws['!ref']) return;
  const range = XLSX.utils.decode_range(ws['!ref']);
  const cols: any[] = [];

  const isSarabun = fontName === 'TH Sarabun New';
  const defaultSize = isSarabun ? 14 : 10;
  const headerSize = isSarabun ? 16 : 11;
  const monoSize = isSarabun ? 13 : 9.5;

  // Initialize column widths with default 15
  for (let C = range.s.c; C <= range.e.c; ++C) {
    cols.push({ wch: 15 });
  }

  for (const cellRef in ws) {
    if (cellRef.startsWith('!')) continue;
    const cell = ws[cellRef];
    if (!cell) continue;

    const cellDecoded = XLSX.utils.decode_cell(cellRef);
    const row = cellDecoded.r;
    const col = cellDecoded.c;

    // Find the header text for this column
    const headerCellRef = XLSX.utils.encode_cell({ r: 0, c: col });
    const headerText = ws[headerCellRef]?.v ? String(ws[headerCellRef].v).toLowerCase() : '';

    // Auto-calculate column width
    const textVal = cell.v ? String(cell.v) : '';
    const len = textVal.split('').reduce((acc: number, char: string) => {
      return acc + (char.charCodeAt(0) > 127 ? 1.5 : 1);
    }, 0);

    if (len > (cols[col].wch - 3)) {
      cols[col].wch = Math.min(Math.ceil(len + 4), 40);
    }

    // Default style
    const style: any = {
      font: { name: fontName, sz: defaultSize, color: { rgb: '334155' } },
      alignment: { vertical: 'center' },
      border: {
        bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
        top: { style: 'thin', color: { rgb: 'E2E8F0' } },
        left: { style: 'thin', color: { rgb: 'E2E8F0' } },
        right: { style: 'thin', color: { rgb: 'E2E8F0' } }
      }
    };

    // Header styling
    if (hasHeader && row === 0) {
      style.font = { name: fontName, sz: headerSize, bold: true, color: { rgb: '1E293B' } };
      style.fill = { fgColor: { rgb: 'F1F5F9' } }; // slate-100
      style.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
      style.border = {
        bottom: { style: 'medium', color: { rgb: '94A3B8' } }, // slate-400
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };
    } else {
      // Cell styling based on header name
      if (headerText.includes('vin') || headerText.includes('ตัวถัง')) {
        style.font = { name: isSarabun ? fontName : 'Consolas', sz: defaultSize, bold: true, color: { rgb: '0F172A' } };
        style.alignment = { horizontal: 'center', vertical: 'center' };
      } 
      else if (headerText.includes('code') || headerText.includes('รหัส')) {
        style.font = { name: isSarabun ? fontName : 'Consolas', sz: monoSize, color: { rgb: '475569' } };
        if (headerText.includes('branch') || headerText.includes('สาขา')) {
          style.alignment = { horizontal: 'center', vertical: 'center' };
        }
      } 
      else if (headerText.includes('year') || headerText.includes('date') || headerText.includes('ปี') || headerText.includes('วัน')) {
        style.alignment = { horizontal: 'center', vertical: 'center' };
      } 
      else if (headerText.includes('status') || headerText.includes('สถานะ')) {
        style.alignment = { horizontal: 'center', vertical: 'center' };
        
        const v = String(cell.v);
        if (v.includes('อนุมัติแล้ว') || v.includes('ใน Stock')) {
          style.font.bold = true;
          style.font.color = { rgb: '166534' }; // green-800
          style.fill = { fgColor: { rgb: 'DCFCE7' } }; // green-100
        } else if (v.includes('ถูก Reject') || v.includes('ส่งมอบแล้ว')) {
          style.font.bold = true;
          style.font.color = { rgb: '991B1B' }; // red-800
          style.fill = { fgColor: { rgb: 'FEE2E2' } }; // red-100
        } else if (v.includes('กำลังตรวจ')) {
          style.font.bold = true;
          style.font.color = { rgb: '0F766E' }; // teal-800
          style.fill = { fgColor: { rgb: 'CCFBF1' } }; // teal-100
        } else if (v.includes('รอ QC')) {
          style.font.bold = true;
          style.font.color = { rgb: '92400E' }; // amber-800
          style.fill = { fgColor: { rgb: 'FEF3C7' } }; // amber-100
        } else if (v.includes('รอตรวจ')) {
          style.font.bold = true;
          style.font.color = { rgb: '475569' }; // slate-600
          style.fill = { fgColor: { rgb: 'F1F5F9' } }; // slate-100
        }
      }
    }

    cell.s = style;
  }

  ws['!cols'] = cols;

  const rows: any[] = [];
  for (let R = range.s.r; R <= range.e.r; ++R) {
    rows.push({ hpt: R === 0 ? (isSarabun ? 34 : 28) : (isSarabun ? 26 : 22) });
  }
  ws['!rows'] = rows;
};
