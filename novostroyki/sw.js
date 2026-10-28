const C="novostroyki-3";
const FILES=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png"];
// iOS Safari отказывается показывать ответ с редиректом — пересобираем ответ «чистым»
const clean=r=>r.redirected?r.blob().then(b=>new Response(b,{status:200,headers:r.headers})):Promise.resolve(r);
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(FILES.map(f=>fetch(f,{cache:"reload"}).then(clean).then(r=>c.put(f,r))))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("novostroyki-")&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.origin!==location.origin)return;
  const isPage=e.request.mode==="navigate"||u.pathname.endsWith("/")||u.pathname.endsWith("index.html");
  if(isPage){
    // сначала из кеша (мгновенно и без сети), в фоне обновляем
    const net=fetch(e.request,{cache:"no-store"}).then(clean).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put("index.html",cp))}return r});
    e.respondWith(caches.open(C).then(c=>c.match("index.html")).then(hit=>{if(hit){e.waitUntil(net.catch(()=>{}));return hit}return net}));return}
  e.respondWith(caches.open(C).then(c=>c.match(e.request,{ignoreSearch:true})).then(r=>r||fetch(e.request)));
});
