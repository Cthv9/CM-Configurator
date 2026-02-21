const CACHE_NAME="cablemaster-configurator-master-v1";
const ASSETS=[
  "./","./index.html","./styles.css","./app.js","./sw.js","./manifest.webmanifest",
  "./data/cablemaster_master.json",
  "./assets/icon-192.png","./assets/icon-512.png"
];
self.addEventListener("install",(e)=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",(e)=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",(e)=>{e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(resp=>{try{const url=new URL(e.request.url);if(url.origin===location.origin&&e.request.method==="GET"){const copy=resp.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,copy));}}catch(err){}return resp;}).catch(()=>cached)));});
