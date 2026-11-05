import os, zipfile, hashlib, json, urllib.request, urllib.error
key = os.environ.get('secretKey', '')
if not key: raise RuntimeError('Client key unavailable')
paths = [r'E:\Legendary One\youpeak\backups\rc-android-fix-2026-10-12\app-release-rc-android-fix-2026-10-12.apk',r'E:\Legendary One\youpeak\source\youpeak\build\app\outputs\flutter-apk\app-release.apk']
for path in paths:
    if not os.path.exists(path):
        print(json.dumps({'apk':path,'exists':False})); continue
    with zipfile.ZipFile(path) as z:
        hits = [name for name in z.namelist() if name.endswith('libapp.so') and key.encode() in z.read(name)]
    with open(path,'rb') as f: digest = hashlib.file_digest(f,'sha256').hexdigest()
    print(json.dumps({'apk':path,'sha256':digest,'productionKeyEmbedded':bool(hits),'matchingArchitectures':len(hits)}))
for path, data in [('/client/setting',None),('/client/user/login',b'{}')]:
    req=urllib.request.Request('https://api.youpeak.app'+path,data=data,headers={'key':key,'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=30) as r: status=r.status; body=json.load(r)
    except urllib.error.HTTPError as e:
        status=e.code
        try: body=json.load(e)
        except Exception: body={}
    print(json.dumps({'path':path,'httpStatus':status,'code':body.get('code'),'status':body.get('status'),'emptyLoginMessage':body.get('message') if data else None}))
