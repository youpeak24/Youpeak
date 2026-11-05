from pathlib import Path
import re, json, shutil
from PIL import Image, ImageFont, ImageDraw
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
OUT=HERE/'built-in-controls'
OUT.mkdir(exist_ok=True)
FONT=Path('C:/flutter/flutter/bin/cache/artifacts/material_fonts/materialicons-regular.otf')
codes={p[0]:int(p[1],16) for line in FONT.with_name('codepoints').read_text().splitlines() if len(p:=line.split())==2}
names=set()
for file in (ROOT/'youpeak/lib').rglob('*.dart'):
    names.update(re.findall(r'(?<![A-Za-z])Icons\.(\w+)',file.read_text(encoding='utf-8')))
font=ImageFont.truetype(str(FONT),512)
manifest=[]
for name in sorted(names):
    candidates=[name,name+'_rounded',name+'_outlined',name+'_baseline']
    key=next((v for v in candidates if v in codes),None)
    if not key:raise ValueError(f'Unknown built-in glyph: {name}')
    char=chr(codes[key]);b=font.getbbox(char)
    im=Image.new('RGBA',(640,640));d=ImageDraw.Draw(im)
    d.text(((640-b[2]+b[0])/2-b[0],(640-b[3]+b[1])/2-b[1]),char,font=font,fill=(0,0,0,255))
    im.save(OUT/(name+'.png'))
    manifest.append({'filename':name+'.png','dart_symbol':'Icons.'+name,'font_glyph':key})
(HERE/'built-in-controls-manifest.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps({'built_in_controls':len(manifest)}))
