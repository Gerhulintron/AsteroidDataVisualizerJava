const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pngFilename,downloadCanvasPng}=require('../src/main/resources/static/export.js');
function mock(result={type:'image/png'},clickFails=false){
 const events=[];const snapshot={getContext(){return{drawImage(...args){events.push(['pixels',...args])}}},toBlob(cb,type){events.push(['encode',type]);cb(result)}};
 const link={style:{},click(){events.push('click');if(clickFails)throw Error('blocked')},remove(){events.push('remove')}};
 const env={document:{createElement:t=>t==='canvas'?snapshot:link,body:{append(){events.push('append')}}},URL:{createObjectURL(){return'blob:test'},revokeObjectURL(url){events.push(['revoke',url])}},setTimeout(fn,ms){events.push(['delay',ms]);fn()}};
 return{events,snapshot,link,env};
}
test('date/mode filenames are deterministic and demo is explicit',()=>{
 assert.equal(pngFilename('2026-11-02','layered'),'asteroid-data-2026-11-02-layered.png');
 assert.equal(pngFilename('2026-11-02','linear',true),'asteroid-data-2026-11-02-linear-demo.png');
 assert.equal(pngFilename('../bad','bogus'),'asteroid-data-undated-linear.png');
});
test('PNG snapshots exact current canvas dimensions/pixels and cleans up',async()=>{
 const m=mock(),canvas={width:2200,height:720,currentSettings:'layered/curated/custom/none'};
 await downloadCanvasPng(canvas,'chosen.png',m.env);
 assert.equal(m.snapshot.width,2200);assert.equal(m.snapshot.height,720);
 assert.deepEqual(m.events[0],['pixels',canvas,0,0]);assert.deepEqual(m.events[1],['encode','image/png']);
 assert.equal(m.link.download,'chosen.png');assert.ok(m.events.includes('remove'));
 assert.deepEqual(m.events.at(-1),['revoke','blob:test']);assert.equal(canvas.currentSettings,'layered/curated/custom/none');
});
test('null blob and zero-size canvas fail without creating download links',async()=>{
 const m=mock(null);await assert.rejects(downloadCanvasPng({width:10,height:10},'x.png',m.env),/PNG creation failed/);
 assert.ok(!m.events.includes('append'));await assert.rejects(downloadCanvasPng({width:0,height:10},'x.png',m.env),/not ready/);
});
test('failed download dispatch still removes link and revokes URL',async()=>{
 const m=mock({},true);await assert.rejects(downloadCanvasPng({width:10,height:10},'x.png',m.env),/blocked/);
 assert.ok(m.events.includes('remove'));assert.deepEqual(m.events.at(-1),['revoke','blob:test']);
});
test('download UI requires loaded data, uses loaded date/current view and does not refetch',async()=>{
 const vm=require('node:vm'),fs=require('node:fs');const elements={},downloads=[];
 const ctx={scale(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fillText(){}};
 const el=id=>elements[id]??={value:'',disabled:false,clientWidth:800,clientHeight:360,addEventListener(event,fn){this[event]=fn},getContext(){return ctx}};
 let fetches=0;
 const sandbox={document:{getElementById:el},ResizeObserver:class{observe(){}},normalizeDesign:()=>({background:'#123456',labelColor:'#ffffff'}),layoutAsteroids:()=>[],pngFilename,downloadCanvasPng:async(c,f)=>downloads.push({canvas:c,filename:f}),fetch(){fetches++}};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(require.resolve('../src/main/resources/static/app.js'),'utf8'),sandbox);
 await el('download-png').click();assert.equal(downloads.length,0);
 vm.runInContext("loadedDate='2026-11-02';loadedDemo=true",sandbox);
 el('date').value='2027-01-01';el('view-mode').value='layered';
 await el('download-png').click();
 assert.equal(downloads[0].filename,'asteroid-data-2026-11-02-layered-demo.png');
 assert.equal(downloads[0].canvas.width,1600);assert.equal(downloads[0].canvas.height,720);
 assert.equal(fetches,0);assert.equal(el('download-png').disabled,false);assert.equal(el('date').value,'2027-01-01');
});
