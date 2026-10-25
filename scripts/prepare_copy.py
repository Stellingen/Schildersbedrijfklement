"""Give static copy stable identities without changing its inline formatting."""
from html.parser import HTMLParser
from pathlib import Path
import hashlib,json,re
ROOT=Path(__file__).resolve().parent.parent
catalog={}
class Copy(HTMLParser):
 def __init__(self,source,page):
  super().__init__(convert_charrefs=False);self.source=source;self.page=page;self.stack=[];self.edits=[];self.count=0;self.lines=[0]
  for m in re.finditer('\n',source):self.lines.append(m.end())
 def handle_starttag(self,tag,attrs):
  if tag not in ['img','br','hr','input','meta','link','source','use','path']:self.stack.append((tag,dict(attrs)))
 def handle_endtag(self,tag):
  for i in range(len(self.stack)-1,-1,-1):
   if self.stack[i][0]==tag:self.stack=self.stack[:i];break
 def handle_data(self,data):
  tags=[t for t,a in self.stack]
  if 'main' not in tags or not data.strip() or any(t in tags for t in ['script','style','svg','form','button','dialog','canvas','site-copy']):return
  if not any(t in tags for t in ['h1','h2','h3','p','li','a','strong','blockquote']):return
  if any('photo-contact-sheet' in a.get('class','') for t,a in self.stack):return
  self.count+=1;key=hashlib.sha256((self.page+':'+str(self.count)+':'+data).encode()).hexdigest()[:16]
  catalog.setdefault(self.page,{})[key]=data
  row,col=self.getpos();start=self.lines[row-1]+col
  self.edits.append((start,len(data),'<site-copy data-copy="'+key+'">'+data+'</site-copy>'))
for p in sorted((ROOT/'dist').rglob('index.html')):
 if 'admin' in p.parts:continue
 page='/'+str(p.parent.relative_to(ROOT/'dist')).replace('.','').strip('/')
 if not page.endswith('/'):page+='/'
 source=p.read_text()
 # Idempotent: remove only our wrappers when rebuilding the catalog.
 source=re.sub(r'<site-copy data-copy="[a-f0-9]+">([\s\S]*?)</site-copy>',lambda m:m[1],source)
 parser=Copy(source,page);parser.feed(source)
 for start,n,value in reversed(parser.edits):source=source[:start]+value+source[start+n:]
 p.write_text(source)
(ROOT/'server'/'copy-defaults.json').write_text(json.dumps(catalog,ensure_ascii=False))
