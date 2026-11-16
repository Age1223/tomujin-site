/**
 * Event follow-up emails, sent from admin@tomujin.edu.mn to the people in the "Sign-ups" tab.
 *
 * Four emails, all in the Tomujin design (purple, golden button, Raleway / Google Sans):
 *   details      "Та бүртгүүллээ!": sent soon after someone registers for an event (Юунд = Бүртгүүлсэн).
 *                Date, time, where (join link for online, address + map for in-person), what to prepare.
 *   reminder     Same details again, REMINDER_HOURS before the event starts, with the join link.
 *   subscribed   "Бүртгэл баталгаажлаа": sent once to everyone who asked to hear about future events
 *                (every other sign-up: Дараагийнхыг мэдэх, Мэдээлэл авах, Ярилцлага унших, the pop-up…),
 *                with the list of upcoming events.
 *   invitation   When a new event appears on tomujin.edu.mn/events, every subscriber gets an invitation
 *                (unless they already registered for it or are on the "Unsubscribed" tab).
 *
 * Where the information comes from
 *   - The events themselves (title, date, time, online / in-person, place, speaker, poster) are read from the
 *     live site, https://tomujin.edu.mn/events/data.js. Add an event there as usual and push to main.
 *   - What the website must not show publicly (the Zoom/Meet link, the exact address and map, what to
 *     prepare, an extra note) goes in the "Event emails" tab, one row per event. The script adds the rows
 *     itself; you fill in the columns.
 *   - Every email sent is written to the "Email log" tab. That's how it never sends the same email twice.
 *
 * Setup (once): see tools/EVENTS-FOLLOWUP.md. In short: add this file to the Apps Script project of the
 * "TAS Master Leads 2026" sheet (Extensions → Apps Script → + → Script, name it events-followup), reload the
 * sheet, and as admin@tomujin.edu.mn use the "Эвентийн имэйл" menu: Тохиргоо → Туршилт → Автомат асаах.
 *
 * Adding this file does not change the sign-up form: the web app keeps running its deployed version.
 */

/* ───────── Settings ───────── */
const EE_SENDER = 'admin@tomujin.edu.mn';
const EE_SENDER_NAME = 'Томүжин Алтернатив сургууль';
const EE_DATA_URL = 'https://tomujin.edu.mn/events/data.js';
const EE_SITE = 'https://tomujin.edu.mn';
const EE_REMINDER_HOURS = 3;          // reminder goes out this many hours before the start
const EE_MIN_INVITE_HOURS = 6;        // don't send invitations for an event that starts sooner than this
const EE_NEW_EVENT_AUTO = true;       // new rows in "Event emails" start with both checkboxes ticked
const EE_MAX_PER_RUN = 80;            // emails per run (the trigger runs every 10 minutes)

const EE_SIGNUPS = 'Sign-ups';
const EE_EVENTS = 'Event emails';
const EE_LOG = 'Email log';
const EE_UNSUB = 'Unsubscribed';
const EE_REGISTERED = 'Бүртгүүлсэн';  // the "Юунд" value for someone registered for one event

const EE_COLS = {
  id: 'Эвентийн id', title: 'Эвент', date: 'Огноо, цаг', format: 'Хэлбэр',
  link: 'Нэгдэх холбоос (онлайн)', address: 'Хаяг (биечлэн)', map: 'Газрын зургийн холбоос',
  prepare: 'Бэлдэх зүйлс (мөр бүр нэг зүйл)', note: 'Нэмэлт мэдээлэл',
  autoDetails: 'Бүртгүүлсэнд дэлгэрэнгүй + сануулга', autoInvite: 'Захиалагчдад урилга', status: 'Төлөв'
};
const EE_EVENT_HEADERS = Object.keys(EE_COLS).map(k => EE_COLS[k]);
const EE_LOG_HEADERS = ['Огноо', 'Төрөл', 'Эвентийн id', 'Имэйл', 'Нэр', 'Тэмдэглэл'];

/* ───────── Menu ───────── */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Эвентийн имэйл')
    .addItem('1. Тохиргоо хийх (эхний удаа)', 'setupEventEmails')
    .addItem('Эвентүүдийг сайтаас шинэчлэх', 'syncEventsNow')
    .addSeparator()
    .addItem('Туршилтын имэйлүүдийг надад илгээх', 'sendTestEmailsToMe')
    .addItem('Хүлээгдэж буй имэйлүүдийг одоо илгээх…', 'sendPendingNow')
    .addItem('Нэг эвентийн сануулгыг одоо илгээх…', 'sendReminderNow')
    .addItem('Нэг эвентийн урилгыг захиалагчдад илгээх…', 'sendInvitationNow')
    .addSeparator()
    .addItem('Google Form-ын бүртгэлийг оруулах…', 'importFormRegistrations')
    .addItem('Google Form-ыг автоматаар шалгахыг зогсоох…', 'stopFormSync')
    .addItem('Давхардсан бүртгэлийг арилгах…', 'removeDuplicateSignups')
    .addSeparator()
    .addItem('Автомат илгээлтийг асаах (10 мин тутам)', 'turnOnAutoEmails')
    .addItem('Автомат илгээлтийг унтраах', 'turnOffAutoEmails')
    .addToUi();
}

function setupEventEmails() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  eeSheet_(ss, EE_LOG, EE_LOG_HEADERS);
  const unsub = eeSheet_(ss, EE_UNSUB, ['Имэйл', 'Огноо', 'Тайлбар']);
  unsub.setColumnWidth(1, 260);
  const events = eeLoadEvents_(true);
  const n = eeSyncEventsSheet_(ss, events);
  const pending = eePlan_(ss, events, Date.now());
  SpreadsheetApp.getUi().alert('Бэлэн боллоо',
    'Сайтаас ' + events.length + ' эвент уншлаа ("' + EE_EVENTS + '" табд ' + n + ' мөр).\n\n' +
    'Одоо:\n' +
    '• "' + EE_EVENTS + '" табд онлайн эвентийн нэгдэх холбоос, биечлэн эвентийн хаяг, бэлдэх зүйлсийг бөглөнө.\n' +
    '• Автоматаар явуулахыг хүсэхгүй эвентийн чагтыг авна.\n' +
    '• "Туршилтын имэйлүүдийг надад илгээх"-ээр харж шалгана.\n\n' +
    'Яг одоо асаавал илгээгдэх имэйл: ' + eeSummary_(pending), SpreadsheetApp.getUi().ButtonSet.OK);
}

function syncEventsNow() {
  const n = eeSyncEventsSheet_(SpreadsheetApp.getActiveSpreadsheet(), eeLoadEvents_(true));
  SpreadsheetApp.getActiveSpreadsheet().toast(n + ' эвент шинэчлэгдлээ', 'Эвентийн имэйл');
}

/* Sends one of each email, for the next upcoming event, to whoever is signed in. Logs nothing. */
function sendTestEmailsToMe() {
  const ui = SpreadsheetApp.getUi();
  const me = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const events = eeLoadEvents_(true);
  eeSyncEventsSheet_(ss, events);
  const info = eeEventInfo_(ss);
  const now = Date.now();
  const upcoming = eeUpcoming_(events, now);
  const ev = upcoming[0] || events.slice().sort((a, b) => eeStart_(b) - eeStart_(a))[0];
  if (!ev) { ui.alert('data.js-д эвент алга.'); return; }
  const person = { name: 'Туршилт Хэрэглэгч', email: me };
  const mails = [
    eeRenderDetails_(ev, info[ev.id] || {}, person, false, now),
    eeRenderDetails_(ev, info[ev.id] || {}, person, true, now),
    eeRenderSubscribed_(person, upcoming.map(e => ({ ev: e, info: info[e.id] || {} })), now),
    eeRenderInvitation_(ev, info[ev.id] || {}, person, now)
  ];
  mails.forEach(m => eeSend_(me, '[ТУРШИЛТ] ' + m.subject, m, true));
  ui.alert('4 туршилтын имэйлийг ' + me + ' руу илгээлээ ("' + ev.title + '" эвентээр).');
}

