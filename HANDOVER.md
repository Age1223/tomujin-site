# Handover — tomujin-site

This is the project's handover note: what is live, what is unfinished, which accounts the next person needs, and what to watch out for. For how to edit the site (page text, photos, lists, tracking IDs, the lead form), read **README.md** first. This note covers what the README doesn't.

Built by Erkhem with Claude Code between 24 Sep and 5 Oct 2026 (89 commits on `main`).

## 1. What the project is

The website of Томүжин Алтернатив сургууль. The whole site is one static file, `index.html`, plus images in `assets/`. There is no framework, no build step, and nothing to install. Each "page" is a section of `index.html` that a small script at the bottom shows or hides, depending on the address (`#about`, `#admissions` and so on).

Vercel serves `index.html` from this repo at **tomujin.edu.mn**. The `tools/` folder is not deployed (see `.vercelignore`).

## 2. What's live

| Page | Status |
|---|---|
| Нүүр (`#home`) | Live since 28 Sep. Hero with the lead form, numbers, principles, graduate stories, press links |
| Бидний тухай (`#about`) | Live since 30 Sep. Bio and the 10+ year history timeline (2015–2024 cards with photos) |
| Элсэлт (`#admissions`) | Live since 30 Sep. "Өргөдлөө илгээгээрэй" goes to admissions.tomujin.edu.mn |
| Бидний үр дүн (`#outcomes`) | Live since 30 Sep. Universities, TOM/INC 2026 Impact Report reader, graduates' businesses (linked to their Instagram) |
| Хөтөлбөр (`#program`) | **Not public.** It's in the file, but the address redirects to the homepage. See section 4 |

Also live:
- **Google Analytics 4** `G-E6WJCDTWQ5` and **Meta Pixel** `2024830894853717`. They report page views and lead sign-ups, and count only on tomujin.edu.mn.
- **Lead form** ("Дэлгэрэнгүй мэдээлэл авах"). Sign-ups go into the **Leads** tab of the "TAS | Admissions Data 2026-2027" Google Sheet.

## 3. Accounts and access to hand over

The site depends on several accounts besides this repo. Make sure the next person can get into each one, or knows who owns it.

| What | Where | Why it matters |
|---|---|---|
| GitHub repo `errkhem/tomujin-site` | github.com → repo → Settings → Collaborators | Needed to edit the site. Consider transferring the repo to a school-owned account |
| Vercel project | vercel.com | Serves the site. Pushing to `main` updates the live site (confirm the project is linked to this repo's `main`) |
| Domain `tomujin.edu.mn` | wherever the school manages its DNS | Points the domain at Vercel |
| Apps Script **"Tomujin website leads"** | script.google.com, under the school's Google account | Receives every form sign-up. **The live version is here, not in the repo** (see section 5) |
| Google Sheet "TAS \| Admissions Data 2026-2027" → **Leads** tab | Google Drive | Where the leads land |
| Google Analytics 4 property | analytics.google.com | Visit and lead reports |
| Meta Events Manager (pixel) | business.facebook.com | Ads measurement for Facebook and Instagram |

## 4. Unfinished work

**Хөтөлбөр page (biggest open item).** Before it can be published:
- The three stage paragraphs (Бага, Дунд, Ахлах) on the 13-year timeline are still *lorem ipsum*.
- Four photo slots are empty ("Зураг удахгүй нэмэгдэнэ"): one per stage, plus one in Хаус систем.
- The Дугуйлан section says its introduction is coming soon.
- The Impact Report card in the ТОМ ИНК section says the report will be published soon, but the report is now out (it's on Бидний үр дүн), so update or link it.
- To publish it, follow README → "What's public".

**Hidden for now** (marked `hidden data-later` in `index.html`; delete that to show them):
- "Өргөдлөө илгээгээрэй" buttons in the header and on the homepage
- The homepage's "Хөтөлбөртэй танилцах" button and philosophy intro
- "Алсын хараа" on Бидний тухай
- The "graduates at big companies" cards on Бидний үр дүн. These are still placeholders (Төгсөгчийн нэр / 20XX), so they need real names, years and roles first
- The join.tomujin.edu.mn link in the footer

**Before treating the site as fully launched:**
- **University logos:** they come from Wikipedia and are the universities' trademarks. Confirm the school is OK using them.
- **Gotham font:** it isn't included, because it needs a paid web license. The site falls back to Google Sans.
- **Google Tag Manager:** its ID is empty. That's only needed for extra tools (TikTok Pixel, Hotjar and so on).

## 5. Things that will catch you out

- **`tools/lead-form.gs` is a template.** Its `SPREADSHEET_ID` reads `PASTE_SPREADSHEET_ID`. The working script, with the real ID, lives in the school's Google account as "Tomujin website leads". If you change it, redeploy it with **Deploy → Manage deployments → Edit → New version**. Making a *new* deployment changes the web address and breaks the form until you update its `action` in `index.html`.
- **Don't rename the Leads sheet's column headers** (Холбогдсон огноо, Сонирхсон анги, Одоогийн сургууль, Хаагуур холбогдсон, Утасны дугаар). The script finds columns by those names. Moving columns around is fine.
- **Tracking ignores everything except tomujin.edu.mn.** Opening the site locally or on a Vercel preview link won't show up in Analytics, and that's intentional.
- **Every push to `main` goes live**, so check changes in a preview before pushing.
- **README.md is served publicly** at tomujin.edu.mn/README.md (only `tools/` and this file are excluded). Don't put private notes in it.

## 6. How the work was done (to carry on the same way)

- **Plain-language commit messages** that start with the page they touch, like `About: 2023 text names the "21 Мөрөөдөл" project` or `Lead form: …`. `git log` reads as a changelog of the site.
- **Photos** are 3:2 WebP in two sizes (`-800` and `-1200`), kept in `assets/photos/`.
- **Claude preview:** `python3 tools/make-preview.py preview.html` builds a copy where all five pages open, including Хөтөлбөр, with a small page switcher. Use it to review unpublished pages without touching the live site.
- **Continuing with Claude Code:** open this repo in Claude Code (claude.ai/code, or the CLI), then start with: *"Read README.md and HANDOVER.md, then …"*. The old chat history stayed on a computer that's no longer available, but everything it produced is in this repo and its commit history.
