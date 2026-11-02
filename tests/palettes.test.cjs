const {test}=require('node:test');
const assert=require('node:assert/strict');
const {namedEntries,curated,original,asteroidColour}=require('../src/main/resources/static/palettes.js');
test('all curated name/value entries retained and hex duplicates deduplicated',()=>{
 assert.equal(namedEntries.length,320);assert.equal(new Set(namedEntries.map(e=>e[0])).size,317);
 assert.equal(curated.length,317);assert.equal(new Set(curated).size,317);
 assert.deepEqual(curated,[...new Set(namedEntries.map(e=>e[1]))]);
 for(const [name,hex] of namedEntries){assert.ok(name);assert.match(hex,/^#[0-9a-f]{6}$/);}
});
test('duplicate name variants and later themed colours are not overwritten',()=>{
 for(const name of ['BOLD_RED','CLEAR_BLUE','PAPER_MARIO_RED'])assert.equal(namedEntries.filter(e=>e[0]===name).length,2);
 for(const name of ['METROID_CYAN','PKMN_GS_HONEY_BROWN','AKIRA_NAVY_BLUE2','TR808_RED','RED_CAPE','ED_CAPE'])assert.ok(namedEntries.some(e=>e[0]===name));
 assert.ok(curated.includes('#ca2d23'));
});
test('original six retained and assignment is stable across views/sorts/refetch',()=>{
 assert.deepEqual(original,['#77e0cd','#e4b879','#9ca9ff','#ed9fc2','#8dbfe7','#c6d887']);
 for(const choice of ['original','curated']){
  const list=choice==='original'?original:curated;
  const a={id:'123',name:'Asteroid'};const result=asteroidColour(a,choice);
  assert.ok(list.includes(result));assert.equal(asteroidColour({...a,name:'Changed display name'},choice),result);
  assert.equal(asteroidColour(a,choice),result);
 }
 assert.equal(asteroidColour({id:'123'}),asteroidColour({id:'123'},'curated'));
});
