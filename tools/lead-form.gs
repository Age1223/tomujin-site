/**
 * Tomujin website lead form → the "Leads" tab of "TAS | Admissions Data 2026-2027".
 *
 * A standalone Apps Script project (not attached to the spreadsheet, so it can't clash with the
 * spreadsheet's own scripts). It opens the spreadsheet by its ID.
 *
 * The homepage form ("Дэлгэрэнгүй мэдээлэл авах бол...") sends each answer here. The script finds
 * the Leads table's columns by their header names and fills the first empty row, the same way the
 * team fills it by hand. Setup steps are in README.md under "Lead form".
 */

const SPREADSHEET_ID = 'PASTE_SPREADSHEET_ID';   // from the spreadsheet's address: docs.google.com/spreadsheets/d/<this part>/edit
const SHEET_NAME = 'Leads';     // the tab leads go to
const CHANNEL = 'Website';      // written in "Хаагуур холбогдсон" (also added to that column's dropdown)

// Header names in the Leads table (spaces and line breaks don't matter)
const COL = {
  date: 'Холбогдсон огноо',
  grade: 'Сонирхсон анги',
  channel: 'Хаагуур холбогдсон',
  phone: 'Утасны дугаар',
  school: 'Одоогийн сургууль',
  name: 'Холбогдсон хүний нэр'
};

function doPost(e) {
  const p = (e && e.parameter) || {};

  // Hidden "website" field: people never see it, spam bots fill it in
  if (p.website) return json({ ok: true });

  const phone = clean(p.phone, 20);
  const school = clean(p.school, 120);
  const grade = clean(p.grade, 20);
  if (!phone || !school || !grade) return json({ ok: false, error: 'missing' });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) return json({ ok: false, error: 'no sheet' });

    const t = findTable(sheet);
    if (!t) return json({ ok: false, error: 'no header' });
    const row = firstEmptyRow(sheet, t);
    if (row > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), row - sheet.getMaxRows());

    // Date: same kind of value as the row above (a real date, or text like 2026.09.28)
    const above = row - 1 > t.headerRow ? sheet.getRange(row - 1, t.cols.date) : null;
    const today = new Date();
    const dateCell = sheet.getRange(row, t.cols.date);
    if (above && Object.prototype.toString.call(above.getValue()) === '[object Date]') {
      dateCell.setValue(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
      dateCell.setNumberFormat(above.getNumberFormat());
    } else {
      dateCell.setValue(Utilities.formatDate(today, ss.getSpreadsheetTimeZone(), 'yyyy.MM.dd'));
    }

    const gradeNumber = parseInt(grade, 10);
    if (t.cols.grade) sheet.getRange(row, t.cols.grade).setValue(isNaN(gradeNumber) ? grade : gradeNumber);
    if (t.cols.channel) sheet.getRange(row, t.cols.channel).setValue(CHANNEL);
    sheet.getRange(row, t.cols.phone).setNumberFormat('@').setValue(phone.replace(/^'/, ''));
    if (t.cols.school) sheet.getRange(row, t.cols.school).setValue(school);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  return json({ ok: true });
}

// Finds the header row (the one with "Утасны дугаар" in the first 15 rows) and the visible column of each header
function findTable(sheet) {
  const lastCol = sheet.getLastColumn();
  const top = sheet.getRange(1, 1, Math.min(15, sheet.getMaxRows()), lastCol).getDisplayValues();
  const norm = s => String(s).replace(/\s+/g, ' ').trim();
  for (let r = 0; r < top.length; r++) {
    const headers = top[r].map(norm);
    if (headers.indexOf(norm(COL.phone)) === -1) continue;
    const cols = {};
    Object.keys(COL).forEach(key => {
      for (let c = 0; c < headers.length; c++) {
        if (headers[c] === norm(COL[key]) && !sheet.isColumnHiddenByUser(c + 1)) { cols[key] = c + 1; break; }
      }
    });
    if (!cols.date || !cols.phone) return null;
    return { headerRow: r + 1, cols: cols };
  }
  return null;
}

// First row below the header where the date, name, grade, channel, phone and school columns are all empty
function firstEmptyRow(sheet, t) {
  const start = t.headerRow + 1;
  const last = Math.max(sheet.getLastRow(), start);
  const keys = ['date', 'name', 'grade', 'channel', 'phone', 'school'].filter(k => t.cols[k]);
  const values = keys.map(k => sheet.getRange(start, t.cols[k], last - start + 1, 1).getDisplayValues());
  for (let i = 0; i <= last - start; i++) {
    if (values.every(v => String(v[i][0]).trim() === '')) return start + i;
  }
  return last + 1;
}

// Trims and shortens an answer; a leading = + - @ gets a ' so the sheet shows it as text, not a formula
function clean(value, max) {
  const v = String(value || '').trim().slice(0, max);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
