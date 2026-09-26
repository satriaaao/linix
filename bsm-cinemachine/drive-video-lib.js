function safeFileId(value){
  const s=String(value||'').trim();
  return /^[A-Za-z0-9_-]{10,}$/.test(s)?s:'';
}
function mimeFor(name,upstreamType){
  const t=String(upstreamType||'').split(';')[0].trim().toLowerCase();
  if(t.startsWith('video/'))return t;
  const n=String(name||'').toLowerCase().split('?')[0];
  if(n.endsWith('.webm'))return 'video/webm';
  if(n.endsWith('.mov'))return 'video/quicktime';
  if(n.endsWith('.m4v'))return 'video/x-m4v';
  if(n.endsWith('.3gp'))return 'video/3gpp';
  if(n.endsWith('.mpeg')||n.endsWith('.mpg'))return 'video/mpeg';
  return 'video/mp4';
}
function downloadUrl(id){
  const clean=safeFileId(id);
  return clean?'https://drive.usercontent.google.com/download?id='+encodeURIComponent(clean)+'&export=download&confirm=t':'';
}
function forwardRange(headers){
  const range=String(headers?.range||headers?.Range||'').trim();
  const out={'accept-encoding':'identity'};
  if(/^bytes=\d*-\d*(?:,\d*-\d*)*$/i.test(range))out.range=range;
  return range?{range:out.range,'accept-encoding':'identity'}:{'accept-encoding':'identity'};
}
function parseConfirmHtml(html,baseUrl){
  const s=String(html||'');
  const form=s.match(/<form\b[^>]*action=["']([^"']+)["'][^>]*>([\s\S]*?)<\/form>/i);
  if(!form)return '';
  let u;
  try{u=new URL(form[1],baseUrl||'https://drive.usercontent.google.com/')}catch(_){return ''}
  const inputRe=/<input\b[^>]*name=["']([^"']+)["'][^>]*value=["']([^"']*)["'][^>]*>/gi;
  let m;
  while((m=inputRe.exec(form[2]))){
    u.searchParams.set(m[1],m[2].replace(/&amp;/g,'&'));
  }
  return u.toString();
}
module.exports={safeFileId,mimeFor,downloadUrl,forwardRange,parseConfirmHtml};