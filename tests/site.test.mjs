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
