const CACHE='mcf-shell-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  const u=new URL(event.request.url);
  if(u.origin===self.location.origin){
    event.respondWith(caches.open(CACHE).then(async cache=>{
      try{
        const fresh=await fetch(event.request);
        if(event.request.method==='GET' && fresh.ok) cache.put(event.request,fresh.clone());
        return fresh;
      }catch(e){
        const cached=await cache.match(event.request);
        return cached || Response.error();
      }
    }));
  }
});
