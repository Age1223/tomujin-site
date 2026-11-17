/**
 * Event sign-ups (tomujin.edu.mn/events and talk pages such as /tsasanjin-talk) → a Google Sheet.
 *
 * Every form on those pages sends here: registering for one event, "Дараагийнхыг мэдэх" on a past one,
 * the pop-up, and the sign-up section at the bottom of each page. One row per person per sign-up: if the
 * same person signs up for the same thing again, their existing row is updated instead of adding another.
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

  let known = false;
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
    const gradeValue = isNaN(gradeNumber) ? grade : gradeNumber;
    const interest = clean(p.interest, 60), eventId = clean(p.eventId, 80);

    // Already on the sheet for anything at all? Talk pages then say "you're already registered"
    known = isKnownPerson(sheet, email, phone, name);

    // Same person signing up for the same thing again: update their row instead of adding a second one
    const row = findSameSignup(sheet, email, phone, name, interest, eventId);
    if (row) {
      sheet.getRange(row, 2, 1, 4).setValues([[name, phone, email, school]]);
      sheet.getRange(row, 6).setValue(gradeValue);
    } else {
      sheet.appendRow([new Date(), name, phone, email, school, gradeValue,
        interest, clean(p.eventTitle, 200), eventId, clean(p.page, 120)]);
    }
    // Phone as text, so leading zeros and +976 stay as typed
    sheet.getRange(row || sheet.getLastRow(), 3).setNumberFormat('@').setValue(phone.replace(/^'/, ''));
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  return json({ ok: true, known: known });
}

/* True if the same person (same rule as below) has any earlier sign-up, whatever it was for */
function isKnownPerson(sheet, email, phone, name) {
  if (sheet.getLastRow() < 2) return false;
  const rows = sheet.getRange(2, 2, sheet.getLastRow() - 1, 3).getValues();   // name, phone, email
  const e = email.toLowerCase(), ph = digits(phone), nm = plainName(name);
  return rows.some(function (r) {
    return String(r[2]).trim().toLowerCase() === e || (ph && digits(r[1]) === ph && plainName(r[0]) === nm);
  });
}

/* The row number of an earlier sign-up by the same person for the same thing (same "Юунд" and event), or 0.
   Same person = same email, or same phone and same name (siblings can share a parent's phone). */
function findSameSignup(sheet, email, phone, name, interest, eventId) {
  if (sheet.getLastRow() < 2) return 0;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues();
  const e = email.toLowerCase(), ph = digits(phone), nm = plainName(name);
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    if (String(r[6]).trim() !== interest || String(r[8]).trim() !== eventId) continue;
    if (String(r[3]).trim().toLowerCase() === e || (ph && digits(r[2]) === ph && plainName(r[1]) === nm)) return i + 2;
  }
  return 0;
}
function digits(v) { return String(v || '').replace(/\D/g, '').replace(/^976(?=\d{8}$)/, ''); }
function plainName(v) { return String(v || '').toLowerCase().replace(/[^\p{L}]/gu, ''); }

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
