(function(root){
 'use strict';
 function pngFilename(date, mode, demo=false){
  const day=/^\d{4}-\d{2}-\d{2}$/.test(date)?date:'undated';
  return `asteroid-data-${day}-${mode==='layered'?'layered':'linear'}${demo?'-demo':''}.png`;
 }
 async function downloadCanvasPng(canvas, filename, env=root){
  if(!canvas.width||!canvas.height)throw new Error('The visualization is not ready yet.');
  // Snapshot the exact current pixels before asynchronous PNG encoding.
  const snapshot=env.document.createElement('canvas');
  snapshot.width=canvas.width;snapshot.height=canvas.height;
  const ctx=snapshot.getContext('2d');
  if(!ctx)throw new Error('PNG export is not supported by this browser.');
  ctx.drawImage(canvas,0,0);
  const blob=await new Promise((resolve,reject)=>{
   try{snapshot.toBlob(value=>value?resolve(value):reject(new Error('PNG creation failed. Please try again.')),'image/png');}
   catch(error){reject(new Error('Could not create the PNG. Please try another browser.'));}
  });
  let url,link;
  try{
   url=env.URL.createObjectURL(blob);link=env.document.createElement('a');
   link.href=url;link.download=filename;link.style.display='none';
   env.document.body.append(link);link.click();
  }finally{
   link?.remove();
   // Give the browser time to consume the download, then release the blob URL.
   if(url)env.setTimeout(()=>env.URL.revokeObjectURL(url),1000);
  }
  return filename;
 }
 const api={pngFilename,downloadCanvasPng};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else Object.assign(root,api);
})(typeof globalThis!=='undefined'?globalThis:this);
