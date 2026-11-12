/**
 * Event sign-ups (tomujin.edu.mn/events and talk pages such as /tsasanjin-talk) → a Google Sheet.
 *
 * Every form on those pages sends here: registering for one event, "Дараагийнхыг мэдэх" on a past one,
 * the pop-up, and the sign-up section at the bottom of each page. One row per sign-up.
 *
 * Setup (once):
 *   1. Make a new Google Sheet, e.g. "Tomujin — Event sign-ups". Extensions → Apps Script.
 *      Delete what's there, paste this whole file, Save.
 *   2. Deploy → New deployment → type "Web app".   Execute as: Me    Who has access: Anyone
 *      Click Deploy, allow access, copy the "Web app URL" (ends in /exec).
 *   3. Paste that URL into SIGNUP_URL at the top of events/events.js.
 *   The script writes the header row itself the first time.
 *
 * Changing this script later: Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy.
 * That keeps the same URL. A *new* deployment gets a new URL and events.js would need updating.
 */

const SHEET_NAME = 'Sign-ups';   // created if missing
const HEADERS = ['Огноо', 'Овог нэр', 'Утасны дугаар', 'Имэйл', 'Одоогийн сургууль', 'Анги',
                 'Юунд', 'Эвент', 'Эвентийн id', 'Хуудас'];

function doPost(e) {
  const p = (e && e.parameter) || {};

  // Hidden "website" field: people never see it, spam bots fill it in
  if (p.website) return json({ ok: true });

  const name = clean(p.name, 120);
  const phone = clean(p.phone, 20);
  const email = clean(p.email, 160);
  const school = clean(p.school, 120);
  const grade = clean(p.grade, 20);
  if (!name || !phone || !email || !school || !grade) return json({ ok: false, error: 'missing' });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    const gradeNumber = parseInt(grade, 10);
    sheet.appendRow([new Date(), name, phone, email, school, isNaN(gradeNumber) ? grade : gradeNumber,
      clean(p.interest, 60), clean(p.eventTitle, 200), clean(p.eventId, 80), clean(p.page, 120)]);
    // Phone as text, so leading zeros and +976 stay as typed
    sheet.getRange(sheet.getLastRow(), 3).setNumberFormat('@').setValue(phone.replace(/^'/, ''));
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  return json({ ok: true });
}

// Lets you open the /exec URL in a browser to check the deployment is live
function doGet() {
  return json({ ok: true, form: 'event-signups' });
}

// Trims and shortens an answer; a leading = + - @ gets a ' so the sheet shows it as text, not a formula
function clean(value, max) {
  const v = String(value || '').trim().slice(0, max);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
