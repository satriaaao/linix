/* Rentcam CMS Data Tables — table registry for operational data. */
(function(root,factory){
  const lib=factory();
  if(typeof module==='object'&&module.exports)module.exports=lib;
  if(root&&root.location&&String(root.location.pathname||'').startsWith('/cms'))root.RentcamCmsDataTables=lib.install(root);
})(typeof window!=='undefined'?window:null,function(){
  const SB='https://xleceiffuopioeguniwj.supabase.co',KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const TABLES=[
    ['rentcam_cms_config','Konfigurasi CMS'],['rentcam_contacts','Kontak'],['rentcam_dispatch_units','Unit Dispatch'],
    ['rentcam_dispatches','Dispatch / Barang Jalan'],['rentcam_documents','Dokumen'],['rentcam_events','Analytics Events'],
    ['rentcam_finance_entries','Keuangan'],['rentcam_journal_entries','Jurnal'],['rentcam_journal_lines','Detail Jurnal'],
    ['rentcam_order_catalog','Katalog Order'],['rentcam_order_events','Riwayat Order'],['rentcam_orders','Order'],
    ['rentcam_payment_proofs','Bukti Pembayaran'],['rentcam_presence','Presence'],['rentcam_units','Unit / Nomor Seri']
  ].map(([name,label])=>({name,label}));
  const allowed=new Set(TABLES.map(x=>x.name));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function mask(v,keep=8){const s=String(v??'');return s.length>keep?s.slice(0,keep)+'…':s}
  function sanitizeCell(key,value){
    if(value===null||value===undefined)return '-';
    if(key==='customer_token'||key==='session_id')return mask(value);
    if(key==='meta'&&value&&typeof value==='object'){
      const x=JSON.parse(JSON.stringify(value));
      if(x.visitor_hash)x.visitor_hash=mask(x.visitor_hash,12);
      return x;
    }
    return value;
  }
  function display(value){
    if(value===null||value===undefined||value==='')return '-';
    if(typeof value==='boolean')return value?'Ya':'Tidak';
    if(typeof value==='object'){
      const raw=JSON.stringify(value);
      const short=raw.length>140?raw.slice(0,140)+'…':raw;
      return '<details><summary>'+esc(short)+'</summary><pre style="white-space:pre-wrap;max-width:520px">'+esc(JSON.stringify(value,null,2))+'</pre></details>';
    }
    const s=String(value);
    if(/^https?:\/\//.test(s))return '<a href="'+esc(s)+'" target="_blank" rel="noopener">Buka</a>';
    return esc(s.length>180?s.slice(0,180)+'…':s);
  }
  function columns(rows){const set=new Set();for(const r of rows||[])Object.keys(r||{}).forEach(k=>set.add(k));return [...set]}
  function create(root,admin){
    let state={table:TABLES[0].name,rows:[],total:0,page:1,pageSize:50,search:'',loading:false,error:''};
    const request=async(path,init={})=>{
      const url=SB+'/rest/v1/'+path;
      const r=admin?.request?await admin.request(url,init):await root.fetch(url,init);
      const text=await r.text();let data=null;try{data=text?JSON.parse(text):null}catch(_){data=text}
      if(!r.ok)throw new Error(data?.message||data||'Gagal memuat data');
      return {data,contentRange:r.headers?.get?.('content-range')||''};
    };
    async function load(table=state.table,page=1,pageSize=state.pageSize){
      if(!allowed.has(table))throw new Error('Tabel tidak diizinkan');
      state={...state,table,page,pageSize,loading:true,error:''};
      const offset=(page-1)*pageSize;
      try{
        const {data,contentRange}=await request(table+'?select=*&limit='+pageSize+'&offset='+offset,{headers:{apikey:KEY,'Content-Type':'application/json',Prefer:'count=exact'},cache:'no-store'});
        const m=String(contentRange).match(/\/(\d+|\*)$/),total=m&&m[1]!=='*'?Number(m[1]):(Array.isArray(data)?data.length:0);
        state={...state,rows:Array.isArray(data)?data:[],total,loading:false};
      }catch(e){state={...state,rows:[],total:0,loading:false,error:e.message}}
      return snapshot();
    }
    function setSearch(q){state={...state,search:String(q||'')};return snapshot()}
    function filteredRows(){
      const q=state.search.trim().toLowerCase();if(!q)return state.rows;
      return state.rows.filter(row=>JSON.stringify(row).toLowerCase().includes(q));
    }
    function snapshot(){return {...state,rows:[...state.rows]}}
    function render(host){
      if(!host)return;
      const rows=filteredRows(),cols=columns(rows.length?rows:state.rows),pages=Math.max(1,Math.ceil((state.total||state.rows.length)/state.pageSize));
      host.innerHTML='<div class="v5-card"><div class="v5-head"><div><h2>Semua Data</h2><p>Semua data operasional ditampilkan dalam format tabel. Tabel sesi admin dan token upload sengaja disembunyikan.</p></div><button class="v5-btn" data-data-refresh>Refresh</button></div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px"><select data-data-table style="min-width:220px">'+TABLES.map(t=>'<option value="'+t.name+'" '+(t.name===state.table?'selected':'')+'>'+esc(t.label)+'</option>').join('')+'</select><input data-data-search placeholder="Cari di halaman ini…" value="'+esc(state.search)+'" style="min-width:220px;flex:1"><span style="font-size:11px;color:#667085;align-self:center">'+state.total+' row</span></div>'+
      (state.error?'<div style="padding:16px;color:#b42318">'+esc(state.error)+'</div>':state.loading?'<div style="padding:16px">Memuat…</div>':
      '<div class="v5-tablewrap"><table class="v5-table" style="min-width:900px"><thead><tr>'+cols.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+cols.map(c=>'<td>'+display(sanitizeCell(c,row[c]))+'</td>').join('')+'</tr>').join('')+(rows.length?'':'<tr><td colspan="'+Math.max(1,cols.length)+'">Belum ada data.</td></tr>')+'</tbody></table></div>'+
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:12px"><button class="v5-btn" data-data-prev '+(state.page<=1?'disabled':'')+'>← Sebelumnya</button><span style="font-size:11px">Halaman '+state.page+' / '+pages+'</span><button class="v5-btn" data-data-next '+(state.page>=pages?'disabled':'')+'>Berikutnya →</button></div>')+'</div>';
    }
    return Object.freeze({tables:TABLES,load,setSearch,snapshot,render});
  }
  function install(root){return create(root,root.RentcamCmsAdmin)}
  return {SB,KEY,TABLES,columns,sanitizeCell,display,create,install};
});