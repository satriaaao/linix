/* Automatic product cutouts, transparent PNG and consistent framing. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.RentcamProductPhoto=api;})(typeof window==='undefined'?null:window,function(){
 let worker=null,pending=null,sequence=0;
 function canvas(width,height){const c=document.createElement('canvas');c.width=width;c.height=height;return c;}
 async function bitmap(file){const url=URL.createObjectURL(file);try{const image=new Image();image.src=url;await image.decode();return image;}finally{URL.revokeObjectURL(url);}}
 function png(c){return new Promise((resolve,reject)=>c.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG tidak dapat dibuat')),'image/png'));}
 function bounds(data,width,height){let left=width,top=height,right=-1,bottom=-1;for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>24){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}return right<left?null:{left,top,width:right-left+1,height:bottom-top+1};}
 function infer(input){if(pending)return Promise.reject(new Error('Tunggu foto sebelumnya selesai.'));return new Promise((resolve,reject)=>{
  if(!worker){worker=new Worker('/product-photo-worker-20261001.js');worker.onmessage=({data})=>{if(!pending||pending.id!==data.id)return;const task=pending;pending=null;clearTimeout(task.timeout);if(data.error)task.reject(new Error(data.error));else task.resolve(data.mask);};worker.onerror=()=>{if(pending){clearTimeout(pending.timeout);pending.reject(new Error('Model foto belum dapat dimuat. Periksa koneksi lalu coba lagi.'));pending=null;}worker?.terminate();worker=null;};}
  const id=++sequence;pending={id,resolve,reject,timeout:setTimeout(()=>{pending=null;worker?.terminate();worker=null;reject(new Error('Pemrosesan melewati batas waktu. Coba foto yang lebih kecil atau gunakan foto asli.'));},120000)};
  worker.postMessage({id,input},[input.buffer]);
 });}
 async function prepare(file,{removeBackground=true,onProgress=()=>{}}={}){
  if(!file||!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type))throw new Error('Pilih JPG, PNG, WEBP atau GIF.');
  if(file.size>10*1024*1024)throw new Error('Maksimal 10 MB per foto.');
  if(!removeBackground)return file;
  onProgress('Membaca foto…');const image=await bitmap(file);if(!image.naturalWidth||image.naturalWidth*image.naturalHeight>50000000)throw new Error('Ukuran foto terlalu besar. Gunakan foto di bawah 50 megapiksel.');
  const scale=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight)),width=Math.max(1,Math.round(image.naturalWidth*scale)),height=Math.max(1,Math.round(image.naturalHeight*scale));
  const source=canvas(width,height),ctx=source.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,width,height);const pixels=ctx.getImageData(0,0,width,height);let transparent=false;for(let i=3;i<pixels.data.length;i+=4)if(pixels.data[i]<250){transparent=true;break;}
  if(!transparent){
   onProgress('Menghapus latar… Model diunduh pada penggunaan pertama.');
   const small=canvas(320,320),sc=small.getContext('2d',{willReadFrequently:true});sc.drawImage(source,0,0,320,320);const rgb=sc.getImageData(0,0,320,320).data,input=new Float32Array(3*320*320),mean=[.485,.456,.406],std=[.229,.224,.225];
   for(let i=0;i<320*320;i++)for(let channel=0;channel<3;channel++)input[channel*320*320+i]=(rgb[i*4+channel]/255-mean[channel])/std[channel];
   const mask=await infer(input);let min=Infinity,max=-Infinity;for(const value of mask){min=Math.min(min,value);max=Math.max(max,value);}if(max-min<.001)throw new Error('Objek produk belum dapat dikenali. Coba foto yang lebih jelas atau gunakan foto asli.');
   const matte=sc.createImageData(320,320);for(let i=0;i<mask.length;i++){matte.data[i*4]=matte.data[i*4+1]=matte.data[i*4+2]=255;matte.data[i*4+3]=Math.round(255*(mask[i]-min)/(max-min));}sc.putImageData(matte,0,0);
   const alpha=canvas(width,height),ac=alpha.getContext('2d',{willReadFrequently:true});ac.drawImage(small,0,0,width,height);const values=ac.getImageData(0,0,width,height).data;for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=values[i];ctx.putImageData(pixels,0,0);
  }
  const crop=bounds(pixels.data,width,height);if(!crop||crop.width*crop.height<16)throw new Error('Hasil potongan kosong. Gunakan foto lain atau foto asli.');
  onProgress('Merapikan PNG…');const output=canvas(1200,1200),out=output.getContext('2d'),fit=Math.min(1020/crop.width,1020/crop.height),w=crop.width*fit,h=crop.height*fit;out.drawImage(source,crop.left,crop.top,crop.width,crop.height,(1200-w)/2,(1200-h)/2,w,h);
  const blob=await png(output);return new File([blob],String(file.name||'produk').replace(/\.[^.]*$/,'')+'-transparan.png',{type:'image/png',lastModified:Date.now()});
 }
 return {prepare,bounds};
});
