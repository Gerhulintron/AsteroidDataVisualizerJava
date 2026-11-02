'use strict';
const el = id => document.getElementById(id);
const format = value => Number.isFinite(value) ? new Intl.NumberFormat(undefined,{maximumFractionDigits:2}).format(value) : '—';
let asteroids = [], activeRequest = 0, aborter, loadedDate=null, loadedDemo=false;
el('date').value = new Date().toISOString().slice(0,10);
function color(a) { return AsteroidPalettes.asteroidColour(a,el('palette').value); }
function sorted() {
  const [key,dir]=el('sort').value.split(':');
  return [...asteroids].sort((a,b)=>{
    if(key==='name') return String(a.name).localeCompare(String(b.name));
    if(!Number.isFinite(a[key])) return Number.isFinite(b[key])?1:0;
    if(!Number.isFinite(b[key])) return -1;
    return (a[key]-b[key])*(dir==='desc'?-1:1);
  });
}
function renderTable() {
  const rows=el('rows'); rows.replaceChildren();
  if(!asteroids.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=6;td.className='empty';td.textContent='No Earth close approaches were returned for this date.';tr.append(td);rows.append(tr);return;}
  for(const a of sorted()){
    const tr=document.createElement('tr');
    const values=[a.name || 'Unnamed asteroid',format(a.diameterM),`${format(a.minDiameterM)} – ${format(a.maxDiameterM)}`,format(a.missDistanceKm),format(a.velocityKmS),a.hazardous===true?'Yes':a.hazardous===false?'No':'—'];
    values.forEach((value,i)=>{const td=document.createElement('td');td.textContent=value;if(i===0){const swatch=document.createElement('span');swatch.className='swatch';swatch.style.backgroundColor=color(a);swatch.setAttribute('aria-hidden','true');td.prepend(swatch);}if(i===5&&a.hazardous)td.className='hazard';tr.append(td);});
    rows.append(tr);
  }
}
function draw(){
  const canvas=el('visual'),ctx=canvas.getContext('2d');if(!ctx)return;
  const width=canvas.clientWidth,height=canvas.clientHeight;if(!width)return;
  const dpr=2; // A crisp, consistent PNG at twice the displayed dimensions.
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.scale(dpr,dpr);
  const design=normalizeDesign(el('outline').value,el('background-color').value);
  ctx.fillStyle=design.background;ctx.fillRect(0,0,width,height);
  // A decorative horizon, not the Earth's radius or an astronomical scale.
  const horizon=height-48;ctx.fillStyle='#173b4a';ctx.fillRect(0,horizon,width,48);ctx.strokeStyle='#4d9caa';ctx.beginPath();ctx.moveTo(0,horizon);ctx.lineTo(width,horizon);ctx.stroke();
  ctx.font='11px Segoe UI, sans-serif';ctx.fillStyle='#9bbdc6';ctx.fillText('EARTH HORIZON · ILLUSTRATIVE',18,height-20);
  const mode=el('view-mode').value;
  const valid=layoutAsteroids(asteroids,width,height,mode);
  el('view-description').textContent=mode==='layered'
    ? 'Layered: largest behind, smallest in front. Distance is the gap from the circle bottom to the blue horizon; positive distances retain a visible gap. Overlap can hide objects; the table includes all objects.'
    : 'Linear: horizontal positions follow identity order, not sky position. The bottom-to-horizon gap increases with miss distance; circle size reflects diameter.';
  if(!valid.length){ctx.fillStyle=design.labelColor;ctx.font='14px Segoe UI, sans-serif';ctx.textAlign='center';ctx.fillText(asteroids.length?'Measurements unavailable for visualization':'No asteroids to display',width/2,height/2);return;}
  // Array order is painter order: layered draws largest first, smallest last.
  valid.forEach(a=>paintAsteroid(ctx,a,color(a),mode,design));
  const excluded=asteroids.length-valid.length;if(excluded){ctx.fillStyle=design.labelColor;ctx.textAlign='left';ctx.fillText(`${excluded} object(s) omitted: missing size or distance`,18,20);}
}
el('sort').addEventListener('change',renderTable);
el('view-mode').addEventListener('change',draw);
el('outline').addEventListener('change',draw);
el('palette').addEventListener('change',()=>{renderTable();draw();});
el('background-preset').addEventListener('change',()=>{
  if(el('background-preset').value!=='custom')el('background-color').value=el('background-preset').value;
  draw();
});
el('background-color').addEventListener('input',()=>{
  el('background-preset').value='custom';draw();
});
el('download-png').addEventListener('click',async()=>{
  if(!loadedDate||el('load').disabled||el('download-png').disabled)return;
  el('download-png').disabled=true;el('download-status').textContent='Preparing PNG…';
  try{
    draw();
    const filename=pngFilename(loadedDate,el('view-mode').value,loadedDemo);
    await downloadCanvasPng(el('visual'),filename);
    el('download-status').textContent=`PNG download requested: ${filename}`;
  }catch(error){el('download-status').textContent=`Unable to download PNG. ${error.message}`;}
  finally{el('download-png').disabled=!loadedDate||el('load').disabled;}
});
new ResizeObserver(draw).observe(el('visual'));
el('query').addEventListener('submit',async event=>{
  event.preventDefault();if(!el('query').reportValidity())return;
  const request=++activeRequest;aborter?.abort();aborter=new AbortController();
  const date=el('date').value,demo=el('demo').checked;
  loadedDate=null;el('download-png').disabled=true;el('download-status').textContent='Exports the current visualization at 2× display resolution.';
  el('load').disabled=true;el('status').className='';el('status').textContent='Loading close approaches…';el('results').hidden=true;
  try{
    const response=await fetch(`/api/asteroids?date=${encodeURIComponent(date)}&demo=${demo}`,{signal:aborter.signal});
    const data=await response.json();
    if(!response.ok)throw new Error(data.message||`Request failed (${response.status}).`);
    if(request!==activeRequest)return;
    if(!Array.isArray(data.asteroids))throw new Error('The server returned an unexpected response.');
    loadedDate=data.date;loadedDemo=demo;el('download-png').disabled=false;
    asteroids=data.asteroids;el('source').textContent=data.source;el('result-date').textContent=data.date;
    el('summary').textContent=`${asteroids.length} close approach${asteroids.length===1?'':'es'}`;
    el('status').className=demo?'demo':'';
    el('status').textContent=demo?'DEMO — synthetic sample data. These are not actual NASA observations.':'NASA results loaded. Values represent reported close approaches, not current positions.';
    el('results').hidden=false;renderTable();draw();
  }catch(error){if(request!==activeRequest||error.name==='AbortError')return;el('status').className='error';el('status').textContent=`Unable to load data. ${error.message} You can try synthetic demo data instead.`;}
  finally{if(request===activeRequest)el('load').disabled=false;}
});
