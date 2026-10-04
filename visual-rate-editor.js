import {tosModel} from './tos-core.js';
const editingTos=document.body.dataset.editor==='tos';
const contentKey=editingTos?'tosContent':'priceRate';
const editorModel=site=>editingTos?tosModel(site):normalize(site);
import {elements,defaults,elementIcon} from './element-library.js?v=embed-20261005';
import {normalize, render, el, button, uid, clone, readImage, readMedia, mediaSource, move} from './rate-core.js?v=embed-20261005';
let saved={};
let savedSignature='';
let saving=false;
let model=editorModel(saved), selected=null, sectionId=model.sections[0]?.id, insertAt=null;
savedSignature=JSON.stringify(model);
let history=[clone(model)], cursor=0, pending=null, preview=false, drag=null, timer;
const canvas=document.querySelector('#rate-page');
const properties=document.querySelector('#editor-properties');
const addPanel=document.querySelector('#editor-add');
const tools=document.querySelector('#editor-tools');
const status=document.querySelector('#editor-status');
const pages={};
let dockSide='left';
try {dockSide=localStorage.getItem('notton-editor-dock')==='right'?'right':'left';} catch {}
document.body.dataset.dock=dockSide;
function setDock(side){dockSide=side;document.body.dataset.dock=side;try{localStorage.setItem('notton-editor-dock',side);}catch{}toolbar();}

