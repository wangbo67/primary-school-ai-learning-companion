"""Render this project's bounded script Markdown as an offline-readable HTML."""
from pathlib import Path
from html import escape
import re
root=Path(__file__).resolve().parents[1]
lines=(root/'docs/乌鸦喝水学习脚本.md').read_text().splitlines()
def inline(s):
 s=escape(s)
 s=re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',s)
 return s
out=[]; i=0
while i<len(lines):
 line=lines[i]
 if not line.strip(): i+=1;continue
 if line.startswith('|'):
  table=[]
  while i<len(lines) and lines[i].startswith('|'):
   row=[v.strip() for v in lines[i].strip('|').split('|')]
   if not all(re.fullmatch(r'[-: ]+',x) for x in row):table.append(row)
   i+=1
  out.append('<div class="table-wrap"><table><thead><tr>'+''.join('<th>'+inline(x)+'</th>' for x in table[0])+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+inline(x)+'</td>' for x in r)+'</tr>' for r in table[1:])+'</tbody></table></div>');continue
 m=re.match(r'^(#{1,3}) (.*)',line)
 if m:
  n=len(m[1]);out.append(f'<h{n}>'+inline(m[2])+f'</h{n}>');i+=1;continue
 if line.startswith('- ') or re.match(r'^\d+\. ',line):
  ordered=bool(re.match(r'^\d+\. ',line));tag='ol' if ordered else 'ul';items=[]
  while i<len(lines) and (re.match(r'^\d+\. ',lines[i]) if ordered else lines[i].startswith('- ')):
   items.append('<li>'+inline(re.sub(r'^(?:- |\d+\. )','',lines[i]))+'</li>');i+=1
  out.append(f'<{tag}>'+''.join(items)+f'</{tag}>');continue
 out.append('<p>'+inline(line)+'</p>');i+=1
html='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>《乌鸦喝水》学习脚本 · 给大人</title><style>
*{box-sizing:border-box}body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;color:#29414b;background:#f5f8fa;margin:0;line-height:1.85;font-size:17px}main{max-width:950px;margin:auto;padding:32px 30px 80px}nav{display:flex;justify-content:space-between;gap:20px;margin-bottom:40px;font-size:15px}a{color:#216653}button{font:inherit;background:white;border:1px solid #b9d0c3;border-radius:9px;padding:7px 15px;cursor:pointer;color:#216653}h1{font-size:34px;line-height:1.45;font-family:"Songti SC",serif}h2{font-size:24px;border-top:1px solid #d2e0e4;margin-top:45px;padding-top:30px}h3{font-size:19px;margin-top:25px}p{margin:16px 0}li{margin:9px 0}.table-wrap{overflow:auto;margin:22px 0}table{border-collapse:collapse;min-width:580px;width:100%;background:white;font-size:15px}th,td{padding:13px 15px;border:1px solid #d5e1e4;vertical-align:top;text-align:left}th{background:#e8f0ea;color:#2e604e}footer{margin-top:50px;font-size:14px;color:#59717b}@media(max-width:600px){main{padding:24px 20px 50px}h1{font-size:28px}}@media print{body{background:white}nav{display:none}main{padding:0;max-width:none}h2{break-after:avoid}.table-wrap{overflow:visible}table{min-width:0}tr{break-inside:avoid}}
</style><main><nav><a href="./">← 打开儿童试玩页</a><button onclick="window.print()">打印这份脚本</button></nav>'''+''.join(out)+'''<footer>本脚本与试玩页一起交付。页面中的文字、录音均由孩子和大人主动记录；未接入AI自动评价。</footer></main></html>'''
(root/'public/script.html').write_text(html)
print('Rendered script.html')
