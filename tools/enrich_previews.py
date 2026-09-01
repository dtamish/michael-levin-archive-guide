#!/usr/bin/env python
"""Add rights-safe, reproducible inline previews to archive.json.

Run after generate_data.py and enrich_editor_guide.py. The script embeds only
platform-provided players (YouTube, Facebook, Archive.org) and openly licensed
Wikimedia Commons stills. It does not hotlink rights-unclear photographs.
"""
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse
import json

COMMONS_THUMBS={
    'ML-068':'assets/previews/ML-068.webp',
    'ML-069':'assets/previews/ML-069.webp',
    'ML-071':'assets/previews/ML-071.webp',
    'ML-072':'assets/previews/ML-072.webp',
}
AUTHORIZED_DOWNLOADS={item_id:f'assets/downloads/{item_id}.jpg' for item_id in ('ML-068','ML-069','ML-071','ML-072')}

p=Path(__file__).resolve().parents[1]/'data'/'archive.json'
d=json.loads(p.read_text(encoding='utf-8'))
playable=image_count=0
for item in d['items']:
    item.pop('preview',None)
    item.pop('downloadAuthorized',None)
    item.pop('downloadUrl',None)
    item.pop('downloadLabel',None)
    url=item.get('sourceUrl','')
    parsed=urlparse(url)
    host=parsed.netloc.lower()
    preview=None
    if host in {'www.youtube.com','youtube.com','m.youtube.com'}:
        video_id=parse_qs(parsed.query).get('v',[''])[0]
        if len(video_id)==11:
            preview={
                'kind':'youtube',
                'thumbnailUrl':f'https://i.ytimg.com/vi/{video_id}/hqdefault.jpg',
                'embedUrl':f'https://www.youtube-nocookie.com/embed/{video_id}?rel=0',
                'alt':f'תמונה מקדימה לסרטון: {item["title"]}',
                'caption':'YouTube · הנגן נטען רק בלחיצה',
                'loadLabel':'ניגון הסרט באתר'
            }
    elif host in {'www.facebook.com','facebook.com'} and '/videos/' in parsed.path:
        preview={
            'kind':'facebook',
            'embedUrl':'https://www.facebook.com/plugins/video.php?href='+quote(url,safe='')+'&show_text=false&width=900',
            'alt':f'נגן Facebook לסרטון: {item["title"]}',
            'caption':'Facebook · נגן רשמי; זמינות תלויה בהרשאות המקור',
            'loadLabel':'ניגון הסרט באתר'
        }
    elif host=='archive.org' and '/details/' in parsed.path:
        identifier=parsed.path.split('/details/',1)[1].split('/',1)[0]
        if identifier:
            preview={
                'kind':'archive-audio',
                'thumbnailUrl':f'https://archive.org/services/img/{quote(identifier)}',
                'embedUrl':f'https://archive.org/embed/{quote(identifier)}',
                'alt':f'תמונה מקדימה לפריט האודיו: {item["title"]}',
                'caption':'Internet Archive · נגן אודיו מוטמע',
                'loadLabel':'ניגון האודיו באתר'
            }
    elif host=='commons.wikimedia.org' and '/wiki/File:' in parsed.path and item.get('rightsGroup')=='open':
        thumb=COMMONS_THUMBS.get(item['id'])
        if thumb:
            preview={
                'kind':'open-image',
                'thumbnailUrl':thumb,
                'alt':item.get('description') or item['title'],
                'caption':'Wikimedia Commons · תמונה ברישיון פתוח; תנאי הקרדיט בכרטיס',
            }
    if preview:
        item['preview']=preview
        if preview.get('embedUrl'): playable+=1
        else: image_count+=1
    if item['id'] in AUTHORIZED_DOWNLOADS and item.get('rightsGroup')=='open':
        item['downloadAuthorized']=True
        item['downloadUrl']=AUTHORIZED_DOWNLOADS[item['id']]
        item['downloadLabel']='הורדת קובץ מקור · CC BY-SA 3.0'
meta=d['meta']
meta['previewCount']=playable+image_count
meta['inlinePlayableCount']=playable
meta['inlineImageCount']=image_count
meta['metricRouteValue']=str(meta['previewCount'])
meta['metricRouteLabel']='פריטים עם preview או נגן באתר'
meta['heroRule']='רואים באתר · מבינים · ורק אז עוברים למקור'
meta['heroRuleNote']='נגנים רשמיים ותמונות ברישיון פתוח מוצגים כאן; חומר מוגן נשאר בקישור המקור.'
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'items':len(d['items']),'previews':meta['previewCount'],'playable':playable,'images':image_count},ensure_ascii=False))
