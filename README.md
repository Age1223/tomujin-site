# Томүжин Алтернатив сургууль — website

The website for Tomujin Alternative School, built with the Tomujin design system. It's one static page with no build step, so any static host (Vercel, Netlify, GitHub Pages) can serve it as-is.

## Homepage-only launch

For now only the Нүүр page is published. The other four pages are still in `index.html` but can't be opened, and their addresses show the homepage. To bring them back:

1. In the script at the bottom of `index.html`, add the page ids to `PUBLISHED`, e.g. `var PUBLISHED = ["home", "about", "program", "admissions", "outcomes"];`
2. Remove `hidden data-later` from the elements that carry it: the header menu, the phone menu button, the "Өргөдлөө илгээгээрэй" buttons, the "Хөтөлбөртэй танилцах" and "Бидний үр дүн" buttons, the footer sitemap and the join.tomujin.edu.mn link.

### Previewing the unpublished pages

The Claude artifact preview is built from `index.html` by `tools/make-preview.py`. Its homepage is identical to the live one. The only difference is a small bar in the bottom-left corner, which exists only in the preview, for switching between all five pages, so the unpublished ones can be reviewed. `index.html` itself, which is what Vercel serves, stays homepage-only.

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
