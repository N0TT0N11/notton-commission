import {resolveEmbed} from './embed-resolver.js?v=embed-20261005';
export const elements = [
  ['text','Text'],['list','List'],
  ['gallery','Image / Gallery'],['video','Video'],
  ['buttons','Buttons'],['links','Links'],
  ['audio','Audio'],['icons','Icons'],
  ['table','Table'],['timer','Timer'],
  ['divider','Divider'],['slideshow','Slideshow'],
  ['form','Form'],['embed','Embed'],
  ['widget','Widget'],['container','Container'],
  ['control','Control']
];
export function defaults(kind){
  const block={kind};
  if(kind==='text')Object.assign(block,{text:'ข้อความใหม่',align:'left'});
  if(kind==='list')Object.assign(block,{text:'รายการแรก\nรายการที่สอง',ordered:false});
  if(['gallery','video','slideshow'].includes(kind))Object.assign(block,{images:[],perPage:kind==='gallery'?3:1,fit:'contain'});
  if(kind==='table')Object.assign(block,{headers:['สเกล','ราคา'],rows:[[{text:'รายการ'},{text:'0 ฿'}]]});
  if(['buttons','links','icons'].includes(kind))block.items=[{label:kind==='icons'?'↗':'เปิดเว็บไซต์',url:'https://example.com'}];
  if(kind==='audio')Object.assign(block,{url:'',title:'เสียง'});
  if(kind==='timer')Object.assign(block,{deadline:'',text:'เหลือเวลา'});
  if(kind==='divider')Object.assign(block,{space:24,color:'#e6d5a9'});
  if(['embed','widget'].includes(kind))Object.assign(block,{url:'',height:320});
  if(kind==='form')Object.assign(block,{email:'',label:'ติดต่อเรา',fields:['ชื่อ','อีเมล','ข้อความ']});
  if(kind==='container')Object.assign(block,{columns:2,items:[{text:'เนื้อหาด้านซ้าย'},{text:'เนื้อหาด้านขวา'}]});
  if(kind==='control')Object.assign(block,{label:'ไปยัง Section',target:''});
  return block;
}
export function safeLink(value){
  if(typeof value!=='string'||!value.trim())return null;
  try {const url=new URL(value,location.href);return ['https:','http:','mailto:','tel:'].includes(url.protocol)?url.href:null;}catch{return null;}
}
export function renderExtra(card,block,{el,button,mediaSource}){
  if(block.kind==='list'){
    const list=el(block.ordered?'ol':'ul','rate-list');for(const text of (block.text||'').split('\n'))list.append(el('li','',text));card.append(list);
  }
  if(['buttons','links','icons'].includes(block.kind)){
    const row=el('div','rate-link-group '+block.kind);
    for(const item of block.items||[]){const link=el('a',block.kind==='buttons'?'rate-link-bubble':'',item.label);const url=safeLink(item.url);if(url){link.href=url;link.target='_blank';link.rel='noopener noreferrer';}else link.title='กรุณาตั้งค่าลิงก์';row.append(link);}card.append(row);
  }
  if(block.kind==='divider'){const wrap=el('div','rate-divider');wrap.style.paddingBlock=(Number(block.space)||24)+'px';const hr=el('hr');hr.style.borderColor=block.color||'#e6d5a9';wrap.append(hr);card.append(wrap);}
  if(block.kind==='audio'){
    const wrap=el('div','rate-audio');wrap.append(el('p','',block.title||'เสียง'));const audio=el('audio');audio.controls=true;audio.preload='none';if(block.mediaId)mediaSource(block.mediaId).then(src=>audio.src=src);else if(/^data:audio\//.test(block.url||''))audio.src=block.url;else if(safeLink(block.url))audio.src=safeLink(block.url);wrap.append(audio);card.append(wrap);
  }
  if(block.kind==='timer'){
    const wrap=el('div','rate-timer');wrap.append(el('strong','',block.text||'เหลือเวลา'));const output=el('p');
    const update=()=>{const end=Date.parse(block.deadline);if(!Number.isFinite(end)){output.textContent='เลือกวันและเวลาที่ต้องการ';return;}const seconds=Math.max(0,Math.floor((end-Date.now())/1000));output.textContent=seconds===0?'ครบกำหนดแล้ว':`${Math.floor(seconds/86400)} วัน ${Math.floor(seconds/3600)%24} ชั่วโมง ${Math.floor(seconds/60)%60} นาที ${seconds%60} วินาที`;};update();wrap.append(output);card.append(wrap);const clock=setInterval(()=>{if(!wrap.isConnected){clearInterval(clock);return;}update();},1000);
  }
  if(['embed','widget'].includes(block.kind)){
    const wrap=el('div','rate-embed'), info=resolveEmbed(block.url,block.embedMode);
    const height=Math.max(100,Math.min(1200,Number(block.height)||320));
    if(['image','video','audio'].includes(info.kind)){
      const media=el(info.kind==='image'?'img':info.kind);media.src=info.src;
      if(info.kind==='image'){media.alt=block.caption||'Embedded image';media.loading='lazy';}
      else {media.controls=true;media.preload='metadata';}
      media.onerror=()=>{media.hidden=true;wrap.prepend(el('p','','Media unavailable. Open the original link below.'));};wrap.append(media);
    } else if(info.kind==='iframe'){
      const frame=el('iframe');frame.src=info.src;frame.title=block.caption||info.provider+' embed';frame.loading='lazy';frame.height=height;
      frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-popups allow-presentation');frame.allow='fullscreen; picture-in-picture; encrypted-media';frame.referrerPolicy='strict-origin-when-cross-origin';wrap.append(frame);
    }
    if(info.message)wrap.append(el('p','rate-embed-note',info.message));
    if(info.source){const link=el('a','rate-embed-source',info.kind==='bookmark'?'↗ '+(block.caption||info.provider):'Open original ↗');link.href=info.source;link.target='_blank';link.rel='noopener noreferrer';wrap.append(link);}
    card.append(wrap);
  }
  if(block.kind==='form'){
    const form=el('form','rate-contact-form');form.append(el('h3','',block.label||'ติดต่อเรา'));
    for(const name of block.fields||[]){const label=el('label','',name),input=el(name==='ข้อความ'?'textarea':'input');input.name=name;input.required=true;if(name==='อีเมล')input.type='email';label.append(input);form.append(label);}
    const submit=el('button','','ส่งข้อความ');submit.type='submit';form.append(submit);
    const message=el('p');message.setAttribute('role','status');form.append(message);
    form.onsubmit=event=>{event.preventDefault();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(block.email||'')){message.textContent='กรุณาตั้งค่าอีเมลผู้รับก่อน';return;}const body=Array.from(new FormData(form),([name,value])=>name+': '+value).join('\n');location.href='mailto:'+encodeURIComponent(block.email)+'?subject='+encodeURIComponent(block.label||'ติดต่อ')+'&body='+encodeURIComponent(body);message.textContent='เปิดแอปอีเมลแล้ว โปรดตรวจข้อความและกดส่ง';};card.append(form);
  }
  if(block.kind==='container'){
    const wrap=el('div','rate-container');wrap.style.setProperty('--container-columns',Math.max(1,Math.min(4,Number(block.columns)||2)));for(const item of block.items||[])wrap.append(el('p','rate-paragraph',item.text));card.append(wrap);
  }
  if(block.kind==='control'){
    const wrap=el('div','rate-control');const link=el('a','rate-link-bubble',block.label||'ไปยัง Section');link.href='#section-'+encodeURIComponent(block.target||'');wrap.append(link);card.append(wrap);
  }
}

