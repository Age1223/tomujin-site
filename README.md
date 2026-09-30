# Томүжин Алтернатив сургууль — website

The website for Tomujin Alternative School, built with the Tomujin design system. It's one static page with no build step, so any static host (Vercel, Netlify, GitHub Pages) can serve it as-is.

## What's public

Нүүр, Бидний тухай, Элсэлт and Бидний үр дүн are public. Хөтөлбөр is still in `index.html`, but it can't be opened: its address shows the homepage, and the menus and footer leave it out. To publish it:

1. In the script at the bottom of `index.html`, add `"program"` to `PUBLISHED` (near the top of the script): `var PUBLISHED = ["home", "about", "program", "admissions", "outcomes"];`
2. Optionally show the homepage's "Хөтөлбөртэй танилцах" button (remove `hidden data-later` from its `btn-row` in the hero).

Other things hidden for now carry `hidden data-later`; remove it to show them again. They include the "Өргөдлөө илгээгээрэй" buttons in the header and on the homepage, the homepage intro, "Алсын хараа", the graduate placeholder cards on Бидний үр дүн and the footer's join.tomujin.edu.mn link. Sections hidden this way are left out of the menus automatically.

### Previewing the unpublished pages

The Claude artifact preview is built from `index.html` by `tools/make-preview.py`. It is the same site with every page allowed to open (Хөтөлбөр included), plus a small bar in the bottom-left corner, which exists only in the preview, for switching between all five pages. `index.html` itself is what Vercel serves.

## Pages

The site has five pages. Each page has its own address, and each section can be linked directly:

| Page | Address | Example section link |
|---|---|---|
| Нүүр | `#home` | `#home-numbers` |
| Бидний тухай | `#about` | `#about-history` |
| Хөтөлбөр | `#program` | `#program-house` |
| Элсэлт | `#admissions` | `#admissions-faq` |
| Бидний үр дүн | `#outcomes` | `#outcomes-careers` |

## Files

```
index.html          the whole site: page text, styles and script
assets/
  logo-lockup.png   Tomujin logo (header, footer)
  logo-icon.jpg     browser tab icon
  photos/           school photos: 3:2 WebP, each in two sizes (-800 and -1200)
  alumni/           graduate photos for the homepage stories (from join.tomujin.edu.mn)
  press/            preview images for the "Хэвлэл дээрх нийтлэлүүд" links (WebP)
  tangrams/         tangram figures from the Tomujin design system
  unis/             university logos (WebP)
  ventures/         logos of graduates' businesses (Бидний үр дүн page)
  tominc/           TOM/INC 2026 Impact Report: a web-sized PDF, its pages as images for the in-page reader (pages/),
                    the cover and the winning projects' pictures
vercel.json         lets browsers keep the images for a day, so repeat visits load fast
```

## Editing

- **Page text:** find the page in `index.html` by its marker, e.g. `<!-- 4. ЭЛСЭЛТ / ADMISSIONS -->`, and edit the words between the tags.
- **Lists:** these live in the script at the bottom of `index.html`:
  - `SITEMAP`: the menu, its dropdowns and the footer
  - `UNIS`: university logos, in prestige order
  - `FIT`: the "Хэрвээ чи:" checklist
  - `FAQ`: questions and answers
- **13-year timeline (Хөтөлбөр page):** one column per grade, Бэлтгэл (K) to 12-р анги.
  - Each programme bar is an `<li data-from="9" data-to="11">` with a link to its section further down the page. Change `data-from` / `data-to` to move a bar (use `K` for Бэлтгэл), and update its grade text to match.
  - The three stages (Бага, Дунд, Ахлах) have a photo slot and a placeholder paragraph each.
- **Photos:** each photo sits in a `<div class="photo-slot">`.
  - To fill an empty dashed "Зураг удахгүй нэмэгдэнэ" box, replace its contents with `<img src="assets/photos/…" alt="…">`. A plain JPEG works; the site's own photos are WebP in two sizes (the browser picks the smaller one on small or ordinary screens) with a tiny blurred preview in `style`, which shows until the photo arrives.
  - Put several `<img>` in one box and it becomes a small gallery, with arrows in the corner and swiping on phones.
  - Photo boxes are 3:2 (the shape of most camera photos). Photos about 1200×800 pixels look sharp; anything much larger only slows the page down.

## Lead form

The "Хүлээлгийн жагсаалтад орох" form sits in the homepage hero. Once you scroll past it, a button in the bottom-right corner opens it, and it settles into the "Чамд тохирох сургууль байна уу?" section when you scroll there. It is one form moving between these places, so anything typed stays. Each answer goes to the **Tomujin website leads** Apps Script (a standalone project in the school's Google account; its code is `tools/lead-form.gs`). The script adds a row to the **Leads** tab of "TAS | Admissions Data 2026-2027":

| Leads column | What goes in |
|---|---|
| Холбогдсон огноо | the date the lead arrived |
| Сонирхсон анги | the grade number from the form |
| Одоогийн сургууль | the school from the form |
| Хаагуур холбогдсон | Website |
| Утасны дугаар | the phone number |

It finds the columns by their header names, so moving columns around is fine, but renaming one of those headers breaks it. It fills the first row where those columns are empty and adds rows when the sheet runs out.

The form sends to the web app address in its `action` attribute in `index.html`. If you change the script, publish it with **Deploy → Manage deployments → Edit → New version** so that address stays the same.

## Fonts

- **Raleway** (text) and **Google Sans** (numbers) load from Google Fonts.
- **Gotham** is used for numbers only on computers that already have it installed. No Gotham files are included, because putting Gotham on a website needs a separate web license from Hoefler&Co. Everyone else sees Google Sans.

## Credits

The university logos come from Wikipedia and Wikimedia Commons. They are trademarks of their universities, and some are hosted on Wikipedia under fair use. Confirm the school is comfortable using them before a public launch.
