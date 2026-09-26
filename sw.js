self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
  let data={title:'تن‌آرا',body:'نوبت جدیدی ثبت شده است.'};
  try{data=event.data?event.data.json():data}catch(_){try{data={...data,body:event.data?.text()||data.body}}catch(__){}}
  event.waitUntil(self.registration.showNotification(data.title||'تن‌آرا',{body:data.body||'',icon:'/tanara-logo.jpg',badge:'/tanara-logo.jpg',dir:'rtl',lang:'fa',tag:data.tag||'tanara-booking',data:{url:data.url||'/'}}));
});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if('focus' in c)return c.focus()}return clients.openWindow(event.notification.data?.url||'/')}));});
