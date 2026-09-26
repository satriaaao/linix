function decodeHtml(value){
  return String(value||'')
    .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)));
}
function stripTags(value){return decodeHtml(String(value||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim())}
function extractFolderId(input){
  const s=String(input||'').trim();
  if(!s)return '';
  const patterns=[
    /\/folders\/([A-Za-z0-9_-]{10,})/i,
    /[?&]id=([A-Za-z0-9_-]{10,})/i
  ];
  for(const re of patterns){const m=s.match(re);if(m)return m[1]}
  return /^[A-Za-z0-9_-]{10,}$/.test(s)?s:'';
}
function extractResourceKey(input){
  try{return new URL(String(input||'')).searchParams.get('resourcekey')||''}catch(_){return ''}
}
function isVideoName(name){
  const n=String(name||'').toLowerCase().split('?')[0];
  return /\.(mp4|mov|m4v|webm|avi|mkv|mpeg|mpg|3gp)$/i.test(n);
}
function parseEmbeddedFolderHtml(html){
  const source=String(html||'');
  const out=[],seen=new Set();
  const anchorRe=/<a\b[^>]*href=["'](https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{10,})\/[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while((m=anchorRe.exec(source))){
    const id=m[2]; if(seen.has(id))continue;
    const block=m[3]||'';
    let name='';
    const title=block.match(/<div\b[^>]*class=["'][^"']*flip-entry-title[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    if(title)name=stripTags(title[1]);
    if(!name){
      const aria=(m[0]||'').match(/aria-label=["']([^"']+)["']/i);
      if(aria)name=decodeHtml(aria[1]);
    }
    if(!name)name='Video '+(out.length+1);
    seen.add(id);out.push({id,name,url:'https://drive.google.com/file/d/'+id+'/view',isVideo:isVideoName(name)});
  }
  if(out.length)return out;
  const idRe=/https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{10,})\/view(?:\?[^"'\\< ]*)?/gi;
  while((m=idRe.exec(source))){
    const id=m[1];if(seen.has(id))continue;seen.add(id);
    out.push({id,name:'Video '+(out.length+1),url:'https://drive.google.com/file/d/'+id+'/view',isVideo:true});
  }
  return out;
}
module.exports={decodeHtml,stripTags,extractFolderId,extractResourceKey,isVideoName,parseEmbeddedFolderHtml};