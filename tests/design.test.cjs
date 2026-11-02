const {test}=require('node:test');
const assert=require('node:assert/strict');
const {normalizeDesign,paintAsteroid}=require('../src/main/resources/static/design.js');
test('design validates outline and normalizes hex, with safe defaults',()=>{
 for(const outline of ['black','white','none'])assert.equal(normalizeDesign(outline,'#AbC123').outline,outline);
 assert.equal(normalizeDesign('none','#AbC123').background,'#abc123');
 assert.deepEqual(normalizeDesign('unknown','invalid'),{outline:'white',background:'#101927',labelColor:'#ffffff'});
});
test('canvas labels contrast with white and dark backgrounds',()=>{
 assert.equal(normalizeDesign('none','#ffffff').labelColor,'#000000');
 assert.equal(normalizeDesign('none','#000000').labelColor,'#ffffff');
 assert.equal(normalizeDesign('none','#251a21').labelColor,'#ffffff');
});
test('both views honor black, white and genuinely no outline; geometry unchanged',()=>{
 for(const mode of ['linear','layered'])for(const outline of ['black','white','none']){
  const calls=[];const ctx={beginPath(){},arc(...args){calls.push(args)},fill(){calls.push('fill')},stroke(){calls.push(this.strokeStyle)}};
  const a={x:100,y:80,radius:30};const original={...a};
  paintAsteroid(ctx,a,'#77e0cd',mode,normalizeDesign(outline,'#ffffff'));
  assert.deepEqual(calls[0],[100,80,30,0,Math.PI*2]);assert.equal(calls[1],'fill');
  assert.equal(calls.length,outline==='none'?2:3);
  if(outline!=='none')assert.equal(calls[2],outline==='black'?'#000000':'#ffffff');
  assert.deepEqual(a,original);assert.equal(ctx.globalAlpha,1);
 }
});
test('design controls redraw immediately without fetching, preset/custom states stay synced',()=>{
 const vm=require('node:vm'),fs=require('node:fs');
 const elements={},fills=[];const context={scale(){},fillRect(){fills.push(this.fillStyle)},beginPath(){},moveTo(){},lineTo(){},stroke(){},fillText(){}};
 const el=id=>elements[id]??=( {value:'',clientWidth:800,clientHeight:360,addEventListener(event,fn){this[event]=fn},getContext(){return context}} );
 el('background-color').value='#101927';el('outline').value='white';el('view-mode').value='linear';
 let fetches=0;
 const sandbox={document:{getElementById:el},window:{devicePixelRatio:1},ResizeObserver:class{observe(){}},normalizeDesign,paintAsteroid,layoutAsteroids:()=>[],fetch(){fetches++}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../src/main/resources/static/app.js'),'utf8'),sandbox);
 el('background-preset').value='#ffffff';el('background-preset').change();assert.equal(el('background-color').value,'#ffffff');assert.equal(fills.at(-2),'#ffffff');assert.equal(fills.at(-1),'#173b4a');
 el('background-color').value='#123456';el('background-color').input();assert.equal(el('background-preset').value,'custom');assert.equal(fills.at(-2),'#123456');
 el('outline').value='none';el('outline').change();assert.equal(fetches,0);
});
