from pathlib import Path
import json, math
from PIL import Image, ImageDraw, ImageFont
HERE=Path(__file__).resolve().parent
OUT=HERE/'small-status-variants'
OUT.mkdir(exist_ok=True)
font_path=Path('C:/flutter/flutter/bin/cache/artifacts/material_fonts/materialicons-regular.otf')
codes={v[0]:int(v[1],16) for line in font_path.with_name('codepoints').read_text().splitlines() if len(v:=line.split())==2}
font=ImageFont.truetype(str(font_path),280)
notifications={'announcement':'campaign','bell':'notifications_none','live_now':'sensors','new_comment':'chat_bubble_outline','new_like':'thumb_up_off_alt','new_subscriber':'person_add','payment_success':'credit_card','reminder':'event_available','security':'verified_user','update':'system_update','warning':'warning_amber','withdrawal_sent':'account_balance'}
manifest=[]
for name,icon in notifications.items():
    im=Image.new('RGBA',(512,512));d=ImageDraw.Draw(im)
    bg,fg=('#E8F5E9','#0A7A44')
    if name=='live_now':bg,fg='#FDECEC','#D32F2F'
    if name=='warning':bg,fg='#FFF4CE','#946200'
    d.ellipse((48,48,464,464),fill=bg)
    key=next(k for k in [icon+'_outlined',icon+'_rounded',icon+'_baseline'] if k in codes)
    char=chr(codes[key]);b=font.getbbox(char)
    d.text(((512-b[2]+b[0])/2-b[0],(512-b[3]+b[1])/2-b[1]),char,font=font,fill=fg)
    file='notif_'+name+'.png';im.save(OUT/file)
    manifest.append({'filename':file,'role':'small notification variant','source':key})

for name in ['verified_badge','premium_badge','paid_video_badge','live_badge','new_badge','top_creator_badge','partner_district_badge','partner_digital_badge']:
    im=Image.new('RGBA',(512,512));d=ImageDraw.Draw(im)
    if name=='verified_badge':
        d.ellipse((84,84,428,428),fill='#087CFA')
        for i in range(12):
            a=i*math.tau/12;x=256+164*math.cos(a);y=256+164*math.sin(a)
            d.ellipse((x-40,y-40,x+40,y+40),fill='#087CFA')
        d.line([(158,258),(224,324),(357,190)],fill='white',width=42,joint='curve')
    elif name=='premium_badge':
        d.ellipse((48,48,464,464),fill='#0A7A44')
        d.polygon([(122,192),(202,250),(256,136),(310,250),(390,192),(354,360),(158,360)],fill='#FACC15')
    elif name=='paid_video_badge':
        d.ellipse((48,48,464,464),fill='#FACC15')
        d.line([(126,326),(218,174),(286,266),(332,202),(392,326)],fill='#0A7A44',width=32,joint='curve')
    elif name=='live_badge':
        d.ellipse((60,60,452,452),fill='#D32F2F')
        d.ellipse((222,222,290,290),fill='white')
        d.arc((160,160,352,352),start=-55,end=55,fill='white',width=24)
        d.arc((160,160,352,352),start=125,end=235,fill='white',width=24)
        d.arc((106,106,406,406),start=-55,end=55,fill='white',width=24)
        d.arc((106,106,406,406),start=125,end=235,fill='white',width=24)
    elif name=='new_badge':
        d.polygon([(256,48),(310,202),(464,256),(310,310),(256,464),(202,310),(48,256),(202,202)],fill='#087CFA')
    elif name=='top_creator_badge':
        pts=[]
        for i in range(10):
            a=-math.pi/2+i*math.pi/5;r=210 if i%2==0 else 106
            pts.append((256+r*math.cos(a),256+r*math.sin(a)))
        d.polygon(pts,fill='#FACC15')
        d.line([(195,287),(244,209),(286,267),(311,231)],fill='#0A7A44',width=22,joint='curve')
    else:
        d.regular_polygon((256,256,216),n_sides=6,rotation=0,fill='#087CFA' if name=='partner_digital_badge' else '#00A98F')
        icon='hub' if name=='partner_digital_badge' else 'location_on'
        key=next(k for k in [icon+'_outlined',icon+'_rounded',icon+'_baseline'] if k in codes)
        ch=chr(codes[key]);b=font.getbbox(ch)
        d.text(((512-b[2]+b[0])/2-b[0],(512-b[3]+b[1])/2-b[1]),ch,font=font,fill='white')
    im.save(OUT/(name+'.png'))
    manifest.append({'filename':name+'.png','role':'small status badge variant','source':'authored flat badge geometry / Material Icons glyph where applicable'})
(HERE/'small-status-manifest.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps({'small_status_variants':len(manifest)}))
