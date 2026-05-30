import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import * as XLSX from 'xlsx';

function cleanRow(row) {
  return row.map(cell => {
    if (cell === null || cell === undefined) return '';
    return String(cell).trim();
  });
}

function isEmptyRow(row) {
  return row.every(cell => !cell || !String(cell).trim());
}

function hasEnoughData(rows, threshold = 2) {
  const nonEmpty = rows.filter(r => !isEmptyRow(r));
  return nonEmpty.length >= threshold;
}

function parseSheetToStructured(sheet) {
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!jsonData || jsonData.length === 0) return null;

  const cleaned = jsonData
    .map(cleanRow)
    .filter(row => !isEmptyRow(row));

  if (cleaned.length < 2) return null;

  // Detect if first row looks like headers (mostly non-empty, short text)
  const firstRow = cleaned[0];
  const nonEmptyCells = firstRow.filter(c => c.length > 0);
  const isHeaderRow = nonEmptyCells.length >= 2 &&
    nonEmptyCells.every(c => c.length < 80);

  let output = '';

  if (isHeaderRow) {
    const headers = firstRow;
    const dataRows = cleaned.slice(1);

    for (const row of dataRows) {
      const pairs = [];
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        const value = row[i] || '';
        if (header && value) {
          pairs.push(`${header}: ${value}`);
        }
      }
      if (pairs.length > 0) {
        output += pairs.join(' | ') + '\n';
      }
    }
  } else {
    // No clear headers - format as clean rows, skip sparse ones
    for (const row of cleaned) {
      const nonEmpty = row.filter(c => c);
      if (nonEmpty.length >= 2) {
        output += nonEmpty.join(' | ') + '\n';
      } else if (nonEmpty.length === 1 && nonEmpty[0].length > 3) {
        output += nonEmpty[0] + '\n';
      }
    }
  }

  return output.trim() || null;
}

function detectSheetType(sheetName, content) {
  const name = sheetName.toLowerCase();
  const text = content.toLowerCase();

  if (name.includes('schedule') || name.includes('snapshot')) return 'SCHEDULE';
  if (name.includes('speaker') || name.includes('visit') || name.includes('excursion')) return 'EXCURSIONS & SPEAKERS';
  if (name.includes('staff') || name.includes('mentor') || name.includes('confirmed')) return 'STAFF & MENTORS';
  if (name.includes('instructor')) return 'INSTRUCTORS';
  if (name.includes('transport')) return 'TRANSPORTATION';
  if (name.includes('supply') || name.includes('supplies') || name.includes('inventory')) return 'SUPPLIES';
  if (name.includes('form response')) return null; // Skip form responses
  if (text.includes('excursion') && text.includes('date')) return 'EXCURSIONS & SPEAKERS';
  if (text.includes('breakfast') && text.includes('lunch')) return 'SCHEDULE';

  return 'INFO';
}

export async function POST(request) {
  const user = await getUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = file.name;
    const ext = fileName.split('.').pop().toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let content = '';

    if (ext === 'csv' || ext === 'txt') {
      const raw = buffer.toString('utf-8');
      const lines = raw.split('\n').filter(l => l.trim() && !l.split(',').every(c => !c.trim()));
      content = lines.join('\n');
    } else if (ext === 'xlsx' || ext === 'xls' || ext === 'ods') {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sections = [];

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (!jsonData || !hasEnoughData(jsonData, 2)) continue;

        const parsed = parseSheetToStructured(sheet);
        if (!parsed) continue;

        const sheetType = detectSheetType(sheetName, parsed);
        if (!sheetType) continue; // Skip irrelevant sheets

        sections.push({
          type: sheetType,
          name: sheetName,
          content: parsed,
        });
      }

      // Group by type for better context
      const grouped = {};
      for (const s of sections) {
        if (!grouped[s.type]) grouped[s.type] = [];
        grouped[s.type].push(s);
      }

      for (const [type, sheets] of Object.entries(grouped)) {
        content += `=== ${type} ===\n\n`;
        for (const s of sheets) {
          if (sheets.length > 1) {
            content += `[${s.name}]\n`;
          }
          content += s.content + '\n\n';
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Use CSV, TXT, XLSX, XLS, or ODS.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      fileName,
      fileType: ext,
      content: content.trim(),
    });
  } catch (err) {
    console.error('File parse error:', err);
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 });
  }
}