export function elementIcon(kind) {
  const paths = {
    text: 'M4 5h16M12 5v15M8 20h8',
    list: 'M9 6h11M9 12h11M9 18h11M4 6h1M4 12h1M4 18h1',
    gallery: 'M3 4h18v16H3zM3 16l5-5 4 4 3-3 6 6M15 8h.01',
    video: 'M3 6h12v12H3zM15 10l6-3v10l-6-3',
    buttons: 'M5 7h14a4 4 0 0 1 0 8H5a4 4 0 0 1 0-8zM8 11h8',
    links: 'M10 14l4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M16 8l1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0',
    audio: 'M9 18V5l11-2v13M9 5l11-2M9 17a3 3 0 1 0 0 1M20 15a3 3 0 1 0 0 1',
    icons: 'M12 3l3 6 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1z',
    table: 'M3 4h18v16H3zM3 9h18M3 15h18M11 4v16',
    timer: 'M9 2h6M12 2v3M19 5l2 2M12 8v5l3 2M21 13a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
    divider: 'M3 12h18M3 9v6M21 9v6',
    slideshow: 'M3 4h18v14H3zM9 8l5 3-5 3zM8 22l4-4 4 4',
    form: 'M5 3h14v18H5zM8 7h8M8 11h8M8 15h5',
    embed: 'M8 6l-6 6 6 6M16 6l6 6-6 6M14 3l-4 18',
    widget: 'M12 2l10 6v9l-10 6-10-6V8zM2 8l10 6 10-6M12 14v9',
    container: 'M3 3h18v18H3zM12 3v18',
    control: 'M9 3L7 21M17 3l-2 18M3 9h18M2 15h18'
  };
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');
  svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.6');
  svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
  svg.setAttribute('aria-hidden','true');
  const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[kind]);svg.append(path);return svg;
}
