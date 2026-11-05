from pathlib import Path
import json, hashlib, zipfile
from PIL import Image
HERE=Path(__file__).resolve().parent
PACKAGE=HERE/'YouPeak-Premium-Asset-Pack'
rows=json.loads((PACKAGE/'manifest.json').read_text())
assert not any('pending or failed' in r['status'] for r in rows),'Incomplete image generation remains'
folders={'Additional UI control':'additional-controls','Built-in UI control':'built-in-controls','Case-sensitive declared alias':'declared-path-additions','Small status variant':'small-status-variants'}
checked=0
for r in rows:
    file=PACKAGE/folders.get(r['category'],'assets/icons')/r['filename']
    assert file.exists(),str(file)
    assert hashlib.sha256(file.read_bytes()).hexdigest()==r['sha256'],str(file)
    if file.suffix.lower() in ['.png','.jpg','.jpeg','.webp']:
        with Image.open(file) as im:
            im.load()
            assert min(im.size)>0,str(file)
            if r['status']=='new vector-derived PNG':
                assert im.mode=='RGBA' and im.getchannel('A').getextrema()==(0,255),str(file)
                assert im.getbbox(),str(file)
            if r['status']=='newly generated' and r['category']=='Illustration / badge / reaction' and file.suffix.lower()=='.png':
                assert im.mode=='RGBA' and im.getchannel('A').getextrema()[0]==0,'Expected transparent artwork: '+str(file)
        checked+=1
assert len([r for r in rows if r['category']=='Additional UI control'])==23
assert len([r for r in rows if r['category']=='New file for declared path'])==3
assert len([r for r in rows if r['category']=='Case-sensitive declared alias'])==1
assert len([r for r in rows if r['category'] in ['Illustration / badge / reaction','Background/composition'] and r['status']=='newly generated'])==125
archive=HERE/'YouPeak-Premium-Asset-Pack.zip'
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    for r in rows:
        file=PACKAGE/folders.get(r['category'],'assets/icons')/r['filename']
        assert str(file.relative_to(HERE)).replace('\\','/') in z.namelist()
report={'images_checked':checked,'asset_files':len(rows),'archive_crc':'passed','file_hashes':'passed','missing_assets':0,'archive_bytes':archive.stat().st_size}
(HERE/'final-validation.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
