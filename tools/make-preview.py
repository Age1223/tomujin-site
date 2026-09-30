"""Builds the Claude artifact preview from index.html.

The live site (index.html on Vercel) opens only the pages listed in PUBLISHED. The preview is the same
page with every page allowed to open, so the unpublished ones can be reviewed and commented on. Everything else is left
exactly as on the live site, so the preview's homepage matches the published one. A small preview-only
bar in the bottom-left corner switches between the pages.

    python3 tools/make-preview.py OUTPUT_PATH
"""
import os
import re
import sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'preview.html')
src = open(os.path.join(root, 'index.html'), encoding='utf-8').read()

# The artifact host adds its own <html>/<head>/<body>, so keep only the head's contents and the body's contents
head = src[src.index('<!-- page-head -->\n') + len('<!-- page-head -->\n'):src.index('</head>')]
body = src[src.index('<body>\n') + len('<body>\n'):src.rindex('</body>')]
page = head + body
# Keep things marked hidden actually hidden (index.html sets this above the copied part of its head)
page = '<style>[hidden]{display:none!important}</style>\n' + page

# Every page can be opened, including the ones not public yet on the live site
page, n = re.subn(r'var PUBLISHED = \[[^\]]*\];', 'var PUBLISHED = ["home", "about", "program", "admissions", "outcomes"];', page)
assert n == 1, 'PUBLISHED line not found in index.html'

# Preview-only page switcher. The site's router marks the open page's link with aria-current, as it does for the menu.
PAGES = [('home', 'Нүүр'), ('about', 'Бидний тухай'), ('program', 'Хөтөлбөр'),
         ('outcomes', 'Бидний үр дүн'), ('admissions', 'Элсэлт')]
links = ''.join('<a href="#%s" data-nav="%s">%s</a>' % (pid, pid, label) for pid, label in PAGES)
bar = ('<nav class="preview-bar" aria-label="Урьдчилсан харагдац"><strong>Урьдчилсан харагдац</strong>' + links + '</nav>\n'
       '<style>'
       '.preview-bar{position:fixed;left:16px;bottom:16px;z-index:59;display:flex;flex-wrap:wrap;align-items:center;gap:2px;'
       'max-width:calc(100vw - 32px);padding:5px;border-radius:14px;background:#1a0b2e;color:#fff;'
       'font:600 12px/1.2 Raleway,system-ui,sans-serif;box-shadow:0 6px 16px -6px rgba(0,0,0,.45)}'
       '.preview-bar strong{padding:0 8px 0 7px;color:rgba(255,255,255,.65);font-weight:700}'
       '.preview-bar a{padding:6px 10px;border-radius:9999px;color:#fff;text-decoration:none}'
       '.preview-bar a:hover{background:rgba(255,255,255,.12);text-decoration:none}'
       '.preview-bar a[aria-current="page"]{background:#fff;color:#1a0b2e}'
       '@media (max-width:1000px){.preview-bar{bottom:84px}.preview-bar strong{display:none}}'
       '@media (max-width:640px){.preview-bar{left:12px;right:12px;bottom:72px;justify-content:center}}'
       '</style>\n')
page = page.replace('<footer class="site-footer">', bar + '<footer class="site-footer">', 1)

open(out, 'w', encoding='utf-8').write(page)
print(out)
