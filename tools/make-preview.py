"""Builds the Claude artifact preview from index.html.

The live site (index.html on Vercel) shows only the homepage. The preview is the same page with every
page and menu switched on, so the unpublished pages can be reviewed and commented on.

    python3 tools/make-preview.py OUTPUT_PATH
"""
import os
import sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'preview.html')
src = open(os.path.join(root, 'index.html'), encoding='utf-8').read()

# The artifact host adds its own <html>/<head>/<body>, so keep only the head's contents and the body's contents
head = src[src.index('<!-- page-head -->\n') + len('<!-- page-head -->\n'):src.index('</head>')]
body = src[src.index('<body>\n') + len('<body>\n'):src.rindex('</body>')]
page = head + body

# Every page can be opened, and everything hidden for the homepage-only launch comes back
live = 'var PUBLISHED = ["home"];'
assert live in page, 'PUBLISHED line not found in index.html'
page = page.replace(live, 'var PUBLISHED = ["home", "about", "program", "admissions", "outcomes"];')
page = page.replace(' hidden data-later', ' data-later')

# A small label so nobody mistakes the preview for the live site
badge = ('<div class="preview-badge" role="note">Урьдчилсан харагдац: бүх хуудас. '
         'Vercel дээр зөвхөн Нүүр хуудас нийтлэгдсэн.</div>\n'
         '<style>.preview-badge{position:fixed;left:16px;bottom:16px;z-index:59;max-width:calc(100vw - 32px);'
         'padding:8px 12px;border-radius:9999px;background:#1a0b2e;color:#fff;font:600 12px/1.35 Raleway,system-ui,sans-serif;'
         'box-shadow:0 6px 16px -6px rgba(0,0,0,.4)}'
         '@media (max-width:640px){.preview-badge{left:12px;bottom:72px}}</style>\n')
page = page.replace('<footer class="site-footer">', badge + '<footer class="site-footer">', 1)

open(out, 'w', encoding='utf-8').write(page)
print(out)
