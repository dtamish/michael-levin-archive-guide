import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const text=await readFile(new URL('../data/archive.json',import.meta.url),'utf8');
const data=JSON.parse(text);
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const js=await readFile(new URL('../app.js',import.meta.url),'utf8');

test('catalog contains the verified 72 unique sources',()=>{
 assert.equal(data.items.length,72);
 assert.equal(new Set(data.items.map(x=>x.id)).size,72);
 assert.equal(new Set(data.items.map(x=>x.sourceUrl)).size,72);
});
test('all items have navigable source and Drive handles',()=>{
 for(const item of data.items){assert.match(item.id,/^ML-\d{3}$/);assert.match(item.sourceUrl,/^https?:\/\//);assert.match(item.driveUrl,/^https:\/\/drive\.google\.com\//)}
});
test('rights classification preserves the four open-license items',()=>{
 assert.equal(data.items.filter(x=>x.rightsGroup==='open').length,4);
 assert.equal(data.meta.openLicensed,4);
});
test('site is unindexed and omits private production surfaces',()=>{
 assert.match(html,/noindex,nofollow,noarchive/);
 for(const forbidden of ['טיוטת_פנייה','תיק_בימוי_קיים','NOTION_API_KEY','GITHUB_TOKEN']) assert.equal((html+js+text).includes(forbidden),false);
});
test('site exposes editor navigation affordances',()=>{
 for(const marker of ['archive-search','data-media-filters','data-rights-filters','data-section-nav','item-template']) assert.match(html,new RegExp(marker));
});
test('v2 explains what the editor sees and why it matters',()=>{
 for(const item of data.items){assert.ok(item.description.length>20,item.id);assert.ok(item.editorialUse.length>30,item.id);assert.ok(item.verificationNote.length>25,item.id)}
 assert.equal(data.meta.sections.length,7);
 for(const section of data.meta.sections){assert.ok(section.description.length>30,section.id);assert.ok(section.editorialUse.length>25,section.id)}
 assert.match(html,/למה זה חשוב לסרט/);
});
test('rights-safe previews are available without copying protected stills',()=>{
 const previewItems=data.items.filter(x=>x.preview);
 assert.equal(previewItems.length,44);
 assert.equal(data.meta.previewCount,44);
 assert.equal(data.meta.inlinePlayableCount,40);
 assert.equal(previewItems.filter(x=>x.preview.kind==='youtube').length,37);
 assert.equal(previewItems.filter(x=>x.preview.kind==='facebook').length,2);
 assert.equal(previewItems.filter(x=>x.preview.kind==='archive-audio').length,1);
 const openImages=previewItems.filter(x=>x.preview.kind==='open-image');
 assert.equal(openImages.length,4);
 assert.ok(openImages.every(x=>x.rightsGroup==='open'));
 const serialized=JSON.stringify(previewItems.map(x=>x.preview));
 for(const forbidden of ['gettyimages','alamy.com','staticflickr','live.staticflickr']) assert.equal(serialized.includes(forbidden),false);
 for(const item of previewItems){
  if(item.preview.thumbnailUrl) assert.match(item.preview.thumbnailUrl,/^(assets\/previews\/ML-\d{3}\.webp|https:\/\/(i\.ytimg\.com|commons\.wikimedia\.org|upload\.wikimedia\.org|archive\.org)\/)/);
  if(item.preview.embedUrl) assert.match(item.preview.embedUrl,/^https:\/\/(www\.youtube-nocookie\.com|www\.facebook\.com|archive\.org)\//);
 }
});
test('preview UI is lazy, accessible and keeps source fallback',()=>{
 for(const marker of ['item-preview-summary','item-viewer','item-load-player']) assert.match(html,new RegExp(marker));
 assert.match(js,/iframe\.title=/);
 assert.match(js,/loading='lazy'/);
 assert.match(js,/youtube-nocookie\.com/);
 assert.match(js,/widget_referrer/);
 assert.match(js,/location\.origin/);
 assert.match(js,/צפייה כאן אינה אישור/);
});

test('local preview allowlist supports the GitHub Pages repository prefix',()=>{
 const livePath=new URL('assets/previews/ML-068.webp','https://dtamish.github.io/michael-levin-archive-guide/').pathname;
 assert.match(livePath,/\/assets\/previews\/ML-\d{3}\.webp$/);
 assert.doesNotMatch('/michael-levin-archive-guide/assets/previews/not-archive.jpg',/\/assets\/previews\/ML-\d{3}\.webp$/);
 assert.match(js,/LOCAL_PREVIEW_PATH\.test\(u\.pathname\)/);
});

test('every story section exposes honest image and video counts',()=>{
 for(const section of data.meta.sections){
  assert.ok(section.mediaCounts,section.id);
  assert.ok(Number.isInteger(section.mediaCounts.stills),section.id);
  assert.ok(Number.isInteger(section.mediaCounts.video),section.id);
  const items=data.items.filter(x=>x.section===section.id);
  assert.equal(section.mediaCounts.stills,items.filter(x=>x.mediaGroup==='stills').reduce((n,x)=>n+(x.assetCount??1),0),section.id);
  assert.equal(section.mediaCounts.video,items.filter(x=>x.mediaGroup==='video').reduce((n,x)=>n+(x.assetCount??1),0),section.id);
 }
 assert.match(js,/sectionMediaSummary/);
});
