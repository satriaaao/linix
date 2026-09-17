/* Rentcam CMS Rental Desk — deep module for rental data/actions + internal UI adapters. */
(function(root,factory){
  const lib=factory();
  if(typeof module==='object'&&module.exports)module.exports=lib;
  if(root&&root.location&&String(root.location.pathname||'').startsWith('/cms')){
    root.RentcamRentalDesk=lib.install(root);
  }
})(typeof window!=='undefined'?window:null,function(){
  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const PAGE_SIZE=1000;
  const SNAPSHOTS={
    operations:[
      'rentcam_orders?select=*&order=created_at.desc',
      'rentcam_payment_proofs?select=*&order=created_at.desc',
      'rentcam_finance_entries?select=*&order=entry_date.desc',
      'rentcam_order_events?select=*&order=created_at.desc'
    ],
    accounting:[
      'rentcam_orders?select=*&order=created_at.desc',
      'rentcam_documents?select=*&order=created_at.desc',
      'rentcam_journal_entries?select=*&order=entry_date.desc',
      'rentcam_journal_lines?select=*&order=id.asc',
      'rentcam_finance_entries?select=*&order=entry_date.desc'
    ]
  };
  function appendPage(path,offset,size=PAGE_SIZE){
    const p=String(path||'');
    if(/[?&]limit=\d+/i.test(p)||/[?&]offset=\d+/i.test(p))return p;
    return p+(p.includes('?')?'&':'?')+'limit='+size+'&offset='+offset;
  }
  async function decode(response){
    const text=await response.text();
    let data=null;
    try{data=text?JSON.parse(text):null}catch(_){data=text}
    if(!response.ok)throw new Error(data?.message||data||('Permintaan rental gagal ('+(response.status||0)+')'));
    return data;
  }
  function createClient(transport){
    if(typeof transport!=='function')throw new Error('Rental Desk transport diperlukan');
    async function request(path,data){
      const post=data!==undefined&&data!==null;
      if(post){
        const r=await transport(String(path||''),{
          method:'POST',
          headers:{apikey:KEY,'Content-Type':'application/json'},
          body:JSON.stringify(data)
        });
        return decode(r);
      }
      const raw=String(path||'');
      if(/[?&]limit=\d+/i.test(raw)||/[?&]offset=\d+/i.test(raw)){
        return decode(await transport(raw,{method:'GET',headers:{apikey:KEY,'Content-Type':'application/json'}}));
      }
      let all=[],offset=0;
      while(true){
        const page=await decode(await transport(appendPage(raw,offset),{
          method:'GET',headers:{apikey:KEY,'Content-Type':'application/json'}
        }));
        if(!Array.isArray(page))return page;
        all.push(...page);
        if(page.length<PAGE_SIZE)return all;
        offset+=PAGE_SIZE;
      }
    }
    const rpc=(name,data={})=>request('rpc/'+String(name||''),data);
    async function snapshot(kind='operations'){
      const paths=Array.isArray(kind)?kind:(SNAPSHOTS[kind]||SNAPSHOTS.operations);
      return Promise.all(paths.map(path=>request(path)));
    }
    return Object.freeze({request,rpc,snapshot});
  }
  function install(root){
    const transport=(path,init)=>{
      const url=SB+'/rest/v1/'+String(path||'').replace(/^\/+/, '');
      if(root.RentcamCmsAdmin?.request)return root.RentcamCmsAdmin.request(url,init);
      return root.fetch(url,init);
    };
    return createClient(transport);
  }
  return {SB,KEY,PAGE_SIZE,SNAPSHOTS,appendPage,decode,createClient,install};
});