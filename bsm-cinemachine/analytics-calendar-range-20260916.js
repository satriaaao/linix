/* Rentcam Analytics calendar/date-range controller. Default: last 30 days (1 month). */
(function(){
  if(!location.pathname.startsWith('/cms')||window.__rentcamAnalyticsRangeInstalled)return;
  window.__rentcamAnalyticsRangeInstalled=true;
  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const nativeFetch=window.fetch.bind(window);
  const pad=n=>String(n).padStart(2,'0');
  const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  function last30(now=new Date()){
    const end=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const start=new Date(end);start.setDate(start.getDate()-29);
    return {start:ymd(start),end:ymd(end),mode:'month'};
  }
  function thisMonth(now=new Date()){
    const end=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const start=new Date(now.getFullYear(),now.getMonth(),1);
    return {start:ymd(start),end:ymd(end),mode:'thisMonth'};
  }
  function isoBounds(start,end){
    const [sy,sm,sd]=String(start).split('-').map(Number),[ey,em,ed]=String(end).split('-').map(Number);
    const a=new Date(sy,sm-1,sd,0,0,0,0),b=new Date(ey,em-1,ed+1,0,0,0,0);
    return {start:a.toISOString(),endExclusive:b.toISOString()};
  }
  let range=last30();
  window.RentcamAnalyticsRange={
    get:()=>({...range}),
    set:(start,end,mode='custom')=>{range={start,end,mode};return {...range}},
    last30:()=>({...last30()}),
    thisMonth:()=>({...thisMonth()})
  };
  window.fetch=function(input,init={}){
    const raw=typeof input==='string'?input:(input?.url||'');
    if(raw.startsWith(SB+'/rest/v1/rentcam_events?')){
      try{
        const u=new URL(raw),b=isoBounds(range.start,range.end);
        u.searchParams.delete('created_at');
        u.searchParams.append('created_at','gte.'+b.start);
        u.searchParams.append('created_at','lt.'+b.endExclusive);
        return nativeFetch(u.toString(),init);
      }catch(_){/* use original request */}
    }
    return nativeFetch(input,init);
  };
  function rangeTitle(){
    if(range.mode==='month')return '1 Bulan Terakhir';
    if(range.mode==='thisMonth')return 'Bulan Ini';
    return `${range.start} – ${range.end}`;
  }
  function ensureStyle(){
    if(document.getElementById('rca-calendar-style'))return;
    const s=document.createElement('style');s.id='rca-calendar-style';s.textContent=`
      #v5report .rca-toolbar{flex-wrap:wrap!important}
      #v5report .rca-range-wrap{display:flex;align-items:end;gap:8px;flex-wrap:wrap;width:100%;padding:10px 0 2px}
      #v5report .rca-range-field{display:grid;gap:4px;min-width:135px}
      #v5report .rca-range-field label{font-size:9px;font-weight:800;color:#667085;text-transform:uppercase;letter-spacing:.04em}
      #v5report .rca-date{height:38px;border:1px solid #dfe3e8;border-radius:10px;padding:0 10px;background:#fff;color:#182230;font:inherit;font-size:11px;box-sizing:border-box}
      #v5report .rca-range-btn{height:38px;border:1px solid #dfe3e8;border-radius:10px;padding:0 12px;background:#fff;color:#344054;font-size:10px;font-weight:800;cursor:pointer}
      #v5report .rca-range-btn.primary{background:#111;color:#fff;border-color:#111}
      #v5report .rca-range-label{font-size:10px;color:#667085;font-weight:700;margin-right:auto}
      @media(max-width:600px){#v5report .rca-range-wrap{display:grid;grid-template-columns:1fr 1fr}#v5report .rca-range-field{min-width:0}#v5report .rca-date{width:100%}#v5report .rca-range-btn{width:100%}#v5report .rca-range-label{grid-column:1/-1}}
    `;document.head.appendChild(s);
  }
  function clickRefresh(){document.getElementById('rcAnalyticsRefresh')?.click()}
  function enhance(){
    const host=document.getElementById('v5report');
    if(!host||!host.querySelector('[data-geo-analytics]'))return;
    ensureStyle();
    const toolbar=host.querySelector('.rca-toolbar');
    if(!toolbar)return;
    const muted=toolbar.querySelector('.rca-muted');if(muted)muted.textContent='Data '+rangeTitle();
    const metricLabels=[...host.querySelectorAll('.rca-metric small')];
    metricLabels.forEach(el=>{
      if(/^Views /i.test(el.textContent))el.textContent=range.mode==='custom'?'Views Periode':'Views 1 Bulan';
      if(/^Klik produk /i.test(el.textContent))el.textContent=range.mode==='custom'?'Klik Produk Periode':'Klik Produk 1 Bulan';
    });
    const topHeading=[...host.querySelectorAll('.rca-card h3')].find(x=>x.textContent.startsWith('Top Produk'));
    if(topHeading)topHeading.textContent=range.mode==='custom'?'Top Produk — Klik Periode':'Top Produk — Klik 1 Bulan';
    let controls=toolbar.querySelector('.rca-range-wrap');
    if(!controls){
      controls=document.createElement('div');controls.className='rca-range-wrap';
      controls.innerHTML=`
        <div class="rca-range-label" id="rcaRangeLabel"></div>
        <div class="rca-range-field"><label>Dari</label><input class="rca-date" type="date" id="rcaDateStart"></div>
        <div class="rca-range-field"><label>Sampai</label><input class="rca-date" type="date" id="rcaDateEnd"></div>
        <button class="rca-range-btn primary" type="button" id="rcaApplyRange">Terapkan</button>
        <button class="rca-range-btn" type="button" id="rcaMonthNow">Bulan Ini</button>
        <button class="rca-range-btn" type="button" id="rcaLast30">30 Hari</button>`;
      toolbar.appendChild(controls);
      controls.querySelector('#rcaApplyRange').addEventListener('click',()=>{
        const start=controls.querySelector('#rcaDateStart').value,end=controls.querySelector('#rcaDateEnd').value;
        if(!start||!end||start>end){alert('Pilih rentang tanggal yang benar.');return}
        range={start,end,mode:'custom'};clickRefresh();
      });
      controls.querySelector('#rcaMonthNow').addEventListener('click',()=>{range=thisMonth();clickRefresh()});
      controls.querySelector('#rcaLast30').addEventListener('click',()=>{range=last30();clickRefresh()});
    }
    const label=controls.querySelector('#rcaRangeLabel'),start=controls.querySelector('#rcaDateStart'),end=controls.querySelector('#rcaDateEnd');
    if(label)label.textContent='Periode: '+rangeTitle();if(start)start.value=range.start;if(end)end.value=range.end;
  }
  const observer=new MutationObserver(()=>requestAnimationFrame(enhance));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-nav="analytics"]'))setTimeout(enhance,180)},true);
  setTimeout(enhance,250);
})();