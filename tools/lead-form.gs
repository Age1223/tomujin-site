/**
 * Tomujin website lead form → Google Sheet.
 *
 * The homepage form ("Дэлгэрэнгүй мэдээлэл авах бол...") sends each answer here,
 * and this script adds it as a new row in the sheet it's attached to.
 * Setup steps are in README.md under "Lead form".
 */

const SHEET_NAME = 'Leads';   // the tab answers go to (created if it doesn't exist)
const NOTIFY_EMAIL = '';      // optional: an address that gets an email for every new lead, e.g. 'admissions@tomujin.edu.mn'

function doPost(e) {
  const p = (e && e.parameter) || {};

  // Hidden "website" field: people never see it, spam bots fill it in
  if (p.website) return json({ ok: true });

  const phone = clean(p.phone, 20);
  const school = clean(p.school, 120);
  const grade = clean(p.grade, 20);
  if (!phone || !school || !grade) return json({ ok: false, error: 'missing' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Огноо', 'Утасны дугаар', 'Одоо сурч буй сургууль', 'Анги', 'Хуудас']);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([new Date(), phone, school, grade, clean(p.page, 200)]);
  } finally {
    lock.releaseLock();
  }

  if (NOTIFY_EMAIL) {
    MailApp.sendEmail(NOTIFY_EMAIL, 'Вэбсайтаас шинэ хүсэлт',
      'Утасны дугаар: ' + phone + '\nОдоо сурч буй сургууль: ' + school + '\nАнги: ' + grade);
  }
  return json({ ok: true });
}

// Trims and shortens an answer; a leading = + - @ gets a ' so the sheet shows it as text, not a formula
function clean(value, max) {
  const v = String(value || '').trim().slice(0, max);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
