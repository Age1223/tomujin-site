/* ─────────────────────────────────────────────────────────────────────────────────────────────
   ЭВЕНТҮҮДИЙН ЖАГСААЛТ — the one place to add, change or remove events.
   Used by /events (the hero picks the nearest upcoming event) and by talk pages like /tsasanjin-talk
   (their "Дараагийн эвент" card).

   Each event:
     id        short unique name, no spaces (sign-ups are saved with it)
     type      one of the keys in EVENT_TYPES below (the filter buttons on /events come from these)
     title     the event's name
     summary   one or two sentences
     start     date and time in Ulaanbaatar time, written like "2026-11-22T11:00"
     minutes   how long it lasts
     format    "in-person", "online" or "hybrid"
     place     the address, or for online events how people get the link
     closed    true = registration closed even though it hasn't happened yet (e.g. it's full)
     page      optional: a page about the event, e.g. its recording ("/tsasanjin-talk")
     featured  optional: true = show this one in the /events hero instead of the nearest event

   Optional, shown when the event is the one at the top of /events:
     image     a square poster, e.g. "/assets/events/open-house.webp" (about 1200×1200). Without one, the page
               draws a purple poster with the event's name and date.
     subtitle  a short line under the title, e.g. "Цуврал 01 · «Юуны төлөө?»"
     details   a longer description; each item in the list is its own paragraph (used instead of summary)
     speaker   who speaks, e.g. "Б.Ганди, 2024 оны төгсөгч" (shown as "Илтгэгч")
     host      who leads it, e.g. "Батжин, үүсгэн байгуулагч" (shown as "Хөтлөгч" when there's no speaker)
     tbc       true = the date and time aren't confirmed yet: they show as "урьдчилсан", and people can
               only ask to be told once it's set (no registration yet). Delete the line once it's confirmed.
     seats     e.g. "30 суудал" (otherwise it says whether registration is open)

   Once an event's time has passed it moves to the bottom of the list as "Дууссан" by itself; you don't
   need to delete it.
   ───────────────────────────────────────────────────────────────────────────────────────────── */
window.EVENT_TYPES = {
  "info":        "Мэдээллийн уулзалт",
  "open-house":  "Нээлттэй хаалганы өдөр",
  "parents":     "Эцэг эхийн яриа",
  "experience":  "Томүжинг мэдрэх өдөр",
  "speaker":     "Зочин илтгэгчийн цуврал"
};

window.EVENTS = [
  /* Зочин илтгэгчийн цуврал #1 — TODO: real date, place and title */
  {
    id: "tsasanjin-talk",
    type: "speaker",
    title: "Цасанжин: зочин илтгэгчийн яриа",
    summary: "Зочин илтгэгчийн цувралын яриа. Бичлэг болон дэлгэрэнгүйг үзээрэй.",
    start: "2026-11-01T15:00", minutes: 90, format: "in-person",
    place: "Томүжин Алтернатив сургууль",
    page: "/tsasanjin-talk"
  },
  /* #2 — date and time confirmed. TODO: add the poster (image) when it arrives; check format and place. */
  {
    id: "speaker-02-gandi",
    type: "speaker",
    title: "Б.Ганди · Harvard University",
    subtitle: "Зочин илтгэгчийн цуврал #2",
    summary: "Томүжингийн 2024 оны төгсөгч, Харвардын их сургуулийн оюутан Б.Ганди туршлагаасаа хуваалцана.",
    start: "2026-11-14T21:00", minutes: 60, format: "online",
    place: "Онлайн · холбоосыг бүртгүүлсний дараа илгээнэ",
    speaker: "Б.Ганди, 2024 оны төгсөгч"
  },
  /* #3 — Мөнхжин has agreed to take part; date and time still to be confirmed (tbc). */
  {
    id: "speaker-03-munkhjin",
    type: "speaker",
    title: "Мөнхжин · NYU Abu Dhabi",
    subtitle: "Зочин илтгэгчийн цуврал #3",
    summary: "Томүжингийн 2026 оны төгсөгч, NYU Abu Dhabi-гийн оюутан Мөнхжин туршлагаасаа хуваалцана.",
    start: "2026-11-21T20:00", minutes: 60, format: "online",
    place: "Онлайн · холбоосыг бүртгүүлсний дараа илгээнэ",
    speaker: "Мөнхжин, 2026 оны төгсөгч",
    tbc: true
  }
];
