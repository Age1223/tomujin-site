# Томүжин Алтернатив сургууль — website

The website for Tomujin Alternative School, built with the Tomujin design system. It's one static page with no build step, so any static host (Vercel, Netlify, GitHub Pages) can serve it as-is.

## Homepage-only launch

For now only the Нүүр page is published. The other four pages are still in `index.html` but can't be opened, and their addresses show the homepage. To bring them back:

1. In the script at the bottom of `index.html`, add the page ids to `PUBLISHED`, e.g. `var PUBLISHED = ["home", "about", "program", "admissions", "outcomes"];`
2. Remove `hidden data-later` from the elements that carry it: the header menu, the phone menu button, the "Өргөдлөө илгээгээрэй" buttons, the "Хөтөлбөртэй танилцах" and "Бидний үр дүн" buttons, the footer sitemap and the join.tomujin.edu.mn link.

## Pages

The site has five pages. Each page has its own address, and each section can be linked directly:

| Page | Address | Example section link |
|---|---|---|
| Нүүр | `#home` | `#home-numbers` |
| Бидний тухай | `#about` | `#about-history` |
| Хөтөлбөр | `#program` | `#program-house` |
| Элсэлт | `#admissions` | `#admissions-faq` |
| Бидний үр дүн | `#outcomes` | `#outcomes-ventures` |

## Files

```
index.html          the whole site: page text, styles and script
assets/
  logo-lockup.png   Tomujin logo (header, footer)
  logo-icon.jpg     browser tab icon
  photos/           school photos, cropped to 3:2 and compressed for the web
  press/            preview images for the "Хэвлэл дээрх нийтлэлүүд" links
  tangrams/         tangram figures from the Tomujin design system
  unis/             university logos
```

## Editing

- **Page text:** find the page in `index.html` by its marker, e.g. `<!-- 4. ЭЛСЭЛТ / ADMISSIONS -->`, and edit the words between the tags.
- **Lists:** these live in the script at the bottom of `index.html`:
  - `SITEMAP`: the menu, its dropdowns and the footer
  - `UNIS`: university logos, in prestige order
  - `FIT`: the "Хэрвээ чи:" checklist
  - `FAQ`: questions and answers
- **Photos:** each photo sits in a `<div class="photo-slot">`.
  - To fill an empty dashed "Зураг удахгүй нэмэгдэнэ" box, replace its contents with `<img src="assets/photos/…" alt="…">`.
  - Put several `<img>` in one box and it becomes a small gallery, with arrows in the corner and swiping on phones.
  - Photo boxes are 3:2 (the shape of most camera photos). Photos about 1200×800 pixels, saved as JPEG, look sharp and load quickly.

## Fonts

- **Raleway** (text) and **Google Sans** (numbers) load from Google Fonts.
- **Gotham** is used for numbers only on computers that already have it installed. No Gotham files are included, because putting Gotham on a website needs a separate web license from Hoefler&Co. Everyone else sees Google Sans.

## Credits

The university logos come from Wikipedia and Wikimedia Commons. They are trademarks of their universities, and some are hosted on Wikipedia under fair use. Confirm the school is comfortable using them before a public launch.
