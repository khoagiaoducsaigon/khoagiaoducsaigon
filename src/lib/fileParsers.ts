import * as XLSX from 'xlsx';

export interface ParsedData {
  headers: string[];
  rows: Record<string, any>[];
  sheetNames?: string[];
  currentSheet?: string;
}

// Parse CSV/TSV text
export function parseDelimitedText(text: string, delimiter: string = ','): ParsedData {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 1) return { headers: [], rows: [] };

  const headers = splitLine(lines[0], delimiter).map(h => h.trim());
  const rows = lines.slice(1).map((line, idx) => {
    const values = splitLine(line, delimiter);
    const row: Record<string, any> = { id: idx + 1 };
    headers.forEach((h, i) => {
      const val = values[i]?.trim() ?? '';
      const num = parseFloat(val);
      row[h] = (val !== '' && !isNaN(num) && String(num) === val) ? num : val;
    });
    return row;
  });

  return { headers, rows };
}

function splitLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Parse JSON
export function parseJSON(text: string): ParsedData {
  try {
    const data = JSON.parse(text);
    const rows = Array.isArray(data) ? data : [data];
    if (rows.length === 0) return { headers: [], rows: [] };
    const headers = Object.keys(rows[0]).filter(k => k !== 'id');
    return { headers, rows: rows.map((r, idx) => ({ ...r, id: r.id ?? idx + 1 })) };
  } catch {
    throw new Error('File JSON không hợp lệ');
  }
}

// Parse Excel - returns all sheet names
export function parseExcel(buffer: ArrayBuffer): { sheets: ParsedData[], sheetNames: string[], defaultSheet: number } {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheets: ParsedData[] = [];
  const sheetNames = workbook.SheetNames;

  sheetNames.forEach((name) => {
    const worksheet = workbook.Sheets[name];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
    if (jsonData.length === 0) {
      sheets.push({ headers: [], rows: [], sheetNames, currentSheet: name });
      return;
    }
    const headers = jsonData[0].map(String);
    const rows = jsonData.slice(1).map((row, idx) => {
      const obj: Record<string, any> = { id: idx + 1 };
      headers.forEach((h, i) => {
        const val = row[i];
        if (typeof val === 'number') {
          obj[h] = val;
        } else {
          const strVal = String(val ?? '').trim();
          const num = parseFloat(strVal);
          obj[h] = (strVal !== '' && !isNaN(num) && String(num) === strVal) ? num : strVal;
        }
      });
      return obj;
    });
    sheets.push({ headers, rows, sheetNames, currentSheet: name });
  });

  return { sheets, sheetNames, defaultSheet: 0 };
}

// Get sheet data by index
export function getExcelSheet(result: { sheets: ParsedData[], sheetNames: string[] }, sheetIndex: number): ParsedData {
  return result.sheets[sheetIndex] || result.sheets[0];
}

// Main parser - detect file type and parse
export async function parseFile(file: File): Promise<{
  data: ParsedData;
  allSheets?: { sheets: ParsedData[], sheetNames: string[], defaultSheet: number };
  fileInfo: { name: string; size: string; type: string; rows: number; cols: number };
}> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const size = formatFileSize(file.size);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        let result: ParsedData;
        let allSheets: { sheets: ParsedData[], sheetNames: string[], defaultSheet: number } | undefined;

        if (ext === 'json') {
          result = parseJSON(content as string);
        } else if (ext === 'xlsx' || ext === 'xls') {
          const buffer = content as ArrayBuffer;
          allSheets = parseExcel(buffer);
          result = getExcelSheet(allSheets, 0);
        } else if (ext === 'tsv' || ext === 'txt') {
          result = parseDelimitedText(content as string, '\t');
        } else {
          // Default CSV
          result = parseDelimitedText(content as string, ',');
        }

        const fileInfo = {
          name: file.name,
          size,
          type: ext.toUpperCase(),
          rows: result.rows.length,
          cols: result.headers.length,
        };

        resolve({ data: result, allSheets, fileInfo });
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Không thể đọc file'));
      }
    };

    reader.onerror = () => reject(new Error('Lỗi đọc file'));

    if (ext === 'xlsx' || ext === 'xls') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
