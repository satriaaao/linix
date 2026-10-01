/* U²-Net inference runs away from the CMS UI thread. */
importScripts('/vendor/product-photo/ort.wasm.min.js');
ort.env.wasm.wasmPaths='/vendor/product-photo/';
ort.env.wasm.numThreads=1;
let session;
self.onmessage=async({data})=>{
 try{
  if(!session)session=await ort.InferenceSession.create('/vendor/product-photo/u2netp.onnx',{executionProviders:['wasm'],graphOptimizationLevel:'all'});
  const result=await session.run({[session.inputNames[0]]:new ort.Tensor('float32',data.input,[1,3,320,320])});
  const mask=result[session.outputNames[0]].data;
  self.postMessage({id:data.id,mask},[mask.buffer]);
 }catch(error){self.postMessage({id:data.id,error:error.message||'Pemrosesan foto gagal'});}
};
