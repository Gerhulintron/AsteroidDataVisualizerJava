/* Presentation-only choices: no data fetches or geometry changes. */
(function(root) {
  'use strict';
  function normalizeDesign(outline, background) {
    const border = ['black', 'white', 'none'].includes(outline) ? outline : 'white';
    const hex = typeof background === 'string' && /^#[0-9a-f]{6}$/i.test(background) ? background.toLowerCase() : '#101927';
    const channels = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255)
      .map(c => c <= .04045 ? c/12.92 : ((c+.055)/1.055)**2.4);
    const luminance = channels[0]*.2126 + channels[1]*.7152 + channels[2]*.0722;
    return {outline:border, background:hex, labelColor:luminance > .179 ? '#000000' : '#ffffff'};
  }
  function paintAsteroid(ctx, asteroid, fill, mode, design) {
    ctx.fillStyle=fill; ctx.globalAlpha=mode==='layered'?1:.85;
    ctx.beginPath(); ctx.arc(asteroid.x,asteroid.y,asteroid.radius,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
    if(design.outline!=='none') {
      ctx.strokeStyle=design.outline==='black'?'#000000':'#ffffff'; ctx.lineWidth=1.5; ctx.stroke();
    }
  }
  const api={normalizeDesign,paintAsteroid};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  else Object.assign(root,api);
})(typeof globalThis!=='undefined'?globalThis:this);
