from pathlib import Path
import json, shutil
from PIL import Image, ImageDraw, ImageFont

HERE=Path(__file__).resolve().parent
OUT=HERE/'vector-derived-controls'
OUT.mkdir(exist_ok=True)
FONT=Path('C:/flutter/flutter/bin/cache/artifacts/material_fonts/materialicons-regular.otf')
CODES={line.split()[0]:int(line.split()[1],16) for line in FONT.with_name('codepoints').read_text().splitlines() if len(line.split())==2}
font=ImageFont.truetype(str(FONT),512)
mapping={}
def group(names, icon):
    for name in names.split('|'): mapping[name+'.png']=icon
group('0|Paper|document','description')
group('1|visibility|show','visibility')
group('2|9|Bold3User','groups')
group('3|Calendar|date_icon','event')
group('4','mark_chat_read')
group('5|location','location_on')
group('Backward10s','replay_10')
group('Forward10s','forward_10')
group('Chat|comment|live_chat','chat_bubble_outline')
group('comment_1','chat_bubble')
group('Collapse','fullscreen_exit')
group('Expand','fullscreen')
group('Next','skip_next')
group('Previous','skip_previous')
group('Subtitle|caption','closed_caption')
group('TimeCircle|history_icon|timeCirclePink','history')
group('Timer','timer')
group('Wallet','account_balance_wallet')
group('accept|done|green_tick|tick|white_tik','check')
group('activity','timer')
group('ad_icon|ad_round','featured_video')
group('add|plus','add')
group('arrowRightCircle','arrow_circle_right')
group('arrow_back','arrow_back')
group('arrow_double_right','keyboard_double_arrow_right')
group('arrow_down|boldArrowDown','expand_more')
group('arrow_right','chevron_right')
group('audio','mic_none')
group('beauty|heartEffects','face_retouching_natural')
group('boldBookmark','bookmark')
group('bookmark|watch_later','bookmark_border')
group('boldFilter|filter','tune')
group('boldShare|share_icon','share')
group('boldSpeed|speed|watch','speed')
group('camera','photo_camera')
group('clear_icon|ic_delete_video|remove','delete')
group('closeSquare|close_icon','close')
group('coin|coin_icon|coin_icon_grey|monetization','monetization_on')
group('convert_icon','currency_exchange')
group('copy_icon','content_copy')
group('daily_gift_icon|gift_icon|earn_reward_icon','redeem')
group('dangerSquare','warning_amber')
group('dark_mode','dark_mode')
group('delete_account','person_remove')
group('dislike_icon','thumb_down_off_alt')
group('dislike_bold','thumb_down')
group('down_arrow_bold','arrow_downward')
group('download|download_1|download_bold|videoDownload|premium_download','file_download')
group('edit|editButton|ic_edit_video','edit')
group('effects','auto_awesome')
group('email','mail_outline')
group('engagement_icon','insights')
group('fingerPrint','fingerprint')
group('flag|flage|flages|report','outlined_flag')
group('flash','flash_on')
group('flip','flip_camera_android')
group('free','verified')
group('gallery|set_thumbnail','image')
group('go_live','sensors')
group('hide','visibility_off')
group('incognito','privacy_tip')
group('infoSquare','help_outline')
group('king','workspace_premium')
group('language|translate','language')
group('like','thumb_up_off_alt')
group('like_bold','thumb_up')
group('lock|lock2|password','lock_outline')
group('logout','logout')
group('moreCircle|moreThreeCircle','more_horiz')
group('moreSquare','more')
group('music|sound','music_note')
group('notification|noty_icon','notifications_none')
group('paid|video_charges','paid')
group('pause|puse','pause')
group('play|play_video','play_arrow')
group('profile|profileLogo','person_outline')
group('promote_video|trending','trending_up')
group('recording','fiber_manual_record')
group('referral_icon','group_add')
group('reply','reply')
group('scan','qr_code_scanner')
group('search','search')
group('send|text_send','send')
group('setting','settings')
group('shieldDone','verified_user')
group('shuffle','shuffle')
group('square','check_box_outline_blank')
group('subscription_plan','card_membership')
group('swap','swap_horiz')
group('swape','repeat')
group('tv','tv')
group('up_arrow_bold','arrow_upward')
group('upload','file_upload')
group('videoBlack','smart_display')