function sendPendingNow() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const events = eeLoadEvents_(true);
  eeSyncForms_(ss, events);
  eeSyncEventsSheet_(ss, events);
  const jobs = eePlan_(ss, events, Date.now());
  if (!jobs.length) { ui.alert('Илгээх имэйл алга. "' + EE_EVENTS + '" табд эвентийн чагт тэмдэглэгдсэн эсэхийг шалгана уу.'); return; }
  if (ui.alert('Одоо илгээх үү?', eeSummary_(jobs), ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  const sent = eeRun_(ss, events, jobs);
  ui.alert(sent + ' имэйл илгээлээ.' + (sent < jobs.length ? ' Үлдсэнийг дараагийн удаа илгээнэ.' : ''));
}

/* The reminder (with the join link / address) to everyone registered for one event, now, even if it's
   earlier than EE_REMINDER_HOURS. People who already got the reminder don't get it again. */
function sendReminderNow() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const events = eeLoadEvents_(true);
  eeSyncEventsSheet_(ss, events);
  const upcoming = eeUpcoming_(events, Date.now());
  if (!upcoming.length) { ui.alert('Удахгүй болох эвент алга.'); return; }
  const list = upcoming.map((e, i) => (i + 1) + '. ' + e.title + ' (' + eeWhen_(e).short + ')').join('\n');
  const r = ui.prompt('Аль эвентийн сануулгыг илгээх вэ?', list + '\n\nДугаарыг бичнэ үү:', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const ev = upcoming[parseInt(r.getResponseText(), 10) - 1];
  if (!ev) { ui.alert('Ийм дугаартай эвент алга.'); return; }
  const info = eeEventInfo_(ss)[ev.id] || {};
  if (ev.format !== 'in-person' && !info.link) { ui.alert('"' + EE_EVENTS + '" табд энэ эвентийн нэгдэх холбоосыг эхлээд оруулна уу.'); return; }
  const log = eeLogKeys_(ss);
  const jobs = eeRegistrants_(ss).filter(p => p.eventId === ev.id && !log.has(eeKey_('reminder', ev.id, p.email)))
    .map(p => ({ kind: 'reminder', ev: ev, person: p }));
  if (!jobs.length) { ui.alert('Бүх бүртгүүлэгч сануулгаа авсан байна.'); return; }
  if (ui.alert('Илгээх үү?', jobs.length + ' хүнд "' + ev.title + '"-ийн сануулга илгээнэ.', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  ui.alert(eeRun_(ss, events, jobs) + ' имэйл илгээлээ.');
}

/* The invitation for one event, as its own email, to every subscriber who isn't registered for it and hasn't
   had it yet. People whose subscription confirmation only listed the event (log note "Баталгаажуулах имэйлд
   багтсан") get it too: that's for when the event was announced after they subscribed, or has news since. */
function sendInvitationNow() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const events = eeLoadEvents_(true);
  eeSyncEventsSheet_(ss, events);
  const now = Date.now();
  const open = eeUpcoming_(events, now).filter(e => eeIsOpen_(e, now));
  if (!open.length) { ui.alert('Бүртгэл нээлттэй эвент алга.'); return; }
  const list = open.map((e, i) => (i + 1) + '. ' + e.title + ' (' + eeWhen_(e).short + ')').join('\n');
  const r = ui.prompt('Аль эвентийн урилгыг илгээх вэ?', list + '\n\nДугаарыг бичнэ үү:', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const ev = open[parseInt(r.getResponseText(), 10) - 1];
  if (!ev) { ui.alert('Ийм дугаартай эвент алга.'); return; }

  const unsub = eeUnsubscribed_(ss);
  const registered = new Set(eeRegistrants_(ss).filter(p => p.eventId === ev.id).map(p => p.email));
  const invited = new Set();
  eeRows_(ss.getSheetByName(EE_LOG)).rows.forEach(row => {
    const note = String(row[5] || '');
    if (String(row[1]) === 'invitation' && String(row[2]) === ev.id && !note) invited.add(eeEmail_(row[3]));
  });
  const jobs = eeSubscribers_(ss).filter(p => !unsub.has(p.email) && !registered.has(p.email) && !invited.has(p.email))
    .map(p => ({ kind: 'invitation', ev: ev, person: p }));
  if (!jobs.length) { ui.alert('Бүх захиалагч энэ урилгыг авсан эсвэл бүртгүүлсэн байна.'); return; }
  if (ui.alert('Илгээх үү?', jobs.length + ' захиалагчид "' + ev.title + '"-ийн урилга илгээнэ:\n' +
      jobs.map(j => '• ' + (j.person.name || j.person.email)).join('\n'), ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  ui.alert(eeRun_(ss, events, jobs) + ' имэйл илгээлээ.');
}

/* Copies registrations from an old Google Form's responses sheet into "Sign-ups" as registrations for one
   event, so they get the details and reminder emails like everyone else. Asks for: the responses sheet's
   link, the event, and the date the form started taking sign-ups for that event (when one form was reused
   for several events). People already registered for that event (same email or phone) are skipped, so
   running it twice is safe. The form's columns are found by their questions: Нэр, И-Мэйл / Email, Утас, Анги. */
const EE_FORM_DEFAULT = 'https://docs.google.com/spreadsheets/d/1RB9vLPrVCGiID1w-UljfxULbXnt-LTrwKPigTvNjvBM/edit';

function importFormRegistrations() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const events = eeLoadEvents_(true);
  const upcoming = eeUpcoming_(events, Date.now());
  if (!upcoming.length) { ui.alert('Удахгүй болох эвент алга.'); return; }

  let r = ui.prompt('1/3 · Google Form-ын хариултын хүснэгт', 'Хүснэгтийн холбоосыг оруулна уу (хоосон орхивол: "Tomujin is Talking бүртгэл (Responses)").', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const url = r.getResponseText().trim() || EE_FORM_DEFAULT;
  let src;
  try { src = SpreadsheetApp.openByUrl(url); } catch (e) { ui.alert('Хүснэгтийг нээж чадсангүй: ' + e.message); return; }

  const list = upcoming.map((e, i) => (i + 1) + '. ' + e.title + ' (' + eeWhen_(e).short + ')').join('\n');
  r = ui.prompt('2/3 · Аль эвентэд бүртгэх вэ?', list + '\n\nДугаарыг бичнэ үү:', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const ev = upcoming[parseInt(r.getResponseText(), 10) - 1];
  if (!ev) { ui.alert('Ийм дугаартай эвент алга.'); return; }

  r = ui.prompt('3/3 · Аль өдрөөс хойших хариулт вэ?', 'Энэ эвентийн бүртгэл эхэлсэн өдөр, жишээ нь 2026-11-10. Хоосон орхивол бүх хариултыг авна.', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const fromText = r.getResponseText().trim();
  let from = 0;
  if (fromText) {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(fromText);
    if (!m) { ui.alert('Огноог 2026-11-10 гэх мэтээр бичнэ үү.'); return; }
    from = Date.UTC(+m[1], m[2] - 1, +m[3]) - EE_TZ;   // midnight in Ulaanbaatar
  }

  const plan = eeFormRows_(src, ev, from, ss);
  if (plan.error) { ui.alert(plan.error); return; }
  const msg = '"' + ev.title + '"-д ' + plan.add.length + ' хүн нэмнэ.\n' +
    (plan.dup ? plan.dup + ' хүн аль хэдийн бүртгэлтэй тул алгасна.\n' : '') +
    (plan.bad.length ? 'Имэйлгүй тул алгасах: ' + plan.bad.join(', ') + '\n' : '') +
    '\nАвтомат илгээлт асаалттай бол 10 минутын дотор тэдэнд дэлгэрэнгүй мэдээлэл очно.';
  if (ui.alert('Оруулах уу?', msg, ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  const n = eeAppendSignups_(ss, ev, plan.add);

  // Keep checking the form: every 10-minute run adds its new answers, until the event is over
  const keep = ui.alert('Цаашид шалгах уу?', 'Энэ Google Form-оор шинээр бүртгүүлсэн хүмүүсийг 10 минут тутам автоматаар нэмж, ' +
    'имэйл илгээх үү? (Эвент дуусмагц өөрөө зогсоно.)', ui.ButtonSet.YES_NO) === ui.Button.YES;
  if (keep) {
    const links = eeFormLinks_().filter(l => !(l.url === url && l.eventId === ev.id));
    links.push({ url: url, eventId: ev.id, from: from });
    eeSaveFormLinks_(links);
  }
  ui.alert(n + ' хүнийг "' + EE_SIGNUPS + '" табд нэмлээ.' + (keep ? '\nШинэ бүртгэлийг 10 минут тутам нэмнэ (автомат илгээлт асаалттай үед).' : ''));
}

/* The Google Forms being watched: [{url, eventId, from}] */
function eeFormLinks_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('ee-form-links') || '[]'); } catch (e) { return []; }
}
function eeSaveFormLinks_(links) { PropertiesService.getScriptProperties().setProperty('ee-form-links', JSON.stringify(links)); }

/* Run by the 10-minute trigger: new answers on watched forms go into Sign-ups. Forms for events that are over are dropped. */
function eeSyncForms_(ss, events) {
  const now = Date.now();
  const links = eeFormLinks_();
  const keep = [];
  links.forEach(l => {
    const ev = events.filter(e => e.id === l.eventId)[0];
    if (!ev || eeIsPast_(ev, now)) return;
    keep.push(l);
    try {
      const plan = eeFormRows_(SpreadsheetApp.openByUrl(l.url), ev, l.from, ss);
      if (!plan.error) eeAppendSignups_(ss, ev, plan.add);
    } catch (err) {
      console.error('Google Form ' + l.url + ': ' + err.message);
    }
  });
  if (keep.length !== links.length) eeSaveFormLinks_(keep);
}

function stopFormSync() {
  const ui = SpreadsheetApp.getUi();
  const links = eeFormLinks_();
  if (!links.length) { ui.alert('Автоматаар шалгаж буй Google Form алга.'); return; }
  const list = links.map(l => '• ' + l.eventId + ' ← ' + l.url).join('\n');
  if (ui.alert('Зогсоох уу?', 'Одоо шалгаж буй:\n' + list + '\n\nБүгдийг зогсоох уу? (Аль хэдийн нэмсэн хүмүүс хэвээр үлдэнэ.)', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  eeSaveFormLinks_([]);
  ui.alert('Зогсоолоо.');
}

/* Finds people who signed up for the same thing more than once (same "Юунд" and event; same email, or same
   phone and same name) and keeps one row each: the one highest in the sheet, with any blank cells filled in from the later
   ones. The other rows are deleted. Emails already sent are in "Email log" and aren't affected. */
function removeDuplicateSignups() {
  const ui = SpreadsheetApp.getUi();
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(EE_SIGNUPS);
  const t = eeRows_(sh), h = t.head;
  const groups = eeDuplicateGroups_(t);
  if (!groups.length) { ui.alert('Давхардсан бүртгэл алга.'); return; }
  const list = groups.map(g => '• ' + (String(t.rows[g[0]][h['Овог нэр']]).trim() || '(нэргүй)') + ' · ' +
    (String(t.rows[g[0]][h['Эвентийн id']]).trim() || String(t.rows[g[0]][h['Юунд']]).trim()) + ' (' + g.length + ' мөр)').join('\n');
  const extra = groups.reduce((n, g) => n + g.length - 1, 0);
  if (ui.alert('Давхардлыг арилгах уу?', list + '\n\nХүн бүрт нэг мөр үлдэж, ' + extra + ' мөр устна.', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  const width = sh.getLastColumn();
  const del = [];
  groups.forEach(g => {
    const keep = t.rows[g[0]].slice(0, width);
    g.slice(1).forEach(i => {
      t.rows[i].slice(0, width).forEach((v, c) => { if (keep[c] === '' && v !== '') keep[c] = v; });
      del.push(i + 2);
    });
    sh.getRange(g[0] + 2, 1, 1, width).setValues([keep]);
  });
  del.sort((a, b) => b - a).forEach(r => sh.deleteRow(r));
  SpreadsheetApp.flush();
  ui.alert(extra + ' давхардсан мөрийг устгалаа.');
}

/* Groups of row indexes (into t.rows) that are the same person signing up for the same thing, in sheet order */
function eeDuplicateGroups_(t) {
  const h = t.head;
  const digits = v => String(v || '').replace(/\D/g, '').replace(/^976(?=\d{8}$)/, '');
  const plainName = v => String(v || '').toLowerCase().replace(/[^\p{L}]/gu, '');
  const groupOf = {}, groups = [];
  t.rows.forEach((r, i) => {
    const what = String(r[h['Юунд']]).trim() + '|' + String(r[h['Эвентийн id']]).trim();
    const e = eeEmail_(r[h['Имэйл']]), ph = digits(r[h['Утасны дугаар']]), nm = plainName(r[h['Овог нэр']]);
    const keys = [e && what + '|' + e, ph && nm && what + '|' + ph + '|' + nm].filter(Boolean);
    if (!keys.length) return;
    const found = keys.map(k => groupOf[k]).filter(g => g !== undefined)[0];
    const g = found !== undefined ? found : groups.push([]) - 1;
    groups[g].push(i);
    keys.forEach(k => groupOf[k] = g);
  });
  return groups.filter(g => g.length > 1);
}

function eeAppendSignups_(ss, ev, people) {
  if (!people.length) return 0;
  const sh = ss.getSheetByName(EE_SIGNUPS);
  const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const rows = people.map(p => head.map(h => ({
    'Огноо': p.date, 'Овог нэр': p.name, 'Утасны дугаар': p.phone, 'Имэйл': p.email, 'Одоогийн сургууль': '',
    'Анги': p.grade, 'Юунд': EE_REGISTERED, 'Эвент': ev.title, 'Эвентийн id': ev.id, 'Хуудас': 'Google Form'
  }[h] ?? '')));
  const start = sh.getLastRow() + 1;
  const phoneCol = head.indexOf('Утасны дугаар') + 1;
  if (phoneCol) sh.getRange(start, phoneCol, rows.length, 1).setNumberFormat('@');
  sh.getRange(start, 1, rows.length, head.length).setValues(rows);
  SpreadsheetApp.flush();
  return rows.length;
}

function eeFormRows_(src, ev, from, ss) {
  const sheet = src.getSheets().filter(s => s.getLastRow() > 1 && /timestamp|цаг/i.test(String(s.getRange(1, 1).getValue())))[0];
  if (!sheet) return { error: 'Хариултын таб олдсонгүй (эхний багана нь "Timestamp" байх ёстой).' };
  const values = sheet.getDataRange().getValues();
  const head = values[0].map(h => String(h).trim());
  const find = re => head.findIndex(h => re.test(h));
  const c = {
    date: 0, name: find(/^нэр|^name|овог/i), typed: find(/^(и-?мэйл|имэйл|e-?mail)(?!\s*address)/i),
    collected: find(/^email address$/i), phone: find(/утас|phone/i), grade: find(/^анги|grade/i)
  };
  if (c.typed < 0 && c.collected < 0) return { error: 'Имэйлийн багана олдсонгүй.' };

  // Who's already registered for this event
  const digits = v => String(v || '').replace(/\D/g, '').replace(/^976(?=\d{8}$)/, '');
  const known = new Set();
  const t = eeRows_(ss.getSheetByName(EE_SIGNUPS));
  t.rows.forEach(r => {
    if (String(r[t.head['Эвентийн id']]).trim() !== ev.id) return;
    const e = eeEmail_(r[t.head['Имэйл']]), p = digits(r[t.head['Утасны дугаар']]);
    if (e) known.add(e);
    if (p) known.add('tel:' + p);
  });

  const add = [], bad = [];
  let dup = 0;
  values.slice(1).forEach(r => {
    const date = r[c.date] instanceof Date ? r[c.date] : null;
    if (!date || date.getTime() < from) return;
    const typed = c.typed >= 0 ? eeEmail_(r[c.typed]) : '', collected = c.collected >= 0 ? eeEmail_(r[c.collected]) : '';
    const email = typed || collected;   // the address they typed for the link, else the one Google collected
    const name = c.name >= 0 ? String(r[c.name]).trim() : '';
    if (!email) { bad.push(name || '(нэргүй)'); return; }
    const phone = c.phone >= 0 ? String(r[c.phone]).trim() : '';
    const keys = [email, collected, phone && 'tel:' + digits(phone)].filter(Boolean);
    if (keys.some(k => known.has(k))) { dup++; return; }
    keys.forEach(k => known.add(k));
    const g = c.grade >= 0 ? parseInt(r[c.grade], 10) : NaN;
    add.push({ date: date, name: name, email: email, phone: phone, grade: isNaN(g) ? (c.grade >= 0 ? String(r[c.grade]) : '') : g });
  });
  return { add: add, dup: dup, bad: bad };
}

function turnOnAutoEmails() {
  eeCheckSender_();
  turnOffAutoEmails(true);
  ScriptApp.newTrigger('autoEmailsTick').timeBased().everyMinutes(10).create();
  SpreadsheetApp.getUi().alert('Асаалаа. 10 минут тутамд ' + Session.getEffectiveUser().getEmail() + '-ээс илгээнэ.');
}

function turnOffAutoEmails(quiet) {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'autoEmailsTick').forEach(t => ScriptApp.deleteTrigger(t));
  if (quiet !== true) SpreadsheetApp.getUi().alert('Автомат илгээлт унтарлаа.');
}

/* What the 10-minute trigger runs */
function autoEmailsTick() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const events = eeLoadEvents_(false);
    eeSyncForms_(ss, events);
    eeSyncEventsSheet_(ss, events);
    eeRun_(ss, events, eePlan_(ss, events, Date.now()));
  } finally {
    lock.releaseLock();
  }
}

/* ───────── What to send ───────── */
function eePlan_(ss, events, now) {
  const info = eeEventInfo_(ss);
  const log = eeLogKeys_(ss);
  const unsub = eeUnsubscribed_(ss);
  const byId = {};
  events.forEach(e => byId[e.id] = e);
  const jobs = [];

  // Registered for one event → details, then the reminder
  const regs = eeRegistrants_(ss);
  regs.forEach(p => {
    const ev = byId[p.eventId], inf = info[p.eventId];
    if (!ev || !inf || !inf.autoDetails || eeIsPast_(ev, now) || ev.tbc) return;
    const start = eeStart_(ev);
    const reminderTime = now >= start - EE_REMINDER_HOURS * 3600e3;
    const linkReady = ev.format === 'in-person' || !!inf.link;
    const hadDetails = log.has(eeKey_('details', ev.id, p.email)), hadReminder = log.has(eeKey_('reminder', ev.id, p.email));
    if (reminderTime && linkReady && !hadReminder && now < start + 15 * 60e3) jobs.push({ kind: 'reminder', ev: ev, person: p });
    else if (!hadDetails && !hadReminder && now < start) jobs.push({ kind: 'details', ev: ev, person: p });
  });

  // Everyone else asked to hear about future events
  const registeredFor = new Set(regs.map(p => eeKey_('', p.eventId, p.email)));
  const subs = eeSubscribers_(ss).filter(p => !unsub.has(p.email));
  const open = eeUpcoming_(events, now).filter(e => eeIsOpen_(e, now));
  subs.forEach(p => {
    if (!log.has(eeKey_('subscribed', '', p.email))) { jobs.push({ kind: 'subscribed', person: p }); return; }
    open.forEach(ev => {
      const inf = info[ev.id];
      if (!inf || !inf.autoInvite || eeStart_(ev) - now < EE_MIN_INVITE_HOURS * 3600e3) return;
      if (registeredFor.has(eeKey_('', ev.id, p.email)) || log.has(eeKey_('invitation', ev.id, p.email))) return;
      jobs.push({ kind: 'invitation', ev: ev, person: p });
    });
  });
  return jobs;
}

function eeRun_(ss, events, jobs) {
  if (!jobs.length) return 0;
  eeCheckSender_();
  const info = eeEventInfo_(ss);
  const now = Date.now(), started = Date.now();
  const upcoming = eeUpcoming_(events, now);
  const open = upcoming.filter(e => eeIsOpen_(e, now));
  const logSheet = eeSheet_(ss, EE_LOG, EE_LOG_HEADERS);
  const quota = MailApp.getRemainingDailyQuota();
  let sent = 0;
  for (const job of jobs) {
    if (sent >= EE_MAX_PER_RUN || sent >= quota - 5 || Date.now() - started > 4.5 * 60e3) break;
    const p = job.person, inf = job.ev ? (info[job.ev.id] || {}) : {};
    let mail, rows = [];
    if (job.kind === 'details' || job.kind === 'reminder') {
      mail = eeRenderDetails_(job.ev, inf, p, job.kind === 'reminder', now);
      rows.push([job.kind, job.ev.id, '']);
    } else if (job.kind === 'invitation') {
      mail = eeRenderInvitation_(job.ev, inf, p, now);
      rows.push(['invitation', job.ev.id, '']);
    } else {
      mail = eeRenderSubscribed_(p, upcoming.map(e => ({ ev: e, info: info[e.id] || {} })), now);
      rows.push(['subscribed', '', '']);
      // The confirmation already lists the open events, so no separate invitation for those
      open.forEach(e => rows.push(['invitation', e.id, 'Баталгаажуулах имэйлд багтсан']));
    }
    try {
      eeSend_(p.email, mail.subject, mail, false);
      sent++;
    } catch (err) {
      rows = [[job.kind, job.ev ? job.ev.id : '', 'АЛДАА: ' + err.message]];
    }
    rows.forEach(r => logSheet.appendRow([new Date(), r[0], r[1], p.email, p.name, r[2]]));
  }
  SpreadsheetApp.flush();
  return sent;
}

function eeSummary_(jobs) {
  const c = { details: 0, reminder: 0, subscribed: 0, invitation: 0 };
  jobs.forEach(j => c[j.kind]++);
  return jobs.length + ' имэйл — дэлгэрэнгүй: ' + c.details + ', сануулга: ' + c.reminder +
    ', захиалга баталгаажуулах: ' + c.subscribed + ', урилга: ' + c.invitation;
}

/* ───────── Sending ───────── */
function eeCheckSender_() {
  const me = Session.getEffectiveUser().getEmail().toLowerCase();
  if (me === EE_SENDER) return;
  if (GmailApp.getAliases().map(a => a.toLowerCase()).indexOf(EE_SENDER) >= 0) return;
  throw new Error('Имэйлийг ' + EE_SENDER + '-ээс илгээхийн тулд энэ хүснэгтийг ' + EE_SENDER +
    ' бүртгэлээр нээж ажиллуулна уу (одоо: ' + me + ').');
}

function eeSend_(to, subject, mail, test) {
  const opts = { htmlBody: mail.html, name: EE_SENDER_NAME, replyTo: EE_SENDER };
  const me = Session.getEffectiveUser().getEmail().toLowerCase();
  if (me !== EE_SENDER && GmailApp.getAliases().map(a => a.toLowerCase()).indexOf(EE_SENDER) >= 0) opts.from = EE_SENDER;
  else if (me !== EE_SENDER && !test) throw new Error('not ' + EE_SENDER);
  GmailApp.sendEmail(to, subject, mail.text, opts);
}

/* ───────── Reading the sheet ───────── */
function eeSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function eeRows_(sh) {
  if (!sh || sh.getLastRow() < 2) return { head: {}, rows: [] };
  const values = sh.getDataRange().getValues();
  const head = {};
  values[0].forEach((h, i) => head[String(h).trim()] = i);
  return { head: head, rows: values.slice(1) };
}

function eeEmail_(v) {
  const e = String(v || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) ? e : '';
}

function eeSignups_(ss) {
  const t = eeRows_(ss.getSheetByName(EE_SIGNUPS));
  const h = t.head;
  return t.rows.map(r => ({
    name: String(r[h['Овог нэр']] || '').trim(), email: eeEmail_(r[h['Имэйл']]),
    interest: String(r[h['Юунд']] || '').trim(), eventId: String(r[h['Эвентийн id']] || '').trim()
  })).filter(p => p.email);
}

/* One per (event, email) */
function eeRegistrants_(ss) {
  const seen = new Set();
  return eeSignups_(ss).filter(p => p.interest === EE_REGISTERED && p.eventId).filter(p => {
    const k = eeKey_('', p.eventId, p.email);
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
}

/* One per email; everyone whose sign-up wasn't a registration for one event */
function eeSubscribers_(ss) {
  const seen = new Set();
  return eeSignups_(ss).filter(p => p.interest !== EE_REGISTERED).filter(p => {
    if (seen.has(p.email)) return false;
    seen.add(p.email); return true;
  });
}

function eeUnsubscribed_(ss) {
  const sh = ss.getSheetByName(EE_UNSUB);
  if (!sh || sh.getLastRow() < 2) return new Set();
  return new Set(sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map(r => eeEmail_(r[0])).filter(Boolean));
}

function eeKey_(kind, eventId, email) { return kind + '|' + eventId + '|' + email; }

function eeLogKeys_(ss) {
  const t = eeRows_(ss.getSheetByName(EE_LOG));
  const keys = new Set();
  t.rows.forEach(r => {
    if (String(r[5] || '').indexOf('АЛДАА') === 0) return;   // failed sends are tried again
    keys.add(eeKey_(String(r[1]), String(r[2]), eeEmail_(r[3])));
  });
  return keys;
}

function eeEventInfo_(ss) {
  const t = eeRows_(ss.getSheetByName(EE_EVENTS));
  const h = t.head, out = {};
  const get = (r, k) => (h[EE_COLS[k]] === undefined ? '' : r[h[EE_COLS[k]]]);
  t.rows.forEach(r => {
    const id = String(get(r, 'id')).trim();
    if (!id) return;
    out[id] = {
      link: String(get(r, 'link')).trim(), address: String(get(r, 'address')).trim(), map: String(get(r, 'map')).trim(),
      prepare: String(get(r, 'prepare')).split(/\n+/).map(s => s.replace(/^[\s•\-–*]+/, '').trim()).filter(Boolean),
      note: String(get(r, 'note')).trim(),
      autoDetails: get(r, 'autoDetails') === true, autoInvite: get(r, 'autoInvite') === true
    };
  });
  return out;
}

/* Keeps one row per event in "Event emails": adds new events, refreshes title / date / format, writes a status */
function eeSyncEventsSheet_(ss, events) {
  const sh = eeSheet_(ss, EE_EVENTS, EE_EVENT_HEADERS);
  if (sh.getMaxColumns() >= EE_EVENT_HEADERS.length && !sh.getRange(1, 5).getNote()) {
    sh.getRange(1, 5).setNote('Zoom / Google Meet холбоос. Сайт дээр харагдахгүй, зөвхөн бүртгүүлсэн хүмүүст имэйлээр очно.');
    sh.setColumnWidths(1, 4, 170); sh.setColumnWidths(5, 4, 240); sh.setColumnWidth(9, 240); sh.setColumnWidth(12, 320);
  }
  const t = eeRows_(sh);
  const h = t.head, col = k => h[EE_COLS[k]] + 1;
  const rowOf = {};
  t.rows.forEach((r, i) => rowOf[String(r[h[EE_COLS.id]]).trim()] = i + 2);
  const now = Date.now();
  const regs = eeRegistrants_(ss);
  const info = eeEventInfo_(ss);
  events.forEach(ev => {
    let row = rowOf[ev.id];
    if (!row) {
      row = sh.getLastRow() + 1;
      sh.getRange(row, col('id')).setValue(ev.id);
      sh.getRange(row, col('autoDetails')).insertCheckboxes().setValue(EE_NEW_EVENT_AUTO);
      sh.getRange(row, col('autoInvite')).insertCheckboxes().setValue(EE_NEW_EVENT_AUTO);
      rowOf[ev.id] = row;
    }
    const w = eeWhen_(ev);
    sh.getRange(row, col('title')).setValue(ev.title);
    sh.getRange(row, col('date')).setValue(w.short + ' ' + w.time + (ev.tbc ? ' (урьдчилсан)' : ''));
    sh.getRange(row, col('format')).setValue(EE_FORMATS[ev.format] || ev.format || '');
    const inf = info[ev.id] || {};
    const n = regs.filter(p => p.eventId === ev.id).length;
    let status = eeIsPast_(ev, now) ? 'Дууссан' : ev.tbc ? 'Огноо батлагдаагүй — имэйл явахгүй' : ev.closed ? 'Бүртгэл хаагдсан' : 'Удахгүй';
    if (!eeIsPast_(ev, now)) {
      status += ' · бүртгүүлсэн ' + n;
      if (ev.format !== 'in-person' && !inf.link) status += ' · ⚠ нэгдэх холбоос алга: сануулга явахгүй';
      if (ev.format !== 'online' && !inf.address && !ev.place) status += ' · ⚠ хаяг алга';
    }
    sh.getRange(row, col('status')).setValue(status);
  });
  return events.length;
}

/* ───────── Events from the website ───────── */
const EE_TZ = 8 * 3600e3;   // Ulaanbaatar, UTC+8 all year
const EE_WEEKDAYS = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];
const EE_FORMATS = { 'in-person': 'Биечлэн', 'online': 'Онлайн', 'hybrid': 'Биечлэн + онлайн' };

/* Runs the site's events/data.js (it only sets window.EVENTS and window.EVENT_TYPES) and returns the events */
function eeLoadEvents_(fresh) {
  const cache = CacheService.getScriptCache();
  let src = fresh ? null : cache.get('ee-data-js');
  if (!src) {
    const res = UrlFetchApp.fetch(EE_DATA_URL + '?t=' + Date.now(), { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error(EE_DATA_URL + ' уншиж чадсангүй (' + res.getResponseCode() + ')');
    src = res.getContentText();
    try { cache.put('ee-data-js', src, 600); } catch (e) { /* too big to cache: fine */ }
  }
  return eeParseEvents_(src);
}

function eeParseEvents_(src) {
  const win = {};
  new Function('window', src)(win);
  const types = win.EVENT_TYPES || {};
  return (win.EVENTS || []).filter(e => e && e.id && /^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(e.start))
    .map(e => Object.assign({ typeName: types[e.type] || '' }, e));
}

function eeStart_(ev) {
  const m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/.exec(ev.start);
  return Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5]) - EE_TZ;
}
function eeEnd_(ev) { return eeStart_(ev) + (ev.minutes || 60) * 60e3; }
function eeIsPast_(ev, now) { return now > eeEnd_(ev); }
function eeIsOpen_(ev, now) { return !eeIsPast_(ev, now) && !ev.closed && !ev.tbc; }
function eeUpcoming_(events, now) { return events.filter(e => !eeIsPast_(e, now)).sort((a, b) => eeStart_(a) - eeStart_(b)); }
function eePad_(n) { return (n < 10 ? '0' : '') + n; }

function eeWhen_(ev) {
  const d = new Date(eeStart_(ev) + EE_TZ), e = new Date(eeEnd_(ev) + EE_TZ);
  const t = x => eePad_(x.getUTCHours()) + ':' + eePad_(x.getUTCMinutes());
  return {
    long: (d.getUTCMonth() + 1) + '-р сарын ' + d.getUTCDate() + ', ' + EE_WEEKDAYS[d.getUTCDay()] + ' гараг',
    short: d.getUTCFullYear() + '.' + eePad_(d.getUTCMonth() + 1) + '.' + eePad_(d.getUTCDate()),
    time: t(d), range: t(d) + '–' + t(e), weekday: EE_WEEKDAYS[d.getUTCDay()],
    dayKey: d.getUTCFullYear() * 1e4 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate()
  };
}

/* "Өнөөдөр", "Маргааш" or the date, for subject lines */
function eeRelDay_(ev, now) {
  const today = new Date(now + EE_TZ), tomorrow = new Date(now + EE_TZ + 864e5);
  const k = x => x.getUTCFullYear() * 1e4 + (x.getUTCMonth() + 1) * 100 + x.getUTCDate();
  const w = eeWhen_(ev);
  return w.dayKey === k(today) ? 'Өнөөдөр' : w.dayKey === k(tomorrow) ? 'Маргааш' : w.long;
}

function eeCalendarUrl_(ev, inf) {
  const z = ms => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const where = ev.format === 'in-person' ? (inf.address || ev.place || '') : (inf.link || ev.place || '');
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(ev.title + ' · Томүжин') +
    '&dates=' + z(eeStart_(ev)) + '/' + z(eeEnd_(ev)) + '&location=' + encodeURIComponent(where) +
    '&details=' + encodeURIComponent((ev.summary || '') + '\n\n' + EE_SITE + '/events');
}

function eeAbs_(path) { return !path ? '' : /^https?:/.test(path) ? path : EE_SITE + (path.charAt(0) === '/' ? '' : '/') + path; }
/* The name as they typed it ("Овог нэр" order varies too much to pick out the given name safely) */
function eeFirstName_(name) { return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 60); }

/* ───────── Email design (Tomujin design system, as inline-styled tables for email clients) ───────── */
const EE_C = {
  purple: '#5c1090', purpleDeep: '#4a0d75', golden: '#f2cd30', goldenBorder: '#d9b51f', ink: '#1c1c1c',
  page: '#f7f0ff', card: '#ffffff', soft: '#faf7ff', border: '#e5d8f5', muted: '#6e5e8a', teal: '#0e7490'
};
const EE_FONT = "'Google Sans','Raleway',Roboto,'Helvetica Neue',Arial,sans-serif";

function eeEsc_(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function eeButton_(href, label, kind) {
  const gold = kind !== 'outline';
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate"><tr>' +
    '<td align="center" bgcolor="' + (gold ? EE_C.golden : EE_C.card) + '" style="border-radius:10px;border:1px solid ' + (gold ? EE_C.goldenBorder : EE_C.border) + '">' +
    '<a href="' + eeEsc_(href) + '" target="_blank" style="display:inline-block;padding:14px 26px;font:700 16px/1 ' + EE_FONT + ';color:' + (gold ? EE_C.ink : EE_C.purple) + ';text-decoration:none;border-radius:10px">' +
    eeEsc_(label) + '</a></td></tr></table>';
}

/* Label / value rows inside the soft violet card */
function eeFacts_(rows) {
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + EE_C.soft + '" style="background:' + EE_C.soft + ';border:1px solid ' + EE_C.border + ';border-radius:16px;border-collapse:separate">' +
    rows.map((r, i) => '<tr><td style="padding:' + (i ? '14px' : '20px') + ' 22px ' + (i === rows.length - 1 ? '20px' : '0') + ' 22px;font-family:' + EE_FONT + '">' +
      '<div style="font-size:11px;line-height:16px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:' + EE_C.muted + '">' + eeEsc_(r[0]) + '</div>' +
      '<div style="font-size:16px;line-height:24px;font-weight:600;color:' + EE_C.ink + ';margin-top:2px">' + r[1] + '</div></td></tr>').join('') +
    '</table>';
}

function eeH2_(text) {
  return '<div style="font:800 13px/18px ' + EE_FONT + ';letter-spacing:.12em;text-transform:uppercase;color:' + EE_C.purple + ';margin:0 0 10px">' + eeEsc_(text) + '</div>';
}
function eeP_(html, extra) {
  return '<p style="margin:0 0 16px;font:400 16px/26px ' + EE_FONT + ';color:' + EE_C.ink + ';' + (extra || '') + '">' + html + '</p>';
}
function eeList_(items) {
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px">' + items.map(t =>
    '<tr><td valign="top" style="padding:3px 12px 3px 0"><div style="width:8px;height:8px;margin-top:6px;border-radius:2px;background:' + EE_C.golden + '"></div></td>' +
    '<td style="padding:3px 0;font:400 16px/24px ' + EE_FONT + ';color:' + EE_C.ink + '">' + eeEsc_(t) + '</td></tr>').join('') + '</table>';
}

/* The page around every email: logo, purple band with the title, white card, footer */
function eeLayout_(o) {
  const year = new Date().getFullYear();
  return '<!doctype html><html lang="mn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light">' +
    '<title>' + eeEsc_(o.subject) + '</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700;800;900&display=swap" rel="stylesheet">' +
    '<style>@media (max-width:620px){.ee-pad{padding-left:20px!important;padding-right:20px!important}.ee-h1{font-size:28px!important;line-height:30px!important}}</style>' +
    '</head><body style="margin:0;padding:0;background:' + EE_C.page + '">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">' + eeEsc_(o.preheader || '') + '&#8199;&#847;'.repeat(40) + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + EE_C.page + '" style="background:' + EE_C.page + '"><tr><td align="center" style="padding:28px 12px 40px">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">' +
      // Logo
      '<tr><td align="center" style="padding:4px 0 22px"><a href="' + EE_SITE + '" target="_blank"><img src="' + EE_SITE + '/assets/logo-lockup.png" width="168" height="51" alt="Томүжин Алтернатив сургууль" style="display:block;border:0;width:168px;height:auto"></a></td></tr>' +
      // Purple band
      '<tr><td class="ee-pad" bgcolor="' + EE_C.purple + '" style="background:' + EE_C.purple + ';border-radius:16px 16px 0 0;padding:36px 40px 34px;font-family:' + EE_FONT + '">' +
        (o.eyebrow ? '<div style="font-size:12px;line-height:16px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:' + EE_C.golden + ';margin-bottom:12px">' + eeEsc_(o.eyebrow) + '</div>' : '') +
        '<h1 class="ee-h1" style="margin:0;font:900 34px/36px ' + EE_FONT + ';letter-spacing:-.02em;text-transform:uppercase;color:#ffffff">' + eeEsc_(o.title) + '</h1>' +
        (o.subtitle ? '<div style="margin-top:12px;font-size:16px;line-height:24px;font-weight:500;color:#e9dcf7">' + eeEsc_(o.subtitle) + '</div>' : '') +
      '</td></tr>' +
      (o.image ? '<tr><td bgcolor="' + EE_C.card + '" style="background:' + EE_C.card + ';padding:0;border-left:1px solid ' + EE_C.border + ';border-right:1px solid ' + EE_C.border + '"><img src="' + eeEsc_(o.image) + '" width="598" alt="" style="display:block;width:100%;height:auto;border:0"></td></tr>' : '') +
      // Body
      '<tr><td class="ee-pad" bgcolor="' + EE_C.card + '" style="background:' + EE_C.card + ';border:1px solid ' + EE_C.border + ';border-top:0;border-radius:0 0 16px 16px;padding:32px 40px 36px">' + o.body + '</td></tr>' +
      // Footer
      '<tr><td align="center" style="padding:26px 24px 0;font:400 13px/20px ' + EE_FONT + ';color:' + EE_C.muted + '">' +
        '<b style="color:' + EE_C.purple + '">Томүжин Алтернатив сургууль</b><br>' +
        '<a href="tel:+97677773111" style="color:' + EE_C.muted + ';text-decoration:none">+976 7777 3111</a> · ' +
        '<a href="' + EE_SITE + '" style="color:' + EE_C.muted + ';text-decoration:none">tomujin.edu.mn</a> · ' +
        '<a href="https://www.facebook.com/TomujinAlternativeSchool" style="color:' + EE_C.muted + ';text-decoration:none">Facebook</a> · ' +
        '<a href="https://www.instagram.com/tomujinalternativeschool/" style="color:' + EE_C.muted + ';text-decoration:none">Instagram</a>' +
        '<div style="margin-top:12px;font-size:12px;line-height:18px">' + eeEsc_(o.why) + '</div>' +
        '<div style="margin-top:6px;font-size:12px;color:#9a8cb3">© ' + year + ' Tomujin Alternative School</div>' +
      '</td></tr>' +
    '</table></td></tr></table></body></html>';
}

/* The facts card for one event: when, where (join link or address), speaker */
function eeEventFacts_(ev, inf, withLink) {
  const w = eeWhen_(ev);
  const rows = [['Хэзээ', eeEsc_(w.long) + '<br><span style="color:' + EE_C.purple + '">' + w.range + '</span> <span style="font-weight:500;color:' + EE_C.muted + '">(Улаанбаатарын цагаар)</span>']];
  const online = ev.format !== 'in-person', inPerson = ev.format !== 'online';
  if (inPerson) {
    const addr = inf.address || (ev.place && ev.place !== 'Онлайн' ? ev.place : '');
    rows.push(['Хаана', addr ? eeEsc_(addr).replace(/\n/g, '<br>') + (inf.map ? '<br><a href="' + eeEsc_(inf.map) + '" style="color:' + EE_C.purple + ';font-weight:700">Газрын зураг харах →</a>' : '') : 'Хаягийг удахгүй илгээнэ']);
  }
  if (online) {
    rows.push([ev.format === 'hybrid' ? 'Онлайнаар' : 'Хаана', withLink && inf.link
      ? 'Онлайн · <a href="' + eeEsc_(inf.link) + '" style="color:' + EE_C.purple + ';font-weight:700;word-break:break-all">' + eeEsc_(inf.link.replace(/^https?:\/\//, '')) + '</a>'
      : 'Онлайн · <span style="font-weight:500;color:' + EE_C.muted + '">нэгдэх холбоосыг эвент эхлэхээс ' + EE_REMINDER_HOURS + ' цагийн өмнө имэйлээр илгээнэ</span>']);
  }
  if (ev.speaker) rows.push(['Илтгэгч', eeEsc_(ev.speaker)]);
  else if (ev.host) rows.push(['Хөтлөгч', eeEsc_(ev.host)]);
  return eeFacts_(rows);
}

function eeDescription_(ev) {
  const paras = ev.emailSummary ? [ev.emailSummary]
    : Array.isArray(ev.details) && ev.details.length ? ev.details : ev.summary ? [ev.summary] : [];
  return paras.map(t => eeP_(eeEsc_(t))).join('');
}

/* "details" (just registered) and "reminder" (shortly before) */
function eeRenderDetails_(ev, inf, person, reminder, now) {
  const w = eeWhen_(ev), first = eeFirstName_(person.name);
  const online = ev.format !== 'in-person', linkReady = online && !!inf.link;
  const rel = eeRelDay_(ev, now);
  const subject = reminder ? (rel === 'Өнөөдөр' || rel === 'Маргааш' ? rel + ' ' + w.time + '-д' : w.long + ', ' + w.time) + ': ' + ev.title
                           : 'Бүртгэл баталгаажлаа: ' + ev.title;
  let body = eeP_('Сайн байна уу' + (first ? ', <b>' + eeEsc_(first) + '</b>' : '') + '?') +
    eeP_(reminder
      ? '<b>' + eeEsc_(ev.title) + '</b> ' + (rel === 'Өнөөдөр' ? 'өнөөдөр' : rel === 'Маргааш' ? 'маргааш' : w.long) + ' ' + w.time + '-д эхэлнэ. Таныг хүлээж байна!'
      : '<b>' + eeEsc_(ev.title) + '</b> эвентэд бүртгүүлсэнд баярлалаа. Доорх мэдээллийг хадгалаад аваарай.') +
    '<div style="height:8px"></div>' + eeEventFacts_(ev, inf, true) + '<div style="height:24px"></div>';
  if (linkReady) body += eeButton_(inf.link, 'Эвентэд нэгдэх →') + '<div style="height:14px"></div>';
  else if (!online && inf.map) body += eeButton_(inf.map, 'Газрын зураг харах →') + '<div style="height:14px"></div>';
  body += eeP_('<a href="' + eeEsc_(eeCalendarUrl_(ev, inf)) + '" style="color:' + EE_C.purple + ';font-weight:700;text-decoration:none">+ Google Calendar-т нэмэх</a>', 'font-size:14px');
  if (inf.prepare && inf.prepare.length) body += '<div style="height:8px"></div>' + eeH2_('Бэлдэх зүйлс') + eeList_(inf.prepare);
  if (inf.note) body += '<div style="height:8px"></div>' + eeH2_('Нэмэлт мэдээлэл') + eeP_(eeEsc_(inf.note).replace(/\n/g, '<br>'));
  if (online && linkReady) body += eeP_('Эхлэхээс 5 минутын өмнө нэгдэж, нэр, микрофон, камераа шалгаарай.', 'font-size:14px;line-height:22px;color:' + EE_C.muted);
  body += eeP_('Асуух зүйл байвал энэ имэйлд хариу бичээрэй.', 'font-size:14px;line-height:22px;color:' + EE_C.muted + ';margin:0');

  const html = eeLayout_({
    subject: subject, preheader: w.long + ' · ' + w.time + ' · ' + (online ? 'Онлайн' : (inf.address || ev.place || '')),
    eyebrow: ev.series || ev.typeName, title: reminder ? 'Удахгүй эхэлнэ' : 'Та бүртгүүллээ!', subtitle: ev.title,
    body: body, why: 'Та tomujin.edu.mn дээр энэ эвентэд бүртгүүлсэн тул энэ имэйлийг авч байна.'
  });
  const text = [
    'Сайн байна уу' + (first ? ', ' + first : '') + '?', '',
    reminder ? ev.title + ' ' + rel.toLowerCase() + ' ' + w.time + '-д эхэлнэ.' : ev.title + ' эвентэд бүртгүүлсэнд баярлалаа.', '',
    'Хэзээ: ' + w.long + ', ' + w.range + ' (Улаанбаатарын цагаар)',
    ev.format !== 'online' ? 'Хаана: ' + (inf.address || ev.place || '') + (inf.map ? '\nГазрын зураг: ' + inf.map : '') : null,
    online ? 'Онлайн: ' + (inf.link || 'нэгдэх холбоосыг эвент эхлэхээс ' + EE_REMINDER_HOURS + ' цагийн өмнө илгээнэ') : null,
    ev.speaker ? 'Илтгэгч: ' + ev.speaker : null,
    inf.prepare && inf.prepare.length ? '\nБэлдэх зүйлс:\n' + inf.prepare.map(s => '• ' + s).join('\n') : null,
    inf.note ? '\n' + inf.note : null, '',
    'Календарьт нэмэх: ' + eeCalendarUrl_(ev, inf), '', 'Томүжин Алтернатив сургууль · tomujin.edu.mn'
  ].filter(s => s != null).join('\n').replace(/\n{3,}/g, '\n\n');
  return { subject: subject, html: html, text: text };
}

/* "subscribed": confirms they'll hear about future events, and lists what's coming */
function eeRenderSubscribed_(person, upcoming, now) {
  const first = eeFirstName_(person.name);
  const subject = 'Томүжингийн эвентийн урилгыг танд хамгийн түрүүнд илгээнэ';
  let body = eeP_('Сайн байна уу' + (first ? ', <b>' + eeEsc_(first) + '</b>' : '') + '?') +
    eeP_('Томүжингийн эвентийн мэдээлэл авахаар бүртгүүлсэнд баярлалаа. Зочин илтгэгчийн цуврал, нээлттэй хаалганы өдөр, мэдээллийн уулзалт, эцэг эхийн ярианы урилгыг танд хамгийн түрүүнд илгээнэ.');
  const list = upcoming.filter(u => !u.ev.closed);
  if (list.length) {
    body += '<div style="height:8px"></div>' + eeH2_('Удахгүй болох эвентүүд');
    body += list.map(u => {
      const w = eeWhen_(u.ev);
      return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px;border:1px solid ' + EE_C.border + ';border-radius:12px;border-collapse:separate"><tr>' +
        '<td width="64" align="center" valign="top" bgcolor="' + EE_C.soft + '" style="background:' + EE_C.soft + ';border-radius:12px 0 0 12px;padding:14px 6px;font-family:' + EE_FONT + '">' +
          '<div style="font-size:11px;line-height:14px;font-weight:700;color:' + EE_C.muted + '">' + (+u.ev.start.slice(5, 7)) + ' сарын</div>' +
          '<div style="font-size:28px;line-height:32px;font-weight:800;color:' + EE_C.purple + '">' + (+u.ev.start.slice(8, 10)) + '</div></td>' +
        '<td valign="top" style="padding:14px 16px;font-family:' + EE_FONT + '">' +
          '<div style="font-size:11px;line-height:16px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:' + EE_C.teal + '">' + eeEsc_(u.ev.series || u.ev.typeName) + '</div>' +
          '<div style="font-size:16px;line-height:22px;font-weight:700;color:' + EE_C.ink + ';margin:2px 0 4px">' + eeEsc_(u.ev.title) + '</div>' +
          '<div style="font-size:14px;line-height:20px;color:' + EE_C.muted + '">' + w.weekday + ' гараг · ' + w.time + ' · ' + eeEsc_(u.ev.format === 'online' ? 'Онлайн' : (u.info.address || u.ev.place || '')) + (u.ev.tbc ? ' · урьдчилсан' : '') + '</div>' +
        '</td></tr></table>';
    }).join('');
    body += '<div style="height:12px"></div>' + eeButton_(EE_SITE + '/events', 'Эвентэд бүртгүүлэх →');
  } else {
    body += eeButton_(EE_SITE + '/events', 'Эвентүүдийг харах →');
  }
  const html = eeLayout_({
    subject: subject, preheader: 'Дараагийн эвентүүдийн урилгыг танд хамгийн түрүүнд илгээнэ.',
    eyebrow: 'Томүжингийн эвентүүд', title: 'Бүртгэл баталгаажлаа', body: body,
    why: 'Та tomujin.edu.mn дээр эвентийн мэдээлэл авахаар бүртгүүлсэн. Цаашид авахыг хүсэхгүй бол энэ имэйлд "STOP" гэж хариу бичээрэй.'
  });
  const text = ['Сайн байна уу' + (first ? ', ' + first : '') + '?', '',
    'Томүжингийн эвентийн мэдээлэл авахаар бүртгүүлсэнд баярлалаа. Дараагийн эвентүүдийн урилгыг танд хамгийн түрүүнд илгээнэ.', '',
    list.length ? 'Удахгүй болох эвентүүд:\n' + list.map(u => '• ' + eeWhen_(u.ev).short + ' ' + eeWhen_(u.ev).time + ' — ' + u.ev.title).join('\n') + '\n' : null,
    'Бүртгүүлэх: ' + EE_SITE + '/events', '', 'Цаашид авахыг хүсэхгүй бол "STOP" гэж хариу бичээрэй.'].filter(s => s != null).join('\n').replace(/\n{3,}/g, '\n\n');
  return { subject: subject, html: html, text: text };
}

/* "invitation": a new event, to subscribers */
function eeRenderInvitation_(ev, inf, person, now) {
  const w = eeWhen_(ev), first = eeFirstName_(person.name);
  const subject = 'Урилга: ' + ev.title + ' · ' + w.long + ', ' + w.time;
  let body = eeP_('Сайн байна уу' + (first ? ', <b>' + eeEsc_(first) + '</b>' : '') + '?') +
    eeDescription_(ev) +
    '<div style="height:8px"></div>' + eeEventFacts_(ev, inf, false) + '<div style="height:24px"></div>' +
    eeButton_(EE_SITE + '/events', 'Бүртгүүлэх →') + '<div style="height:16px"></div>' +
    eeP_(ev.seats ? eeEsc_(ev.seats) + '. Бүртгүүлсэн хүмүүст ' + (ev.format === 'in-person' ? 'хаяг' : 'нэгдэх холбоос') + ', бэлдэх зүйлсийг имэйлээр илгээнэ.'
                  : 'Бүртгүүлсэн хүмүүст ' + (ev.format === 'in-person' ? 'хаяг' : 'нэгдэх холбоос') + ', бэлдэх зүйлсийг имэйлээр илгээнэ.',
      'font-size:14px;line-height:22px;color:' + EE_C.muted + ';margin:0');
  const html = eeLayout_({
    subject: subject, preheader: (ev.emailSummary || ev.summary || '').slice(0, 120),
    eyebrow: ev.series || ev.typeName, title: ev.title, subtitle: ev.subtitle || (w.long + ' · ' + w.time),
    image: eeAbs_(ev.image), body: body,
    why: 'Та tomujin.edu.mn дээр эвентийн мэдээлэл авахаар бүртгүүлсэн. Цаашид авахыг хүсэхгүй бол энэ имэйлд "STOP" гэж хариу бичээрэй.'
  });
  const text = ['Сайн байна уу' + (first ? ', ' + first : '') + '?', '', ev.emailSummary || ev.summary || null, '',
    ev.title, 'Хэзээ: ' + w.long + ', ' + w.range + ' (Улаанбаатарын цагаар)',
    'Хаана: ' + (ev.format === 'online' ? 'Онлайн' : (inf.address || ev.place || '')),
    ev.speaker ? 'Илтгэгч: ' + ev.speaker : null, '', 'Бүртгүүлэх: ' + EE_SITE + '/events', '',
    'Цаашид авахыг хүсэхгүй бол "STOP" гэж хариу бичээрэй.'].filter(s => s != null).join('\n').replace(/\n{3,}/g, '\n\n');
  return { subject: subject, html: html, text: text };
}
