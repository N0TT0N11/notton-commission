import {tosModel} from './tos-core.js';
import {render,styles} from './rate-core.js?v=20261004-test4';
styles();
let site=await NottonData.loadFresh();
NottonData.subscribe(value=>{site=value;queueMicrotask(()=>{if(document.querySelector('.tos-dialog')?.open)openTos();});});
function openTos(){const dialog=document.querySelector('.tos-dialog');if(!dialog)return;const content=dialog.querySelector('.tos-content');content.replaceChildren();render(content,tosModel(site),{},()=>openTos());content.querySelector('.rate-page-title')?.remove();dialog.querySelectorAll('[data-tos-language]').forEach(button=>button.hidden=true);if(!dialog.open)dialog.showModal();}
document.addEventListener('click',event=>{if(!event.target.closest('.tos-open,.hero-tos'))return;event.preventDefault();event.stopImmediatePropagation();openTos();},true);
const actions=document.querySelector('.hero .row');if(actions&&!document.querySelector('#akane-concepts')?.matches('[data-admin="true"]')){const link=document.createElement('button');link.type='button';link.className='contact-bubble hero-tos';link.textContent='TOS';actions.append(link);}
const panel=document.querySelector('.tos-admin');if(panel){panel.replaceChildren();const h=document.createElement('h2');h.textContent='TOS';const link=document.createElement('a');link.className='primary';link.href='tos-admin.html';link.target='_blank';link.rel='noopener noreferrer';link.textContent='Customize TOS ↗';panel.append(h,link);}
if(location.hash==='#tos')openTos();
window.addEventListener('hashchange',()=>{if(location.hash==='#tos')openTos();});