function currentSection(){return model.sections.find(s=>s.id===sectionId);}
function currentBlock(){return currentSection()?.blocks.find(b=>b.id===selected);}
function snapshot(){
  clearTimeout(timer);
  if(JSON.stringify(history[cursor])===JSON.stringify(model))return;
  {
    history=history.slice(0,cursor+1); history.push(clone(model));
    if(history.length>40)history.shift(); cursor=history.length-1;
  }
  status.textContent='มีการแก้ไขที่ยังไม่ได้บันทึก';
  const undo=tools.querySelector('[aria-label="ย้อนกลับ"]'),redo=tools.querySelector('[aria-label="ทำซ้ำ"]');
  if(undo)undo.disabled=cursor===0;if(redo)redo.disabled=cursor===history.length-1;
}
function change(){
  clearTimeout(timer);
  timer=setTimeout(()=>{snapshot(); paint();},180);
}
function act(fn){snapshot();fn();snapshot();paint();inspect();}
function field(label,value,callback,type='input'){
  const wrap=el('label','ve-field',label), input=el(type);
  input.value=value??'';input.setAttribute('aria-label',label);
  input.oninput=()=>{callback(input.value);change();}; wrap.append(input);return wrap;
}
function select(label,value,options,callback){
  const wrap=el('label','ve-field',label), input=el('select');input.setAttribute('aria-label',label);
  for(const [v,text] of options){const item=el('option','',text);item.value=v;item.selected=v===String(value);input.append(item);}
  input.onchange=()=>{act(()=>callback(input.value));};wrap.append(input);return wrap;
}
function action(label,fn,symbol){const control=button(symbol||label,fn,label);control.title=label;return control;}
function toolbar(){
  tools.replaceChildren();
  const undo=action('ย้อนกลับ',()=>{snapshot();if(cursor>0){model=clone(history[--cursor]);selected=null;paint();inspect();toolbar();status.textContent='ย้อนกลับแล้ว · ยังไม่ได้บันทึก';}},'↶');undo.disabled=cursor===0;
  const redo=action('ทำซ้ำ',()=>{if(cursor<history.length-1){model=clone(history[++cursor]);selected=null;paint();inspect();toolbar();status.textContent='ทำซ้ำแล้ว · ยังไม่ได้บันทึก';}},'↷');redo.disabled=cursor===history.length-1;
  tools.append(action('บันทึก',async()=>{
    if(saving)return;
    snapshot();paint();saving=true;tools.querySelector('button').disabled=true;
    const snapshotModel=clone(model);
    status.textContent='กำลังบันทึก…';
    try {
      await window.NottonData.save({[contentKey]:snapshotModel});
      savedSignature=JSON.stringify(snapshotModel);
      status.textContent=savedSignature===JSON.stringify(model)?'บันทึกแล้ว':'บันทึกแล้ว · มีการแก้ไขใหม่ที่ยังไม่ได้บันทึก';
    } catch(error) {status.textContent=window.NottonData.errorMessage(error);}
    finally {saving=false;tools.querySelector('button').disabled=false;}
  },'บันทึก'),action(editingTos?'เปิด TOS':'เปิดหน้า Price rate',()=>window.open(editingTos?'index.html#tos':'price-rate.html','_blank','noopener'),'↗'),action('มุมมองมือถือ',()=>{document.body.classList.toggle('ve-mobile');},'▯'),action('Sections',showSections,'#'),action('พรีวิว',()=>{preview=!preview;document.body.classList.toggle('ve-preview',preview);paint();properties.hidden=true;addPanel.hidden=true;},'▷'),undo,redo,action('เพิ่มองค์ประกอบ',()=>{addPanel.hidden=!addPanel.hidden;buildAdd();},'+'),action('Dock left',()=>setDock('left'),'⇤'),action('Dock right',()=>setDock('right'),'⇥'));
  tools.querySelector('[aria-label="Dock left"]').disabled=dockSide==='left';
  tools.querySelector('[aria-label="Dock right"]').disabled=dockSide==='right';
}
function paint(){
  render(canvas,model,pages,paint);
  for(const node of canvas.querySelectorAll('[data-block-id]')){
    node.classList.add('ve-element'); node.classList.toggle('ve-selected',node.dataset.blockId===selected);
    node.draggable=!preview&&!node.matches('.rate-paragraph');
  }
  if(!preview)for(const node of canvas.querySelectorAll('.rate-embed[data-block-id]')) {
    const remove=action('Delete embed',()=>act(()=>{
      const section=model.sections.find(s=>s.id===node.closest('[data-section-id]').dataset.sectionId);
      const at=section.blocks.findIndex(b=>b.id===node.dataset.blockId);
      if(at>=0)section.blocks.splice(at,1);selected=null;
    }),'×');
    remove.className='ve-embed-delete';node.append(remove);
  }
  for(const figure of canvas.querySelectorAll('[data-image-index]')) {figure.draggable=!preview;figure.querySelector('img,video').draggable=false;}
  for(const node of canvas.querySelectorAll('.rate-public-card > h2'))node.classList.add('ve-section-title');
  for(const node of canvas.querySelectorAll('.rate-paragraph[data-block-id],.rate-page-title,.ve-section-title')) {
    node.contentEditable=preview?'false':'plaintext-only';
    node.spellcheck=true;
    node.setAttribute('aria-label', node.matches('.rate-page-title')?'แก้ชื่อหน้า':node.matches('.ve-section-title')?'แก้ชื่อ Section':'แก้ข้อความตรงนี้');
    node.oninput=()=>{
      const section=model.sections.find(s=>s.id===node.closest('[data-section-id]')?.dataset.sectionId);
      if(node.matches('.rate-page-title'))model.title=node.innerText;
      else if(node.matches('.ve-section-title'))section.name=node.innerText;
      else section.blocks.find(b=>b.id===node.dataset.blockId).text=node.innerText;
      clearTimeout(timer);timer=setTimeout(snapshot,250);
    };
    node.onblur=()=>snapshot();
  }
}
function panelHeader(title){properties.replaceChildren();properties.hidden=false;const row=el('div','ve-panel-title');row.append(el('h2','',title),action('ปิดตั้งค่า',()=>{properties.hidden=true;},'×'));properties.append(row);}
function inspect(){
  if(preview)return;
  const section=currentSection(), block=currentBlock();
  if(selected==='page'){
    panelHeader('ตั้งค่าหน้า');properties.append(field('ชื่อหน้า',model.title,v=>model.title=v));return;
  }
  if(!block){properties.hidden=true;return;}
  panelHeader(elements.find(item=>item[0]===block.kind)?.[1]||'องค์ประกอบ');
  const tabs=el('div','ve-actions');
  tabs.append(action('ทำสำเนา',()=>act(()=>{const copy=clone(block);copy.id=uid();section.blocks.splice(section.blocks.indexOf(block)+1,0,copy);selected=copy.id;})),action('ลบ',()=>act(()=>{section.blocks.splice(section.blocks.indexOf(block),1);selected=null;})));
  properties.append(tabs);
  properties.append(select('Section',sectionId,model.sections.map(s=>[s.id,s.name]),value=>{section.blocks.splice(section.blocks.indexOf(block),1);model.sections.find(s=>s.id===value).blocks.push(block);sectionId=value;}));
  const order=el('div','ve-actions');order.append(action('เลื่อนขึ้น',()=>act(()=>move(section.blocks,section.blocks.indexOf(block),section.blocks.indexOf(block)-1)),'↑'),action('เลื่อนลง',()=>act(()=>move(section.blocks,section.blocks.indexOf(block),section.blocks.indexOf(block)+1)),'↓'));properties.append(order);
  if(block.kind==='text')properties.append(el('p','','พิมพ์แก้ข้อความบนหน้าได้โดยตรง'));
  if(block.kind!=='gallery'){
    properties.append(select('จัดแนว',block.align||'left',[['left','ชิดซ้าย'],['center','กึ่งกลาง'],['right','ชิดขวา']],v=>block.align=v));
    const size=field('ขนาดตัวอักษร (px)',block.fontSize||18,v=>block.fontSize=Math.max(10,Math.min(64,Number(v)||18)));size.querySelector('input').type='number';properties.append(size);
  }
  if(block.kind==='table')tableEditor(block);
  if(['gallery','video','slideshow'].includes(block.kind))galleryEditor(block);
  extraEditor(block);
}
function tableEditor(block){
  const scroll=el('div','ve-table-scroll'),table=el('table','ve-table');
  const head=el('tr');
  block.headers.forEach((name,col)=>{const th=el('th');th.append(field('คอลัมน์ '+(col+1),name,v=>block.headers[col]=v));const remove=action('ลบคอลัมน์ '+(col+1),()=>act(()=>{block.headers.splice(col,1);block.rows.forEach(row=>row.splice(col,1));}),'×');remove.disabled=block.headers.length===1;th.append(remove);head.append(th);});head.append(el('th'));const thead=el('thead');thead.append(head);table.append(thead);
  const body=el('tbody');block.rows.forEach((row,i)=>{const tr=el('tr');block.headers.forEach((name,j)=>{if(typeof row[j]==='string')row[j]={text:row[j]};row[j]??={text:''};const td=el('td');td.append(field(name+' แถว '+(i+1),row[j].text,v=>row[j].text=v));tr.append(td);});const td=el('td');td.append(action('ลบแถว '+(i+1),()=>act(()=>block.rows.splice(i,1)),'×'));tr.append(td);body.append(tr);});table.append(body);scroll.append(table);properties.append(scroll);
  const actions=el('div','ve-actions');actions.append(action('+ แถว',()=>act(()=>block.rows.push(block.headers.map(()=>({text:''}))))),action('+ คอลัมน์',()=>act(()=>{block.headers.push('ใหม่');block.rows.forEach(row=>row.push({text:''}));})));properties.append(actions);
}
function adjacentGallery(block,direction){
  const galleries=model.sections.flatMap(section=>section.blocks.filter(item=>['gallery','video','slideshow'].includes(item.kind)).map(item=>({section,block:item})));
  const index=galleries.findIndex(item=>item.block.id===block.id);
  return galleries[index+direction];
}
function moveImage(block,index,direction){
  const next=index+direction;
  if(next>=0&&next<block.images.length){move(block.images,index,next);return;}
  const destination=adjacentGallery(block,direction);if(!destination)return;
  const [image]=block.images.splice(index,1);
  destination.block.images.splice(direction<0?destination.block.images.length:0,0,image);
  selected=destination.block.id;sectionId=destination.section.id;
}
function galleryEditor(block){

  properties.append(select('จำนวนภาพต่อหน้า',String(block.perPage||3),[1,2,3,4,5,6].map(n=>[String(n),String(n)]),v=>block.perPage=Number(v)),select('การแสดงรูป',block.fit||'cover',[['cover','เต็มกรอบ (Fit in)'],['contain','เต็มภาพ ไม่ตัดขอบ'],['natural','Original ratio · No frame']],v=>block.fit=v),select('ตำแหน่งภาพ',block.position||'center',[['center','กึ่งกลาง'],['top','ด้านบน'],['bottom','ด้านล่าง'],['left','ด้านซ้าย'],['right','ด้านขวา']],v=>block.position=v));
  properties.append(select('Media width',String(!!block.fullWidth),[['false','Gallery columns'],['true','Full container width']],v=>block.fullWidth=v==='true'));
  const upload=el('input');upload.type='file';upload.multiple=true;upload.accept='image/*,video/*';upload.setAttribute('aria-label','เพิ่มภาพ วิดีโอ หรือ GIF');upload.onchange=async()=>{
    upload.disabled=true;status.textContent='กำลังเตรียมภาพ…';try{const additions=[];for(const file of upload.files)additions.push({...await readMedia(file),alt:''});act(()=>block.images.push(...additions));}catch(e){status.textContent=e.message;}finally{upload.disabled=false;}
  };properties.append(upload);
  block.images.forEach((image,i)=>{
    const row=el('div','ve-image-row'),img=el('img');
    row.dataset.imageIndex=i;row.dataset.galleryId=block.id;
    if(image.type==='video'){img.src=image.poster||'';img.alt='Video: '+(image.alt||'');}
    else if(image.mediaId){mediaSource(image.mediaId).then(src=>img.src=src);}else img.src=image.src;
    img.alt=image.alt||'';img.loading='lazy';img.draggable=true;img.title='Drag to reorder';
    img.ondragstart=event=>{event.stopPropagation();drag={kind:'image',section:sectionId,id:block.id,imageIndex:i};event.dataTransfer.setData('text/plain',block.id);event.dataTransfer.effectAllowed='move';};
    row.ondragover=event=>{if(drag?.kind==='image'){event.preventDefault();row.classList.add('ve-row-drop');}};
    row.ondragleave=()=>row.classList.remove('ve-row-drop');
    row.ondrop=event=>{
      event.preventDefault();event.stopPropagation();if(drag?.kind!=='image')return;
      const source=model.sections.find(section=>section.id===drag.section)?.blocks.find(item=>item.id===drag.id);
      const from=drag.imageIndex;drag=null;if(!source||source===block&&from===i)return;
      act(()=>{const [asset]=source.images.splice(from,1);if(asset)block.images.splice(i,0,asset);});
    };
    img.ondragend=()=>{drag=null;properties.querySelectorAll('.ve-row-drop').forEach(item=>item.classList.remove('ve-row-drop'));};
    const remove=action('ลบภาพ '+(i+1),()=>act(()=>block.images.splice(i,1)),'×');
    row.append(img,field('คำอธิบายภาพ '+(i+1),image.alt,v=>image.alt=v),remove);properties.append(row);
  });

}
function showSections(){
  panelHeader('Sections');
  properties.append(field('ชื่อหน้า',model.title,v=>model.title=v));
  model.sections.forEach((section,i)=>{const card=el('div','ve-section-settings');card.append(field('ชื่อ Section '+(i+1),section.name,v=>section.name=v),action('เลือก Section',()=>{sectionId=section.id;selected=null;insertAt=section.blocks.length;properties.hidden=true;canvas.querySelector(`[data-section-id="${section.id}"]`)?.scrollIntoView({behavior:'smooth',block:'start'});status.textContent='เลือก '+section.name+' แล้ว · กด + เพื่อเพิ่มองค์ประกอบ';}),action('Section ขึ้น',()=>{act(()=>move(model.sections,i,i-1));showSections();},'↑'),action('Section ลง',()=>{act(()=>move(model.sections,i,i+1));showSections();},'↓'),action('ลบ Section',()=>{act(()=>{model.sections.splice(i,1);sectionId=model.sections[0]?.id;selected=null;});showSections();}));properties.append(card);});
  properties.append(action('+ Section',()=>{act(()=>{const section={id:uid(),name:'Section ใหม่',blocks:[]};model.sections.push(section);sectionId=section.id;});showSections();}));
}
function buildAdd(){
  addPanel.replaceChildren();const row=el('div','ve-panel-title');row.append(el('h2','','Add element'),action('Close add menu',()=>addPanel.hidden=true,'×'));addPanel.append(row,el('p','','Select an element on the page to insert after it.'));
  for(const [kind,label]of elements){const item=action(label,()=>{
    act(()=>{let section=currentSection();if(!section){section={id:uid(),name:'Section ใหม่',blocks:[]};model.sections.push(section);sectionId=section.id;}const block={id:uid(),...defaults(kind)};if(kind==='control')block.target=section.id;const at=insertAt===null?section.blocks.length:Math.min(insertAt,section.blocks.length);section.blocks.splice(at,0,block);selected=block.id;insertAt=at+1;});addPanel.hidden=true;canvas.querySelector(`[data-block-id="${selected}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});
  });item.replaceChildren(elementIcon(kind),el('span','',label));addPanel.append(item);}
}
canvas.onclick=event=>{
  if(preview)return;
  if(event.target.closest('button')&&!event.target.closest('.rate-embed'))return;
  if(event.target.closest('a'))event.preventDefault();
  addPanel.hidden=true;
  if(event.target.closest('.rate-page-title')){selected='page';properties.hidden=true;return;}
  const sectionNode=event.target.closest('[data-section-id]');if(!sectionNode)return;
  sectionId=sectionNode.dataset.sectionId;
  if(event.target.closest('.ve-section-title')){selected=null;properties.hidden=true;return;}
  const node=event.target.closest('[data-block-id]');
  if(node?.matches('.rate-paragraph')){selected=node.dataset.blockId;insertAt=currentSection().blocks.findIndex(b=>b.id===selected)+1;canvas.querySelectorAll('.ve-selected').forEach(n=>n.classList.remove('ve-selected'));node.classList.add('ve-selected');inspect();return;}
  if(node){selected=node.dataset.blockId;insertAt=currentSection().blocks.findIndex(b=>b.id===selected)+1;paint();inspect();}
  else {selected=null;insertAt=0;properties.hidden=true;canvas.querySelectorAll('.ve-selected').forEach(n=>n.classList.remove('ve-selected'));}
};
document.addEventListener('click',event=>{
  if(event.composedPath().some(node=>[tools,properties,addPanel].includes(node)))return;
  if(event.target.closest('[data-block-id]'))return;
  properties.hidden=true;addPanel.hidden=true;selected=null;
  canvas.querySelectorAll('.ve-selected').forEach(node=>node.classList.remove('ve-selected'));
});
canvas.ondragstart=event=>{
  const node=event.target.closest('[data-block-id]');if(!node||preview)return;
  const figure=event.target.closest('[data-image-index]');
  drag={kind:figure?'image':'block',section:node.closest('[data-section-id]').dataset.sectionId,id:node.dataset.blockId,imageIndex:figure?Number(figure.dataset.imageIndex):null};
  event.dataTransfer.setData('text/plain',drag.id);event.dataTransfer.effectAllowed='move';
};
canvas.ondragover=event=>{if(drag){event.preventDefault();const node=event.target.closest('[data-block-id]');canvas.querySelectorAll('.ve-drop-target').forEach(n=>n.classList.remove('ve-drop-target'));node?.classList.add('ve-drop-target');}};
canvas.ondrop=event=>{
  event.preventDefault();
  const node=event.target.closest('[data-block-id]'),target=event.target.closest('[data-section-id]');
  if(!drag||!target)return;
  const dragged=drag;drag=null;
  act(()=>{
    const source=model.sections.find(s=>s.id===dragged.section),destination=model.sections.find(s=>s.id===target.dataset.sectionId);
    const block=source.blocks.find(b=>b.id===dragged.id);
    if(!block)return;
    if(dragged.kind==='image') {
      const gallery=destination.blocks.find(b=>b.id===node?.dataset.blockId);
      if(!['gallery','video','slideshow'].includes(gallery?.kind)){status.textContent='วางภาพบนแกลเลอรีเพื่อจัดให้อยู่บรรทัดเดียวกัน';return;}
      const image=block.images[dragged.imageIndex];if(!image)return;
      const figure=event.target.closest('[data-image-index]');
      let at=figure?Number(figure.dataset.imageIndex):gallery.images.length;
      if(gallery===block&&dragged.imageIndex<at)at--;
      block.images.splice(dragged.imageIndex,1);gallery.images.splice(Math.max(0,at),0,image);
      gallery.perPage=Math.max(2,gallery.perPage||3);selected=gallery.id;sectionId=destination.id;
      return;
    }
    if(node?.dataset.blockId===block.id)return;
    source.blocks.splice(source.blocks.indexOf(block),1);
    const at=node?destination.blocks.findIndex(b=>b.id===node.dataset.blockId):destination.blocks.length;
    destination.blocks.splice(Math.max(0,at),0,block);selected=block.id;sectionId=destination.id;
  });
};
canvas.ondragend=()=>{drag=null;canvas.querySelectorAll('.ve-drop-target').forEach(n=>n.classList.remove('ve-drop-target'));};
window.addEventListener('keydown',event=>{if(event.key==='Escape'){properties.hidden=true;addPanel.hidden=true;selected=null;paint();}});
window.addEventListener('beforeunload',event=>{if(savedSignature!==JSON.stringify(model)){event.preventDefault();event.returnValue='';}});
window.NottonData.authReady(async user=>{
  if(!user)return;
  try {
    const site=await window.NottonData.loadFresh();
    model=editorModel(site);savedSignature=JSON.stringify(model);
    sectionId=model.sections[0]?.id;history=[clone(model)];cursor=0;
    paint();toolbar();status.textContent='พร้อมแก้ไข';
  }catch(error){status.textContent=window.NottonData.errorMessage(error);}
});

function extraEditor(block){
  if(['buttons','links','icons'].includes(block.kind)){
    block.items.forEach((item,i)=>{const group=el('div','ve-section-settings');group.append(field('ข้อความ '+(i+1),item.label,v=>item.label=v),field('ลิงก์ '+(i+1),item.url,v=>item.url=v),action('ลบรายการ '+(i+1),()=>act(()=>block.items.splice(i,1))));properties.append(group);});
    properties.append(action('+ เพิ่มรายการ',()=>act(()=>block.items.push({label:'ลิงก์ใหม่',url:'https://example.com'}))));
  }
  if(block.kind==='list')properties.append(field('รายการ (หนึ่งบรรทัดต่อรายการ)',block.text,v=>block.text=v,'textarea'),select('รูปแบบรายการ',String(!!block.ordered),[['false','จุดนำหน้า'],['true','ลำดับเลข']],v=>block.ordered=v==='true'));
  if(block.kind==='timer'){const date=field('วันเวลาสิ้นสุด',block.deadline,v=>block.deadline=v);date.querySelector('input').type='datetime-local';properties.append(field('ข้อความ',block.text,v=>block.text=v),date);}
  if(block.kind==='divider')properties.append(field('ช่องว่าง (px)',block.space,v=>block.space=Math.max(0,Math.min(200,Number(v)||0))),field('สีเส้น',block.color,v=>block.color=v));
  if(['embed','widget'].includes(block.kind))properties.append(field('Embed URL or iframe code',block.url,v=>block.url=v,'textarea'),select('Display',block.embedMode||'embed',[['embed','Embed'],['bookmark','Bookmark']],v=>block.embedMode=v),field('Caption',block.caption,v=>block.caption=v),field('ความสูง (px)',block.height,v=>block.height=Math.max(100,Math.min(1200,Number(v)||320))),el('p','','Paste a public link. Use Preview to interact with embedded content.'));
  if(block.kind==='audio'){
    properties.append(field('ชื่อเสียง',block.title,v=>block.title=v),field('ลิงก์ไฟล์เสียง',block.url,v=>{block.url=v;delete block.mediaId;}));
    const upload=el('input');upload.type='file';upload.accept='audio/*';upload.setAttribute('aria-label','เพิ่มไฟล์เสียง');upload.onchange=async()=>{try{const asset=await readMedia(upload.files[0]);act(()=>{block.url=asset.src;delete block.mediaId;block.title=asset.alt;});}catch(e){status.textContent=e.message;}};properties.append(upload);
  }
  if(block.kind==='form')properties.append(field('ชื่อแบบฟอร์ม',block.label,v=>block.label=v),field('อีเมลผู้รับ',block.email,v=>block.email=v),field('ช่องกรอก (หนึ่งบรรทัดต่อช่อง)',block.fields.join('\n'),v=>block.fields=v.split('\n').filter(Boolean),'textarea'),el('p','','Prototype เปิดแอปอีเมลพร้อมข้อความ ยังไม่ส่งหรือเก็บคำตอบบนเซิร์ฟเวอร์'));
  if(block.kind==='container'){
    properties.append(select('จำนวนคอลัมน์',String(block.columns),[1,2,3,4].map(n=>[String(n),String(n)]),v=>block.columns=Number(v)));
    block.items.forEach((item,i)=>properties.append(field('เนื้อหา '+(i+1),item.text,v=>item.text=v,'textarea'),action('ลบช่อง '+(i+1),()=>act(()=>block.items.splice(i,1)))));
    properties.append(action('+ ช่องเนื้อหา',()=>act(()=>block.items.push({text:'เนื้อหาใหม่'}))));
  }
  if(block.kind==='control')properties.append(field('ข้อความปุ่ม',block.label,v=>block.label=v),select('ไปยัง Section',block.target,model.sections.map(s=>[s.id,s.name]),v=>block.target=v));
}