extra={
'Create':'add','Tasker':'checklist','Ad credits':'campaign','Campaign analytics':'insights',
'Privacy policy':'policy','Payment history':'receipt_long','Referral history':'manage_history',
'Volume high':'volume_up','Volume low':'volume_down','Mute':'volume_off','Stop':'stop',
'Retry':'refresh','External link':'open_in_new','Copy link':'link','Phone sign-in':'call',
'QR code':'qr_code_2','Withdraw to bank':'account_balance','Device security':'phonelink_lock',
'VPN restriction':'gpp_bad','Legal support':'balance','Pending':'hourglass_empty',
'Access restricted':'gpp_bad','Support contact':'support_agent'}
simple={'add','check','close','arrow_back','chevron_right','expand_more','arrow_downward','arrow_upward',
'keyboard_double_arrow_right','fullscreen','fullscreen_exit','play_arrow','pause','stop','skip_next','skip_previous',
'more_horiz','file_download','file_upload','refresh','repeat','swap_horiz','trending_up','tune','volume_up','volume_down',
'volume_off','reply','search','send','fiber_manual_record','replay_10','forward_10','open_in_new','link','call','music_note'}

def resolve(icon, name):
    filled='bold' in name.lower() or name in ['comment_1.png','like_bold.png','dislike_bold.png']
    variants=['rounded','outlined','baseline'] if icon in simple or filled else ['outlined','rounded','baseline']
    for variant in variants:
        key=f'{icon}_{variant}'
        if key in CODES:return key
    raise ValueError(f'No matching glyph: {name}: {icon}')

