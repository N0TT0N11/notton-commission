(()=>{
const listeners=new Set(),errorListeners=new Set();let last={},loadPromise,cloudLoaded=false;
const database=new Promise(resolve=>{try{const r=indexedDB.open('notton-commission-public-cache',1);r.onupgradeneeded=()=>r.result.createObjectStore('data');r.onsuccess=()=>resolve(r.result);r.onerror=()=>resolve(null);}catch{resolve(null);}});
async function read(key){const db=await database;if(!db)return null;return new Promise(resolve=>{const r=db.transaction('data').objectStore('data').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>resolve(null);});}
async function write(key,value){const db=await database;if(!db)return;return new Promise(resolve=>{const t=db.transaction('data','readwrite');t.objectStore('data').put(value,key);t.oncomplete=t.onerror=t.onabort=resolve;});}
function script(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=true;s.onload=resolve;s.onerror=()=>reject(new Error('โหลด Firebase ไม่สำเร็จ'));document.head.append(s);});}
const authInitialized=(async()=>{await script('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');await Promise.all([script('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js')]);await script('notton-cloud.js?v=progressive-20261005');return window.NottonCloud;})();
const ready=authInitialized.then(async cloud=>{const data=await window.NottonCloud.load();if(data){last=data;cloudLoaded=true;await write('site',data);listeners.forEach(fn=>fn(data));}window.NottonCloud.subscribe(async data=>{if(data){last=data;cloudLoaded=true;await write('site',data);listeners.forEach(fn=>fn(data));}},message=>{console.warn(message);errorListeners.forEach(fn=>fn(message));});return cloud;});ready.catch(e=>{console.warn(e.message);errorListeners.forEach(fn=>fn(e.message));document.dispatchEvent(new CustomEvent('notton-cloud-error',{detail:e.message}));});
// This is a browser-only UI lock; Firestore writes are public by user choice.
const authListeners = new Set();
let unlocked = false;
try { unlocked = localStorage.getItem('notton-admin-unlocked') === 'true'; } catch {}
function notifyAccess() { authListeners.forEach(fn => fn(unlocked ? {displayName:'N0TT0N'} : null)); }
window.addEventListener('storage', event => {
  if (event.key === 'notton-admin-unlocked') { unlocked = event.newValue === 'true'; notifyAccess(); }
});
window.NottonData={
  signInPassword: async (id, password) => {
    if (id.trim() !== 'N0TT0N' || password !== '1234') throw new Error('ID หรือ Password ไม่ถูกต้อง');
    unlocked = true;
    try { localStorage.setItem('notton-admin-unlocked', 'true'); } catch {}
    notifyAccess();
  },
loadFresh:async()=>{await ready;return last;},load:async()=>{if(!loadPromise)loadPromise=read('site').then(async cached=>{if(cached){if(!cloudLoaded)last=cached;return last;}await ready;return last;});await loadPromise;return last;},save:async data=>{const cloud=await ready;const merged={...last,...data};await cloud.save(merged);last=merged;await write('site',merged);listeners.forEach(fn=>fn(merged));},subscribe:(fn,onError)=>{listeners.add(fn);if(onError)errorListeners.add(onError);if(cloudLoaded)queueMicrotask(()=>{if(listeners.has(fn))fn(last);});return()=>{listeners.delete(fn);if(onError)errorListeners.delete(onError);};},getPoster:async src=>(await ready).getPoster(src),putPoster:async(src,poster)=>(await ready).putPoster(src,poster),errorMessage:e=>window.NottonCloud?.errorMessage(e)||e.message||'บันทึกไม่สำเร็จ',signOut:async()=>{unlocked=false;try{localStorage.removeItem('notton-admin-unlocked');}catch{}notifyAccess();},authReady:async fn=>{authListeners.add(fn);fn(unlocked?{displayName:'N0TT0N'}:null);return()=>authListeners.delete(fn);}};
})();
