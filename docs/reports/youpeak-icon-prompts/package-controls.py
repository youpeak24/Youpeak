from pathlib import Path
import json, zipfile, io
from PIL import Image, ImageDraw, ImageFont

HERE=Path(__file__).resolve().parent
source=HERE/'vector-derived-controls'
rows=json.loads((HERE/'vector-controls-manifest.json').read_text())
archive=HERE/'YouPeak-UI-Controls.zip'
archive_tmp=archive.with_name(archive.stem+'.building.zip')
with zipfile.ZipFile(archive_tmp,'w',zipfile.ZIP_DEFLATED) as z:
    for r in rows:
        name=r['file']
        with Image.open(source/name) as im:
            im.thumbnail((128,128),Image.Resampling.LANCZOS)
            buf=io.BytesIO();im.save(buf,format='PNG')
            z.writestr('YouPeak-UI-Controls/assets/icons/'+name,buf.getvalue())
        z.write(source/name,'YouPeak-UI-Controls/masters/'+name)
    z.write(source/'Material-Icons-LICENSE.txt','YouPeak-UI-Controls/Material-Icons-LICENSE.txt')
    z.write(HERE/'vector-controls-manifest.json','YouPeak-UI-Controls/manifest.json')
    builtin=json.loads((HERE/'built-in-controls-manifest.json').read_text())
    for row in builtin:
        name=row['filename'];file=HERE/'built-in-controls'/name
        with Image.open(file) as im:
            im.thumbnail((128,128),Image.Resampling.LANCZOS)
            buf=io.BytesIO();im.save(buf,format='PNG')
            z.writestr('YouPeak-UI-Controls/built-in-controls/'+name,buf.getvalue())
        z.write(file,'YouPeak-UI-Controls/built-in-masters/'+name)
    z.write(HERE/'built-in-controls-manifest.json','YouPeak-UI-Controls/built-in-controls-manifest.json')
    z.writestr('YouPeak-UI-Controls/README.txt',f'{len(rows)} consistent transparent PNG controls, plus {len(builtin)} optional PNG equivalents of source-listed Flutter Icons symbols. The four main navigation destinations have custom matching outline and filled geometry. Other controls use the Material Icons vector font; license and per-file source maps included. 128px app exports and full-size masters are separate. The extra_* and built-in controls need explicit code references when adopted. Register any new asset subfolders in pubspec.yaml. Icons are black alpha images intended for runtime color tint. This archive contains controls only; larger illustrations and preserved official marks are in the complete asset pack.')
names=['home.png','boldHome.png','Video.png','boldVideo.png','videoCircle.png','boldPlay.png','library.png','boldDocument.png','search.png','Wallet.png','setting.png','notification.png','like.png','comment.png','extra_tasker.png','extra_privacy_policy.png']
sheet=Image.new('RGB',(1280,400),'#E9EEEB');d=ImageDraw.Draw(sheet)
font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',13)
for i,name in enumerate(names):
    x,y=i%8*160,i//8*200
    d.rounded_rectangle((x+4,y+4,x+156,y+165),radius=14,fill='white')
    with Image.open(source/name) as im:
        im.thumbnail((104,104),Image.Resampling.LANCZOS)
        sheet.paste(im,(x+80-im.width//2,y+85-im.height//2),im)
    d.text((x+6,y+176),name[:22],font=font,fill='#173126')
sheet.save(HERE/'YouPeak-UI-Controls-preview.jpg',quality=94)
with zipfile.ZipFile(archive_tmp) as z:assert z.testzip() is None
archive_tmp.replace(archive)
print(json.dumps({'zip':str(archive),'primary_controls':len(rows),'built_in_exports':len(builtin),'bytes':archive.stat().st_size}))
