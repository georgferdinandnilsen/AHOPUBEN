# Lager OVERLEVERING.html fra OVERLEVERING.md. Kjør: python3 verktoy/lag-html.py (fra mappen 00 overlevering)
import re, html, pathlib
src = pathlib.Path('OVERLEVERING.md').read_text()
def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', r'<img src="\2" alt="\1">', s)
    s = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', s)
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    s = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', s)
    s = re.sub(r'(?<![">])(https?://[^\s<]+)', r'<a href="\1">\1</a>', s)
    return s
out, lines, i = [], src.split('\n'), 0
st = {'list': None, 'p': False}
def close():
    if st['list']: out.append('</%s>' % st['list']); st['list'] = None
    if st['p']: out.append('</p>'); st['p'] = False
while i < len(lines):
    l = lines[i]
    if l.startswith('```'):
        close(); j = i + 1; buf = []
        while j < len(lines) and not lines[j].startswith('```'): buf.append(lines[j]); j += 1
        out.append('<pre>' + html.escape('\n'.join(buf)) + '</pre>'); i = j + 1; continue
    if l.startswith('|') and i + 1 < len(lines) and re.match(r'^\|[\s\-|]+\|$', lines[i+1]):
        close(); hdr = [c.strip() for c in l.strip('|').split('|')]; rows = []; j = i + 2
        while j < len(lines) and lines[j].startswith('|'): rows.append([c.strip() for c in lines[j].strip('|').split('|')]); j += 1
        out.append('<table><tr>' + ''.join('<th>%s</th>' % inline(c) for c in hdr) + '</tr>' + ''.join('<tr>' + ''.join('<td>%s</td>' % inline(c) for c in r) + '</tr>' for r in rows) + '</table>'); i = j; continue
    m = re.match(r'^(#{1,4})\s+(.*)', l)
    if m: close(); n = len(m.group(1)); out.append('<h%d>%s</h%d>' % (n, inline(m.group(2)), n)); i += 1; continue
    if l.strip() == '---': close(); out.append('<hr>'); i += 1; continue
    m = re.match(r'^(\s*)([-*]|\d+\.)\s+(.*)', l)
    if m:
        kind = 'ol' if m.group(2)[0].isdigit() else 'ul'
        if st['p']: out.append('</p>'); st['p'] = False
        if st['list'] != kind:
            if st['list']: out.append('</%s>' % st['list'])
            out.append('<%s>' % kind); st['list'] = kind
        txt = m.group(3)
        if txt.startswith('[ ] '): txt = txt[4:]
        out.append('<li>%s</li>' % inline(txt)); i += 1; continue
    if l.strip() == '': close(); i += 1; continue
    if l.startswith('!['): close(); out.append('<div class="shots">' + inline(l) + '</div>'); i += 1; continue
    if not st['p']: close(); out.append('<p>'); st['p'] = True
    else: out.append('<br>')
    out.append(inline(l)); i += 1
close()
css = """body{font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:860px;margin:40px auto;padding:0 24px;line-height:1.55;color:#111}
h1{font-size:30px;line-height:1.1}h2{font-size:22px;margin-top:40px;border-top:2px solid #000;padding-top:16px}h3{font-size:17px;margin-top:26px}
code{background:#f1f1f1;padding:1px 5px;border-radius:3px;font-size:14px}pre{background:#111;color:#fff;padding:14px 16px;border-radius:6px;overflow-x:auto;font-size:14px}
table{border-collapse:collapse;width:100%;margin:12px 0;font-size:14px}th,td{border:1px solid #ccc;padding:7px 9px;vertical-align:top;text-align:left}th{background:#f1f1f1}
img{max-width:100%}.shots img{width:48%;max-width:300px;margin:6px 1% 6px 0;vertical-align:top;border:1px solid #ddd}
a{color:#0000ff}hr{border:0;border-top:1px solid #ddd;margin:30px 0}li{margin:4px 0}
@media print{body{margin:0;max-width:none}h2{break-before:page}h2:first-of-type{break-before:auto}pre{white-space:pre-wrap}.shots img{width:30%}}"""
doc = '<!doctype html><html lang="nb"><head><meta charset="utf-8"><title>AHO Puben-appen: overlevering</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>%s</style></head><body>%s</body></html>' % (css, '\n'.join(out))
pathlib.Path('OVERLEVERING.html').write_text(doc); print('OVERLEVERING.html laget')
