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
     place     where: the address, or "Онлайн"
     placeNote optional: a second line under place, e.g. "холбоосыг бүртгүүлсний дараа илгээнэ"
     series    optional: the series name shown above the title (else the type's name)
     closed    true = registration closed even though it hasn't happened yet (e.g. it's full)
     page      optional: a page about the event, e.g. its recording ("/tsasanjin-talk")
     pageLabel optional: the button to that page once the event is over, e.g. "Ярилцлагыг унших"
     featured  optional: true = show this one in the /events hero instead of the nearest event

   Tomujin is Talking on the home page (cards after the alumni quotes, and the pop-up):
     photo     a square photo of the speaker, e.g. "/assets/talks/gandi/speaker.jpg". Talks with a photo get a card.
               Once a talk is over and has a page, its card says "Ярилцлагыг унших", and the newest one is shown
               in the home page pop-up (once per visitor). An upcoming talk's card says "Удахгүй" and links to /events.
     teaser    one sentence about the interview, for the card and the pop-up

   Optional, shown when the event is the one at the top of /events:
     image     the poster, 4:5 (e.g. 1080×1350), in /assets/events/. Without one, the page draws a purple
               poster with the event's name and date.
     subtitle  a short line under the title, e.g. "Цуврал 01 · «Юуны төлөө?»"
     details   a longer description; each item in the list is its own paragraph (used instead of summary)
     emailSummary  optional: the description in the emails (invitation, details, reminder) when it should
               read differently from the site; without it the emails use details or summary
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
  /* Tomujin is Talking #1 */
  {
    id: "tsasanjin-talk",
    type: "speaker",
    series: "Tomujin is Talking series",
    title: "З.Цасанжин · Swarthmore College",
    summary: "Томүжингийн 2026 оны төгсөгч, Swarthmore College-ийн оюутан З.Цасанжин туршлагаасаа хуваалцав.",
    start: "2026-11-08T20:30", minutes: 60, format: "online",
    place: "Онлайн",
    speaker: "З.Цасанжин, 2026 оны төгсөгч",
    page: "/tsasanjin-talk", pageLabel: "Ярилцлагыг унших",
    photo: "/assets/talks/tsasanjin/speaker.jpg",
    teaser: "Өргөдлөө хэрхэн бичсэн, liberal arts коллежийн амьдрал, тэнцээгүй гэсэн хариу авбал юу хийх вэ."
  },
  /* Tomujin is Talking #2 */
  {
    id: "speaker-02-gandi",
    type: "speaker",
    series: "Tomujin is Talking series",
    title: "Б.Ганди · Harvard University",
    summary: "Томүжин Алтернатив сургуулийн 2024 оны төгсөгч, Харвардын их сургуульд 100% тэтгэлэгтэй тэнцэж суралцаж буй оюутан Б.Ганди маань өөрийн туршлагаасаа хуваалцах дараагийн TOMUJIN IS TALKING!",
    image: "/assets/events/tomujin-is-talking-02-gandi.webp",
    start: "2026-11-14T21:00", minutes: 60, format: "online",
    place: "Онлайн", placeNote: "холбоосыг бүртгүүлсний дараа илгээнэ",
    speaker: "Б.Ганди, 2024 оны төгсөгч",
    page: "/gandi-talk", pageLabel: "Ярилцлагыг унших",
    photo: "/assets/talks/gandi/speaker.jpg",
    teaser: "Хэнтийн Баян-Адаргаас Харвард хүртэл: тэтгэлэг, коллежийн амьдрал, анги ангидаа юу хийх вэ."
  },
  /* Tomujin is Talking #3 */
  {
    id: "speaker-03-munkhjin",
    type: "speaker",
    series: "Tomujin is Talking series",
    title: "М.Мөнхжин · NYU Abu Dhabi",
    summary: "Томүжингийн 2026 оны төгсөгч, NYU Abu Dhabi-гийн оюутан Мөнхжин туршлагаасаа хуваалцана.",
    emailSummary: "Томүжингийн 2026 оны төгсөгч, дэлхийн шилдэг NYU Abu Dhabi-гийн их сургуульд тэтгэлэгтэй суралцаж буй оюутан Мөнхжин туршлагаасаа хуваалцах гэж байна.",
    image: "/assets/events/tomujin-is-talking-03-munkhjin.webp",
    start: "2026-11-21T20:00", minutes: 60, format: "online",
    place: "Онлайн", placeNote: "холбоосыг бүртгүүлсний дараа илгээнэ",
    speaker: "М.Мөнхжин, 2026 оны төгсөгч",
    photo: "/assets/talks/munkhjin/speaker.jpg"
  },
  /* Tomujin is Talking #4 */
  {
    id: "speaker-04-anungoo",
    type: "speaker",
    series: "Tomujin is Talking series",
    title: "Б.Анунгоо · Albion College",
    summary: "Томүжин Алтернатив сургуулийн 2025 оны төгсөгч, Albion их сургуулийн оюутан Б.Анунгоо туршлагаасаа хуваалцана.",
    image: "/assets/events/tomujin-is-talking-04-anungoo.webp",
    start: "2026-11-28T21:00", minutes: 60, format: "online",
    place: "Онлайн", placeNote: "холбоосыг бүртгүүлсний дараа илгээнэ",
    speaker: "Б.Анунгоо, 2025 оны төгсөгч",
    photo: "/assets/talks/anungoo/speaker.jpg",
    featured: true
  }
];