def nav(name):
    im=Image.new('RGBA',(768,768))
    d=ImageDraw.Draw(im)
    k=32
    def box(coords,radius=3,width=2,fill=None):
        d.rounded_rectangle(tuple(round(v*k) for v in coords),radius=int(radius*k),outline=(0,0,0,255),width=int(width*k),fill=fill)
    def triangle(coords, fill=(0,0,0,255)):
        d.polygon([(int(x*k),int(y*k)) for x,y in coords],fill=fill)
    selected=name in ['boldHome.png','boldVideo.png','boldPlay.png','boldDocument.png']
    black=(0,0,0,255);clear=(0,0,0,0)
    if name in ['home.png','boldHome.png']:
        points=[(3.5,10),(12,3.5),(20.5,10),(19,10),(19,20),(14.5,20),(14.5,13),(9.5,13),(9.5,20),(5,20),(5,10),(3.5,10)]
        coords=[(int(x*k),int(y*k)) for x,y in points]
        if selected:d.polygon(coords,fill=black)
        else:
            d.line(coords,fill=black,width=2*k,joint='curve')
            for x,y in points:d.ellipse((x*k-k,y*k-k,x*k+k,y*k+k),fill=black)
    elif name in ['Video.png','boldVideo.png']:
        box((5,2.5,19,21.5),radius=3.5,fill=black if selected else None)
        triangle([(10,8),(16,12),(10,16)],clear if selected else black)
    elif name in ['videoCircle.png','boldPlay.png']:
        box((3,3,19,16),radius=2.5)
        d.rounded_rectangle((5*k,7*k,22*k,21*k),radius=int(2.5*k),fill=clear)
        box((5,7,22,21),radius=2.5,fill=black if selected else None)
        triangle([(11,10.5),(16,14),(11,17.5)],clear if selected else black)
    elif name in ['library.png','boldDocument.png']:
        box((3,4,8,20),radius=1,fill=black if selected else None)
        box((10,4,15,20),radius=1,fill=black if selected else None)
        coords=[(16.5,5),(19.5,4),(21,18.7),(18,19.5),(16.5,5)]
        if selected:triangle(coords,black)
        else:d.line([(int(x*k),int(y*k)) for x,y in coords],fill=black,width=2*k,joint='curve')
    elif name=='king.png':
        pts=[(4,8),(8,12),(12,5),(16,12),(20,8),(18,19),(6,19),(4,8)]
        d.line([(int(x*k),int(y*k)) for x,y in pts],fill=black,width=2*k,joint='curve')
        d.line((6*k,22*k,18*k,22*k),fill=black,width=2*k)
    elif name in ['coin.png','coin_icon.png','coin_icon_grey.png']:
        d.ellipse((3*k,3*k,21*k,21*k),outline=black,width=2*k)
        pts=[(7,15),(11,8),(14,12),(16,9),(19,15)]
        d.line([(int(x*k),int(y*k)) for x,y in pts],fill=black,width=int(1.5*k),joint='curve')
    elif name=='activity.png':
        d.ellipse((3*k,3*k,21*k,21*k),outline=black,width=2*k)
        for a,b in [((12,3),(12,5)),((3,12),(5,12)),((12,19),(12,21))]:
            d.line((a[0]*k,a[1]*k,b[0]*k,b[1]*k),fill=black,width=int(1.5*k))
        triangle([(10,8),(16,12),(10,16)])
    elif name=='monetization.png':
        d.ellipse((2*k,4*k,17*k,19*k),outline=black,width=2*k)
        d.line([(6*k,14*k),(9*k,9*k),(12*k,13*k),(14*k,10*k)],fill=black,width=int(1.5*k),joint='curve')
        d.line([(14*k,20*k),(22*k,8*k),(22*k,14*k)],fill=black,width=2*k,joint='curve')
        d.line((16*k,8*k,22*k,8*k),fill=black,width=2*k)
    elif name in ['paid.png','video_charges.png','free.png']:
        box((2,3,21,18),radius=3)
        triangle([(7,7),(13,10.5),(7,14)])
        d.ellipse((13*k,12*k,24*k,23*k),fill=clear)
        d.ellipse((14*k,13*k,23*k,22*k),outline=black,width=int(1.5*k))
        pts=[(16,17.5),(18,19.5),(21,16)] if name=='free.png' else [(16,19),(18,15.5),(20.5,19)]
        d.line([(int(x*k),int(y*k)) for x,y in pts],fill=black,width=int(1.2*k),joint='curve')
    return im

jobs=json.loads((HERE/'generation-jobs.json').read_text(encoding='utf-8-sig'))
nav_names={'home.png','boldHome.png','Video.png','boldVideo.png','videoCircle.png','boldPlay.png','library.png','boldDocument.png'}
custom_names=nav_names|{'king.png','coin.png','coin_icon.png','coin_icon_grey.png','activity.png','monetization.png','paid.png','video_charges.png','free.png'}
manifest=[]
def render(name, icon=None, category='UI glyph'):
    if name in custom_names:
        im=nav(name);key='custom YouPeak geometric symbol'
    else:
        key=resolve(icon,name)
        char=chr(CODES[key]);b=font.getbbox(char)
        im=Image.new('RGBA',(640,640));d=ImageDraw.Draw(im)
        d.text(((640-(b[2]-b[0]))/2-b[0],(640-(b[3]-b[1]))/2-b[1]),char,font=font,fill=(0,0,0,255))
    im.save(OUT/name)
    manifest.append({'file':name,'source':key,'category':category,'status':'new vector-derived PNG'})
for j in jobs:
    if j['Category']=='UI glyph':
        name=j['Filename']
        if name not in nav_names and name not in mapping:raise ValueError('Unmapped '+name)
        render(name,mapping.get(name))
for j in json.loads((HERE/'additional-generation-jobs.json').read_text()):
    render(j['file'],extra[j['name']],'Additional UI control')
render('card.png','credit_card','New file for declared path')
(HERE/'vector-controls-manifest.json').write_text(json.dumps(manifest,indent=2))
shutil.copy2(FONT.with_name('materialicons_license.txt'),OUT/'Material-Icons-LICENSE.txt')
print(json.dumps({'rendered':len(manifest),'output':str(OUT)},indent=2))
