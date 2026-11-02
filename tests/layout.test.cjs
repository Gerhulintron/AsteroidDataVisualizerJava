const {test}=require('node:test');
const assert=require('node:assert/strict');
const {layoutAsteroids}=require('../src/main/resources/static/layout.js');
const row=(id,diameterM,missDistanceKm)=>({id,diameterM,missDistanceKm});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('layered is centered, largest first, smallest last',()=>{
 const input=[row('small',10,20),row('big',100,20),row('mid',50,20)];
 const result=layoutAsteroids(input,800,360,'layered');
 assert.deepEqual(result.map(a=>a.id),['big','mid','small']);
 for(const a of result) assert.equal(a.x,400);
 assert.deepEqual(input.map(a=>a.id),['small','big','mid']);
});
test('bottom-to-horizon gap is independent of diameter',()=>{
 const result=layoutAsteroids([row('a',10,200),row('b',100,200)],800,360,'layered');
 close(result[0].gap,result[1].gap);
 for(const a of result)close(312-(a.y+a.radius),a.gap);
});
test('positive distance has positive gap and larger distance increases gap',()=>{
 const result=layoutAsteroids([row('a',10,0),row('b',10,.00001),row('c',10,100)],800,360,'layered');
 assert.equal(result[0].gap,0);assert.ok(result[1].gap>0);assert.ok(result[2].gap>result[1].gap);
});
test('equal diameter and single object remain finite and equal-sized',()=>{
 for(const input of [[row('a',20,100)],[row('b',20,100),row('a',20,200)]]){
  const result=layoutAsteroids(input,320,330,'layered');
  for(const a of result){assert.ok(Number.isFinite(a.radius)&&a.radius>0);close(a.radius,result[0].radius);assert.ok(a.y-a.radius>=0);}
 }
});
test('missing, negative, zero-size and nonfinite measurements are excluded',()=>{
 assert.deepEqual(layoutAsteroids([row('a',null,20),row('b',0,20),row('c',10,-1),row('d',Infinity,10),row('e',10,null)],800,360,'layered'),[]);
 assert.deepEqual(layoutAsteroids([],800,360,'layered'),[]);
});
test('linear retains original order, radius, gap and spread formula',()=>{
 const result=layoutAsteroids([row('b',10,200),row('a',100,100)],800,360,'linear');
 assert.deepEqual(result.map(a=>a.id),['a','b']);
 close(result[0].radius,35);close(result[1].radius,8);
 close(result[0].x,55);close(result[1].x,745);
 close(result[0].gap,12+100/200*(312-70-40));
 close(result[0].y,312-result[0].gap-35);
});
