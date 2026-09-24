# Томүжин Алтернатив сургууль — website

The website for Tomujin Alternative School, built with the Tomujin design system. It's one static page with no build step, so any static host (Vercel, Netlify, GitHub Pages) can serve it as-is.

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
- **Photos:** each dashed "Зураг удахгүй нэмэгдэнэ" box is a `<div class="photo-slot">`. Replace its contents with `<img src="assets/…" alt="…">`.

## Fonts

- **Raleway** (text) and **Google Sans** (numbers) load from Google Fonts.
- **Gotham** is used for numbers only on computers that already have it installed. No Gotham files are included, because putting Gotham on a website needs a separate web license from Hoefler&Co. Everyone else sees Google Sans.

## Credits

The university logos come from Wikipedia and Wikimedia Commons. They are trademarks of their universities, and some are hosted on Wikipedia under fair use. Confirm the school is comfortable using them before a public launch.
