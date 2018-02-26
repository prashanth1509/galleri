const PRECACHE = 'precache-v13';
const RUNTIME = 'runtime';

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
	'index.html',
	'./',
	'./#',
	'style.f7944.css',
	'bundle.e7882.js',
	'assets/close.png',
	'assets/comment.png',
	'assets/icon.png',
	'assets/plus.png',
	'assets/images-v2.json'
];

self.addEventListener('install',event=>{event.waitUntil(caches.open(PRECACHE).then(cache=>cache.addAll(PRECACHE_URLS)).then(self.skipWaiting()))});self.addEventListener('activate',event=>{const currentCaches=[PRECACHE,RUNTIME];event.waitUntil(caches.keys().then(cacheNames=>{return cacheNames.filter(cacheName=>!currentCaches.includes(cacheName))}).then(cachesToDelete=>{return Promise.all(cachesToDelete.map(cacheToDelete=>{return caches.delete(cacheToDelete)}))}).then(()=>self.clients.claim()))});self.addEventListener('fetch',event=>{if(event.request.url.startsWith(self.location.origin)||event.request.url.startsWith('https://picsum.photos')){event.respondWith(caches.match(event.request).then(cachedResponse=>{if(cachedResponse){return cachedResponse}
	return caches.open(RUNTIME).then(cache=>{return fetch(event.request).then(response=>{return cache.put(event.request,response.clone()).then(()=>{return response})})})}))}})