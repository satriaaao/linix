const SCRIPT=String.raw`'use strict';
self.addEventListener('install',function(){self.skipWaiting()});
self.addEventListener('activate',function(event){event.waitUntil(self.clients.claim())});
self.addEventListener('message',function(event){
  var d=event.data||{};
  if(d.type!=='SHOW_ORDER_NOTIFICATION')return;
  event.waitUntil(self.registration.showNotification(d.title||'Order Baru', {
    body:d.body||'Ada order baru masuk ke Rentcam CMS.',
    icon:'/api/cms-icon',
    badge:'/api/cms-icon',
    tag:d.tag||'rentcam-order',
    renotify:true,
    silent:false,
    data:{url:d.url||'/cms'}
  }));
});
self.addEventListener('push',function(event){
  var d={};
  try{d=event.data?event.data.json():{}}catch(_){try{d={body:event.data?event.data.text():''}}catch(__){}}
  event.waitUntil(self.registration.showNotification(d.title||'Order Baru • Rentcam', {
    body:d.body||'Ada order baru masuk.',
    icon:'/api/cms-icon',
    badge:'/api/cms-icon',
    tag:d.tag||'rentcam-order',
    renotify:true,
    silent:false,
    data:{url:d.url||'/cms'}
  }));
});
self.addEventListener('notificationclick',function(event){
  event.notification.close();
  var target=(event.notification.data&&event.notification.data.url)||'/cms';
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){
    for(var i=0;i<list.length;i++){
      var c=list[i];
      if('focus' in c){
        try{c.navigate(target)}catch(_){}
        return c.focus();
      }
    }
    if(self.clients.openWindow)return self.clients.openWindow(target);
  }));
});
`;
module.exports=function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.statusCode=405;res.setHeader('content-type','text/plain; charset=utf-8');return res.end('Method not allowed');
  }
  res.statusCode=200;
  res.setHeader('content-type','application/javascript; charset=utf-8');
  res.setHeader('cache-control','no-cache, no-store, must-revalidate');
  res.setHeader('service-worker-allowed','/cms');
  if(req.method==='HEAD')return res.end();
  return res.end(SCRIPT);
};