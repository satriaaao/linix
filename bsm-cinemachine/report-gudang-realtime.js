(function(global){
  'use strict';

  var SUPABASE_URL='https://bdutjchphtqtklclbgoz.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY='sb_publishable_jEF2xLIueWHUdU5MBwd6dg_sG9JFFWU';
  var WORKSPACE_KEY='bsm-report-gudang';
  var client=null;
  var channel=null;
  var status='idle';

  function emit(cb,value){
    try{if(typeof cb==='function')cb(value);}catch(_){}
  }

  function stop(){
    try{
      if(client&&channel)client.removeChannel(channel);
    }catch(_){}
    channel=null;
    client=null;
    status='idle';
  }

  function start(options){
    options=options||{};
    stop();

    if(!(global.supabase&&typeof global.supabase.createClient==='function')){
      status='unavailable';
      emit(options.onStatus,status);
      return false;
    }

    client=global.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
      auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
    });

    status='connecting';
    emit(options.onStatus,status);

    channel=client
      .channel('bsm-report-workspace-live')
      .on('postgres_changes',{
        event:'*',
        schema:'public',
        table:'report_realtime_events',
        filter:'workspace_key=eq.'+WORKSPACE_KEY
      },function(payload){
        var row=payload&&payload.new&&Object.keys(payload.new).length?payload.new:(payload&&payload.old||{});
        var version=Number(row&&row.version||0);
        if(version>0)emit(options.onVersion,version);
      })
      .subscribe(function(next){
        var value=String(next||'').toUpperCase();
        if(value==='SUBSCRIBED')status='subscribed';
        else if(value==='CHANNEL_ERROR'||value==='TIMED_OUT')status='error';
        else if(value==='CLOSED')status='closed';
        else status='connecting';
        emit(options.onStatus,status);
      });

    return true;
  }

  global.BSMReportRealtime={
    start:start,
    stop:stop,
    getStatus:function(){return status;}
  };
})(window);
