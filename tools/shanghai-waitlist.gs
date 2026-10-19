/**
 * Shanghai trip waitlist (tomujin.edu.mn/shanghai-trip) → "Shanghai Trip 2026 — Waitlist Responses" Google Sheet.
 *
 * Setup (once):
 *   1. Open the sheet → Extensions → Apps Script. Delete what's there and paste this whole file. Save.
 *   2. Deploy → New deployment → type "Web app".
 *        Execute as: Me      Who has access: Anyone
 *      Click Deploy, allow access, and copy the "Web app URL" (ends in /exec).
 *   3. Put that URL in WAITLIST_URL near the bottom of shanghai-trip/index.html.
 *
 * Changing this script later: Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy.
 * That keeps the same URL. A *new* deployment gets a new URL and the page would need updating.
 */

const SHEET_NAME = '';   // leave empty to use the first tab

function doPost(e) {
  const p = (e && e.parameter) || {};

  // Hidden "website" field: people never see it, spam bots fill it in
  if (p.website) return json({ ok: true });

  const name = clean(p.fullName, 120);
  const studentId = clean(p.studentId, 40);
  const why = clean(p.why, 3000);
  const prep = clean(p.prep, 3000);
  const signature = clean(p.signature, 120);
  if (!name || !studentId || !why || !prep || !signature) return json({ ok: false, error: 'missing' });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
    if (!sheet) return json({ ok: false, error: 'no sheet' });
    sheet.appendRow([new Date(), name, studentId, why, prep, signature, 'tomujin.edu.mn/shanghai-trip']);
    sheet.getRange(sheet.getLastRow(), 3).setNumberFormat('@').setValue(studentId.replace(/^'/, ''));
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  return json({ ok: true });
}

// Lets you open the /exec URL in a browser to check the deployment is live
function doGet() {
  return json({ ok: true, form: 'shanghai-trip-waitlist' });
}

// Trims and shortens an answer; a leading = + - @ gets a ' so the sheet shows it as text, not a formula
function clean(value, max) {
  const v = String(value || '').trim().slice(0, max);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
