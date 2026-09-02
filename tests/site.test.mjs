import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {allTopics,parseRoute,topicItems,topicRequestTags,trustedDownloadUrl} from '../app.js';

const text=await readFile(new URL('../data/archive.json',import.meta.url),'utf8');
const data=JSON.parse(text);
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const js=await readFile(new URL('../app.js',import.meta.url),'utf8');
const css=await readFile(new URL('../styles.css',import.meta.url),'utf8');
const sectionTotal=data.meta.sections.reduce((sum,section)=>sum+section.count,0);

test('schema keeps 72 unique records in seven complete base topics',()=>{
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

test('Ruchami has one curated topic without duplicating archive records',()=>{
 const topic=data.meta.curatedTopics.find(entry=>entry.id==='לבקשת_רוחמי');
 assert.ok(topic);
 assert.equal(allTopics(data).length,8);
 assert.equal(topicItems(data,topic.id).length,25);
 assert.equal(new Set(topic.itemIds).size,25);
 assert.ok(topic.requestGroups.some(group=>group.label.includes('עוגת מגן דוד')));
 assert.ok(topic.requestGroups.some(group=>group.label.includes('השיר')));
 assert.ok(topicRequestTags(data,topic.id,'ML-040').some(tag=>tag.label.includes('A Hero in Heaven')));
});

test('default screen is topic-first and highlights the editor request',()=>{
 assert.match(html,/data-chooser/);
 assert.match(html,/data-topic-grid/);
 assert.match(html,/בחירת נושא/);
 assert.match(js,/is-curated/);
 assert.match(js,/בקשה עריכתית מרוכזת/);
 assert.match(html,/data-topic-workspace hidden/);
});

test('selecting any base or curated topic returns every item and scoped search works',()=>{
 for(const section of allTopics(data)){
  const all=topicItems(data,section.id);
  assert.equal(all.length,section.count,section.id);
  const first=all[0];
  assert.ok(topicItems(data,section.id,first.id).some(item=>item.id===first.id));
  assert.equal(topicItems(data,section.id,'מחרוזת שלא קיימת').length,0);
 }
 assert.match(html,/חיפוש בתוך הנושא/);
 assert.match(html,/data-back-topics/);
 assert.match(html,/data-result-count/);
});

test('all official media players mount immediately without a click gate',()=>{
 assert.match(js,/mountOfficialPlayer\(item,media,null,\{autoplay:false,focus:false\}\)/);
 assert.match(js,/stage\.replaceChildren\(iframe\)/);
 assert.match(js,/iframe\.title=`נגן רשמי/);
 assert.match(js,/iframe\.loading='lazy'/);
 assert.doesNotMatch(html,/item-load-player/);
 const playable=data.items.filter(item=>item.preview?.embedUrl);
 assert.equal(playable.length,40);
});

test('all cards have honest source fallbacks and no fake per-item Drive button',()=>{
 assert.equal(data.items.filter(item=>!item.preview).length,25);
 for(const item of data.items){
  assert.match(item.id,/^ML-\d{3}$/);
  assert.match(item.sourceUrl,/^https?:\/\//);
  assert.match(item.driveUrl,/^https:\/\/drive\.google\.com\//);
 }
 assert.match(js,/הקובץ עדיין לא נמצא בארכיון/);
 assert.match(js,/לבקש קובץ מקורי מבעל הזכויות/);
 assert.doesNotMatch(html,/drive-button/);
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
 assert.equal(trustedDownloadUrl({downloadAuthorized:true,downloadUrl:'https://evil.example/file.jpg'}),'');
 assert.equal(data.meta.openLicensed,4);
});

test('deep links support curated topics and archive items',()=>{
 assert.deepEqual(parseRoute(`#topic/${encodeURIComponent('לבקשת_רוחמי')}`),{kind:'topic',id:'לבקשת_רוחמי'});
 assert.deepEqual(parseRoute('#item/ML-068'),{kind:'item',id:'ML-068'});
 assert.deepEqual(parseRoute('#item/not-valid'),{kind:'topics'});
 assert.match(js,/window\.addEventListener\('popstate'/);
 assert.match(js,/history\.pushState/);
});

test('loading, error, empty, reset and progressive details states exist',()=>{
 for(const marker of ['data-loading','data-load-error','data-empty','data-retry','data-clear-topic','data-clear-results','asset-details'])assert.match(html,new RegExp(marker));
 assert.match(html,/פרטי מקור, אימות וזכויות/);
 assert.match(html,/role="alert"/);
});

test('responsive and keyboard foundations cover a 390px viewport',()=>{
 assert.match(css,/@media\(max-width:520px\)/);
 assert.match(css,/min-width:0/);
 assert.match(css,/overflow-wrap:anywhere/);
 assert.match(css,/:focus-visible/);
 assert.match(html,/width=device-width/);
 assert.match(js,/iframe\.loading='lazy'/);
 assert.match(js,/iframe\.allowFullscreen=true/);
});

test('preview schema counts stay deterministic and source images are explicitly marked',()=>{
 const previews=data.items.filter(item=>item.preview);
 assert.equal(previews.length,47);
 assert.equal(data.meta.previewCount,47);
 assert.equal(data.meta.inlinePlayableCount,40);
 assert.equal(data.meta.inlineImageCount,7);
 assert.equal(previews.filter(item=>item.preview.kind==='open-image').length,4);
 assert.equal(previews.filter(item=>item.preview.kind==='source-image').length,3);
 for(const item of data.items.filter(item=>item.preview?.kind==='source-image')){
  assert.match(item.preview.caption,/נדרש אישור לשימוש/);
 }
 for(const [group,count] of Object.entries(data.meta.mediaCounts))assert.equal(data.items.filter(item=>item.mediaGroup===group).length,count,group);
});

test('site remains unindexed and excludes private production surfaces',()=>{
 assert.match(html,/noindex,nofollow,noarchive/);
 for(const forbidden of ['טיוטת_פנייה','תיק_בימוי_קיים','NOTION_API_KEY','GITHUB_TOKEN'])assert.equal((html+js+text).includes(forbidden),false);
});
