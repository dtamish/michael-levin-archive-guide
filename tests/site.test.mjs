import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseRoute,topicItems,trustedDownloadUrl} from '../app.js';

const text=await readFile(new URL('../data/archive.json',import.meta.url),'utf8');
const data=JSON.parse(text);
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const js=await readFile(new URL('../app.js',import.meta.url),'utf8');
const css=await readFile(new URL('../styles.css',import.meta.url),'utf8');

const sectionTotal=data.meta.sections.reduce((sum,section)=>sum+section.count,0);

test('schema has 72 unique items and seven complete topics',()=>{
 assert.equal(data.items.length,72);
 assert.equal(data.meta.total,72);
 assert.equal(sectionTotal,72);
 assert.equal(data.meta.sections.length,7);
 assert.equal(new Set(data.items.map(item=>item.id)).size,72);
 assert.equal(new Set(data.items.map(item=>item.sourceUrl)).size,72);
 for(const section of data.meta.sections){
  assert.equal(topicItems(data,section.id).length,section.count,section.id);
  assert.ok(section.description.length>30,section.id);
 }
});

test('default screen is topic-first and does not contain an all-records surface',()=>{
 assert.match(html,/data-chooser/);
 assert.match(html,/data-topic-grid/);
 assert.match(html,/בחירת נושא/);
 assert.doesNotMatch(html,/כל חומרי הגלם|data-media-filters|data-rights-filters|rights-legend|data-start-leads/);
 assert.match(html,/data-topic-workspace hidden/);
 assert.match(js,/renderChooser\(\)/);
 assert.match(js,/q\('\[data-chooser\]'\)\.hidden=true/);
});

test('selecting any topic returns every item in it and search stays scoped',()=>{
 for(const section of data.meta.sections){
  const all=topicItems(data,section.id);
  assert.equal(all.length,section.count,section.id);
  const first=all[0];
  assert.ok(topicItems(data,section.id,first.id).some(item=>item.id===first.id));
  assert.ok(topicItems(data,section.id,'מחרוזת שלא קיימת').length===0);
 }
 assert.match(html,/חיפוש בתוך הנושא/);
 assert.match(html,/data-back-topics/);
 assert.match(html,/data-result-count/);
});

test('preview play control mounts the official player on its first click',()=>{
 assert.match(js,/button\.addEventListener\('click',\(\)=>mountOfficialPlayer\(item,media,button\),\{once:true\}\)/);
 assert.match(js,/stage\.replaceChildren\(iframe\)/);
 assert.match(js,/iframe\.title=`נגן רשמי/);
 assert.doesNotMatch(html,/item-load-player/);
 assert.match(html,/source-button/);
 const playable=data.items.filter(item=>item.preview?.embedUrl);
 assert.equal(playable.length,40);
});

test('all 72 cards have honest source and Drive fallbacks even without previews',()=>{
 assert.equal(data.items.filter(item=>!item.preview).length,28);
 for(const item of data.items){
  assert.match(item.id,/^ML-\d{3}$/);
  assert.match(item.sourceUrl,/^https?:\/\//);
  assert.match(item.driveUrl,/^https:\/\/drive\.google\.com\//);
 }
 assert.match(js,/תצוגה מקדימה אינה זמינה/);
 assert.match(js,/החומר נשאר בקישור המקור/);
});

test('only the four verified CC files receive trusted direct downloads',async()=>{
 const downloadable=data.items.filter(item=>item.downloadAuthorized===true);
 assert.deepEqual(downloadable.map(item=>item.id),['ML-068','ML-069','ML-071','ML-072']);
 assert.equal(data.items.filter(item=>item.downloadUrl).length,4);
 for(const item of downloadable){
  assert.equal(item.rightsGroup,'open');
  assert.match(item.downloadUrl,/^assets\/downloads\/ML-\d{3}\.jpg$/);
  assert.equal(trustedDownloadUrl(item),item.downloadUrl);
  assert.match(item.downloadLabel,/CC BY-SA 3\.0/);
  const file=await readFile(new URL(`../${item.downloadUrl}`,import.meta.url));
  assert.ok(file.length>100_000,item.id);
  assert.deepEqual([...file.subarray(0,3)],[0xff,0xd8,0xff],item.id);
 }
 assert.equal(trustedDownloadUrl({downloadAuthorized:false,downloadUrl:downloadable[0].downloadUrl}),'');
 assert.equal(trustedDownloadUrl({downloadAuthorized:true,downloadUrl:'http://upload.wikimedia.org/file.jpg'}),'');
 assert.equal(trustedDownloadUrl({downloadAuthorized:true,downloadUrl:'https://evil.example/file.jpg'}),'');
 assert.equal(trustedDownloadUrl({downloadAuthorized:true,downloadUrl:'assets/downloads/../secret.jpg'}),'');
 assert.equal(data.items.filter(item=>item.rightsGroup==='open').length,4);
 assert.equal(data.meta.openLicensed,4);
});

test('deep links support topics and items without render-time forced scrolling',()=>{
 const topic=data.meta.sections[0].id;
 assert.deepEqual(parseRoute(`#topic/${encodeURIComponent(topic)}`),{kind:'topic',id:topic});
 assert.deepEqual(parseRoute('#item/ML-068'),{kind:'item',id:'ML-068'});
 assert.deepEqual(parseRoute('#item/not-valid'),{kind:'topics'});
 assert.match(js,/window\.addEventListener\('popstate'/);
 assert.doesNotMatch(js,/openHashItem/);
 assert.match(js,/history\.pushState/);
});

test('loading, error, empty, reset and progressive details states exist',()=>{
 for(const marker of ['data-loading','data-load-error','data-empty','data-retry','data-clear-topic','data-clear-results','asset-details'])assert.match(html,new RegExp(marker));
 assert.match(html,/פרטי מקור, אימות וזכויות/);
 assert.match(html,/role="alert"/);
 assert.doesNotMatch(html,/data-total>0|data-section-count>0|data-open-count>0/);
});

test('responsive and keyboard foundations cover a 390px viewport',()=>{
 assert.match(css,/@media\(max-width:520px\)/);
 assert.match(css,/min-width:0/);
 assert.match(css,/overflow-wrap:anywhere/);
 assert.match(css,/:focus-visible/);
 assert.match(html,/width=device-width/);
 assert.match(js,/button\.className='preview-play'/);
 assert.match(js,/button\.type='button'/);
 assert.match(js,/aria-label/);
});

test('preview schema counts and media counts remain deterministic',()=>{
 const previews=data.items.filter(item=>item.preview);
 assert.equal(previews.length,44);
 assert.equal(data.meta.previewCount,44);
 assert.equal(data.meta.inlinePlayableCount,40);
 assert.equal(previews.filter(item=>item.preview.kind==='open-image').length,4);
 for(const [group,count] of Object.entries(data.meta.mediaCounts))assert.equal(data.items.filter(item=>item.mediaGroup===group).length,count,group);
 for(const forbidden of ['gettyimages','alamy.com','staticflickr','live.staticflickr'])assert.equal(JSON.stringify(previews).includes(forbidden),false);
});

test('site remains unindexed and excludes private production surfaces',()=>{
 assert.match(html,/noindex,nofollow,noarchive/);
 for(const forbidden of ['טיוטת_פנייה','תיק_בימוי_קיים','NOTION_API_KEY','GITHUB_TOKEN'])assert.equal((html+js+text).includes(forbidden),false);
});
