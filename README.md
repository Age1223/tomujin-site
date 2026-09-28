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
- **Photos:** each photo sits in a `<div class="photo-slot">`.
  - To fill an empty dashed "Зураг удахгүй нэмэгдэнэ" box, replace its contents with `<img src="assets/photos/…" alt="…">`. A plain JPEG works; the site's own photos are WebP in two sizes (the browser picks the smaller one on small or ordinary screens) with a tiny blurred preview in `style`, which shows until the photo arrives.
  - Put several `<img>` in one box and it becomes a small gallery, with arrows in the corner and swiping on phones.
  - Photo boxes are 3:2 (the shape of most camera photos). Photos about 1200×800 pixels look sharp; anything much larger only slows the page down.

## Lead form

The "Дэлгэрэнгүй мэдээлэл авах бол..." form on the homepage is being moved off Google Forms, to a Google Sheet the school owns. `tools/lead-form.gs` is the small Google Apps Script that receives each answer and adds it as a row. To set it up:

1. Create a new Google Sheet in the school's Google account, e.g. "Tomujin website leads".
2. In the sheet, open **Extensions → Apps Script**. Delete the code that's there and paste in everything from `tools/lead-form.gs`. To get an email for every new lead, put the address in `NOTIFY_EMAIL`. Save.
3. Click **Deploy → New deployment**. Next to "Select type", click the gear and choose **Web app**. Set **Execute as: Me** and **Who has access: Anyone**, then click **Deploy**.
4. Google asks you to authorize the script. Because it's your own script, it may warn that the app isn't verified: click **Advanced**, then **Go to … (unsafe)**, then **Allow**.
5. Copy the **Web app URL** (it ends in `/exec`). The site's form sends to that address.

If you later edit the script, use **Deploy → Manage deployments → Edit → New version**, so the web app URL stays the same.

## Fonts

- **Raleway** (text) and **Google Sans** (numbers) load from Google Fonts.
- **Gotham** is used for numbers only on computers that already have it installed. No Gotham files are included, because putting Gotham on a website needs a separate web license from Hoefler&Co. Everyone else sees Google Sans.

## Credits

The university logos come from Wikipedia and Wikimedia Commons. They are trademarks of their universities, and some are hosted on Wikipedia under fair use. Confirm the school is comfortable using them before a public launch.
