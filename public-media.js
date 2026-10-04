// Discourage casual image saving on public pages; admin editing remains unchanged.
if(!/admin(?:\.html)?(?:$|\/)/i.test(location.pathname)){
 const style=document.createElement('style');
 style.textContent='img,video {-webkit-touch-callout:none;user-select:none;-webkit-user-select:none;-webkit-user-drag:none;}';document.head.append(style);
 const mediaTarget=event=>event.composedPath().find(node=>node instanceof Element&&node.matches('img,video,picture,canvas'));
 document.addEventListener('contextmenu',event=>{if(mediaTarget(event))event.preventDefault();});
 document.addEventListener('dragstart',event=>{if(mediaTarget(event))event.preventDefault();});
}
if(!/admin(?:\.html)?(?:$|\/)/i.test(location.pathname)){
 const selector='.rate-gallery-grid img,.rate-slideshow img,.offer-image img,.gallery img,.latest img,.showcase img';
 const dialog=document.createElement('dialog');dialog.className='public-lightbox';dialog.setAttribute('aria-label','Full image viewer');
 const image=document.createElement('img');image.alt='Full artwork';
 const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label','Close image');
 const previous=document.createElement('button');previous.textContent='‹';previous.setAttribute('aria-label','Previous image');
 const next=document.createElement('button');next.textContent='›';next.setAttribute('aria-label','Next image');
 const count=document.createElement('output');dialog.append(close,previous,image,next,count);document.body.append(dialog);
 const style=document.createElement('style');style.textContent=`.public-lightbox{box-sizing:border-box;position:fixed;inset:0;width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;margin:0;border:0;padding:60px 48px;background:#181512;color:white;overflow:hidden}.public-lightbox::backdrop{background:#181512e6}.public-lightbox img{display:block;width:100%;height:100%;object-fit:contain}.public-lightbox button{position:absolute;background:#fff;color:#5c422c;border:0;border-radius:999px;width:44px;height:44px;font-size:30px;z-index:2}.public-lightbox button:first-child{right:12px;top:12px}.public-lightbox button:nth-child(2){left:4px;top:50%}.public-lightbox button:nth-child(4){right:4px;top:50%}.public-lightbox output{position:absolute;bottom:16px;left:0;width:100%;text-align:center}.public-lightbox button:disabled{opacity:.3}${selector}{cursor:zoom-in}`;document.head.append(style);
 let images=[],index=0,oldOverflow='';
 const show=()=>{image.src=images[index].currentSrc||images[index].src;image.alt=images[index].alt||'Full artwork';previous.disabled=index===0;next.disabled=index===images.length-1;count.textContent=(index+1)+' / '+images.length;};
 function open(target){const group=target.closest('.rate-public-card,.offer-card,.showcase,.gallery,.latest')||document;images=[...group.querySelectorAll(selector)].filter(n=>n.src&&n.getBoundingClientRect().width>0&&!n.src.includes('Loading%20media'));index=images.indexOf(target);if(index<0)return;show();oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();}
 close.onclick=()=>dialog.close();previous.onclick=()=>{if(index>0){index--;show();}};next.onclick=()=>{if(index<images.length-1){index++;show();}};
 dialog.addEventListener('close',()=>{document.body.style.overflow=oldOverflow;image.removeAttribute('src');});
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 dialog.addEventListener('keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();next.click();}if(event.key==='ArrowLeft'){event.preventDefault();previous.click();}});
 document.addEventListener('click',event=>{if(event.target.matches?.(selector)&&!event.target.closest('.public-lightbox')){event.preventDefault();open(event.target);}});
 document.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)&&event.target.matches?.(selector)){event.preventDefault();open(event.target);}});
 const prepare=root=>{for(const n of root.querySelectorAll?.(selector)||[]){n.tabIndex=0;n.setAttribute('role','button');n.setAttribute('aria-label','View full image');}};prepare(document);
 new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node instanceof Element){prepare(node.parentElement||node);}}).observe(document.body,{childList:true,subtree:true});
}
