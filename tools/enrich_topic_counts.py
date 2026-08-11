#!/usr/bin/env python
from pathlib import Path
import json

path = Path(__file__).resolve().parents[1] / 'data' / 'archive.json'
data = json.loads(path.read_text(encoding='utf-8'))
for item in data['items']:
    if 'assetCount' not in item:
        item['assetCount'] = 0 if item.get('rightsGroup') == 'family' and not item.get('sourceUrl') else (1 if item.get('mediaGroup') in ('stills','video') else 0)
for section in data['meta']['sections']:
    items = [x for x in data['items'] if x.get('section') == section['id']]
    section['mediaCounts'] = {
        'stills': sum(int(x.get('assetCount', 0)) for x in items if x.get('mediaGroup') == 'stills'),
        'video': sum(int(x.get('assetCount', 0)) for x in items if x.get('mediaGroup') == 'video'),
    }
data['meta']['assetMediaCounts'] = {
    'stills': sum(s['mediaCounts']['stills'] for s in data['meta']['sections']),
    'video': sum(s['mediaCounts']['video'] for s in data['meta']['sections']),
}
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('sections', len(data['meta']['sections']), 'media', data['meta']['assetMediaCounts'])
