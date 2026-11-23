(()=>{
'use strict';
document.documentElement.classList.add('js-enabled');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const header=document.querySelector('[data-header]');
const menu=document.getElementById('menuToggle');
const nav=document.getElementById('navLinks');
const navItems=nav?[...nav.querySelectorAll('a[href]')]:[];
const normalize=p=>{p=p.replace(/index\.html$/,'');if(!p.startsWith('/'))p='/'+p;if(!p.endsWith('/'))p+='/';return p.replace(/\/+/g,'/')};
const path=normalize(location.pathname);
navItems.forEach(a=>{const target=normalize(new URL(a.href,location.href).pathname);const active=target===path||(target==='/projects/'&&path.startsWith('/projects/'));if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
function closeMenu(restore=false){if(!menu||!nav)return;menu.setAttribute('aria-expanded','false');nav.classList.remove('open');document.body.classList.remove('menu-open');if(restore)menu.focus()}
function openMenu(){if(!menu||!nav)return;menu.setAttribute('aria-expanded','true');nav.classList.add('open');document.body.classList.add('menu-open');navItems[0]?.focus()}
if(menu&&nav){menu.addEventListener('click',()=>menu.getAttribute('aria-expanded')==='true'?closeMenu():openMenu());navItems.forEach(a=>a.addEventListener('click',()=>closeMenu()));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){e.preventDefault();closeMenu(true)}if(e.key==='Tab'&&menu.getAttribute('aria-expanded')==='true'&&matchMedia('(max-width: 820px)').matches){const focusables=[...nav.querySelectorAll('a[href]')];const first=focusables[0],last=focusables[focusables.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});document.addEventListener('pointerdown',e=>{if(nav.classList.contains('open')&&!nav.contains(e.target)&&!menu.contains(e.target))closeMenu()});addEventListener('resize',()=>{if(innerWidth>820)closeMenu()})}
// Sticky header and reading progress share one passive scroll observer.
const progress=document.getElementById('readingProgress');let ticking=false;
function updateScroll(){if(ticking)return;ticking=true;requestAnimationFrame(()=>{const max=document.documentElement.scrollHeight-innerHeight;const value=max>0?Math.min(1,Math.max(0,scrollY/max)):0;if(progress)progress.style.width=(value*100)+'%';header?.classList.toggle('is-scrolled',scrollY>18);ticking=false})}
addEventListener('scroll',updateScroll,{passive:true});addEventListener('resize',updateScroll);updateScroll();
// Reveal content groups with GSAP/ScrollTrigger when available; otherwise native IO.
const reveal=[...document.querySelectorAll('[data-reveal]')];
function showAll(){reveal.forEach(el=>el.classList.add('is-visible'))}
function nativeReveal(){if(reduce||!('IntersectionObserver'in window)){showAll();return}const io=new IntersectionObserver((entries,obs)=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');obs.unobserve(entry.target)}})},{threshold:.12,rootMargin:'0px 0px -7% 0px'});reveal.forEach(el=>io.observe(el))}
function motion(){if(reduce){showAll();return}nativeReveal()}
if(document.readyState==='complete')motion();else addEventListener('load',motion,{once:true});

// Archive imagery must be ready on route entry, never gated by scroll reveal.
(()=>{
 const images=[...document.querySelectorAll('.page-archive img[data-archive-image]')];
 images.forEach(img=>{
  img.classList.add('is-decoding');
  const reveal=()=>img.classList.add('is-ready');
  if(img.complete&&img.naturalWidth>0){
   if(img.decode)img.decode().then(reveal).catch(reveal);else reveal();
  }else{
   img.addEventListener('load',reveal,{once:true});
   img.addEventListener('error',reveal,{once:true});
  }
 });
})();

// Cross-document transitions are intentionally disabled: keep the persistent floating navigation visually continuous.
// Archive filter: visible state, pressed state and result count remain in sync.
const filters=[...document.querySelectorAll('[data-filter]')],cards=[...document.querySelectorAll('.page-archive [data-project]')];
const archiveGrid=document.querySelector('.page-archive .archive-grid');
if(archiveGrid&&cards.length){
 cards.forEach((card,i)=>{card.style.viewTransitionName=`archive-card-${i+1}`});
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const applyFilter=value=>{
  let shown=0;
  cards.forEach(card=>{
   const visible=value==='all'||card.dataset.project===value;
   card.classList.toggle('is-filtered-out',!visible);
   card.setAttribute('aria-hidden',String(!visible));
   card.inert=!visible;
   if(visible)shown++;
  });
  filters.forEach(b=>{const active=b.dataset.filter===value;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active))});
  const count=document.querySelector('[data-filter-count]');if(count)count.textContent=String(shown).padStart(2,'0');
 };
 filters.forEach(btn=>btn.addEventListener('click',()=>{
  const value=btn.dataset.filter;
  if(btn.classList.contains('is-active'))return;
  if(reduced.matches){applyFilter(value);return}
  if(document.startViewTransition){
   document.documentElement.classList.add('archive-filtering');
   const transition=document.startViewTransition(()=>applyFilter(value));
   transition.finished.finally(()=>document.documentElement.classList.remove('archive-filtering'));
  }else{
   const before=new Map(cards.map(card=>[card,card.getBoundingClientRect()]));
   applyFilter(value);
   cards.forEach(card=>{
    if(card.classList.contains('is-filtered-out'))return;
    const old=before.get(card),now=card.getBoundingClientRect();
    const wasVisible=old&&old.width>0&&old.height>0;
    const dx=wasVisible?old.left-now.left:0,dy=wasVisible?old.top-now.top:18;
    const sx=wasVisible&&now.width?old.width/now.width:.985;
    card.animate([
     {opacity:wasVisible?1:0,transform:`translate(${dx}px,${dy}px) scale(${sx},${wasVisible&&now.height?old.height/now.height:.985})`,filter:'blur(2px)'},
     {opacity:1,transform:'translate(0,0) scale(1,1)',filter:'blur(0)'}
    ],{duration:720,easing:'cubic-bezier(.16,1,.3,1)'});
   });
  }
 }));
}

// Local-only inquiry composer; no network request and no persistence.
const form=document.getElementById('inquiryForm');if(form){const ids=['projectType','location','size','budget','needs'];const fields=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));const make=document.getElementById('makeSummary'),copy=document.getElementById('copySummary'),status=document.getElementById('formStatus'),result=document.getElementById('inquiryResult');let summary='';function invalidate(){if(summary){summary='';result.hidden=true;copy.disabled=true;status.textContent='Isian berubah. Buat ulang ringkasan sebelum menyalin.'}}Object.values(fields).forEach(field=>{field.addEventListener('input',invalidate);field.addEventListener('change',invalidate)});make?.addEventListener('click',()=>{const required=['projectType','location','size','needs'].map(k=>fields[k]);const missing=required.find(f=>!f?.value.trim());if(missing){status.textContent='Lengkapi jenis proyek, lokasi, ukuran dan kebutuhan utama.';missing.focus();missing.setAttribute('aria-invalid','true');return}required.forEach(f=>f.removeAttribute('aria-invalid'));summary=['NUSA FORMA STUDIO — RINGKASAN KEBUTUHAN (KONSEP)','Jenis proyek: '+fields.projectType.value,'Lokasi: '+fields.location.value.trim(),'Ukuran perkiraan: '+fields.size.value.trim(),'Anggaran: '+(fields.budget.value||'Belum ditentukan'),'Kebutuhan utama: '+fields.needs.value.trim(),'','Catatan: ringkasan simulasi lokal; bukan pengiriman inquiry.'].join('\n');result.textContent=summary;result.hidden=false;copy.disabled=false;status.textContent='Ringkasan siap. Tidak ada data yang dikirim atau disimpan.';result.focus()});copy?.addEventListener('click',async()=>{if(!summary)return;try{await navigator.clipboard.writeText(summary);status.textContent='Ringkasan disalin ke clipboard.'}catch{const range=document.createRange();range.selectNodeContents(result);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='Clipboard tidak tersedia. Ringkasan dipilih; gunakan Ctrl/Cmd+C.'}})}
// Bespoke select surfaces: custom visual layer + native select as the value/validation source.
document.querySelectorAll('.inquiry-form select').forEach((native,index)=>{
 if(native.dataset.enhanced==='true')return;native.dataset.enhanced='true';native.classList.add('native-select-proxy');
 const label=native.closest('label');const caption=label?label.childNodes[0].textContent.trim().replace(/\s+/g,' '):'Pilih opsi';
 const shell=document.createElement('div');shell.className='select-composer';shell.dataset.selectIndex=String(index+1);
 const trigger=document.createElement('button');trigger.type='button';trigger.className='select-composer-trigger';trigger.id=native.id+'-trigger';trigger.setAttribute('role','combobox');trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls',native.id+'-listbox');trigger.setAttribute('aria-label',caption);trigger.textContent=native.selectedOptions[0]?.textContent||'Pilih opsi';
 const list=document.createElement('div');list.className='select-composer-list';list.id=native.id+'-listbox';list.setAttribute('role','listbox');list.setAttribute('aria-label',caption);list.hidden=true;
 const options=[...native.options];let active= Math.max(0,options.findIndex(o=>o.value===native.value));
 const buttons=options.map((option,i)=>{const b=document.createElement('button');b.type='button';b.className='select-composer-option';b.setAttribute('role','option');b.dataset.value=option.value;b.setAttribute('aria-selected',String(option.selected));b.disabled=option.disabled;b.innerHTML='<span class="select-option-index">'+String(i+1).padStart(2,'0')+'</span><span class="select-option-label"></span><span class="select-option-check" aria-hidden="true">✓</span>';b.querySelector('.select-option-label').textContent=option.textContent;b.addEventListener('click',()=>choose(i));list.append(b);return b});
 function paint(){trigger.textContent=native.selectedOptions[0]?.textContent||'Pilih opsi';buttons.forEach((b,i)=>{const selected=options[i].value===native.value;b.setAttribute('aria-selected',String(selected));b.classList.toggle('is-selected',selected)});}
 function close(restore=false){list.hidden=true;trigger.setAttribute('aria-expanded','false');shell.classList.remove('is-open');if(restore)trigger.focus()}
 function open(){list.hidden=false;trigger.setAttribute('aria-expanded','true');shell.classList.add('is-open');active=Math.max(0,options.findIndex(o=>o.value===native.value));buttons[active]?.focus();buttons[active]?.scrollIntoView({block:'nearest'})}
 function choose(i){const option=options[i];if(!option||option.disabled)return;native.value=option.value;native.dispatchEvent(new Event('input',{bubbles:true}));native.dispatchEvent(new Event('change',{bubbles:true}));paint();close(true)}
 trigger.addEventListener('click',()=>list.hidden?open():close());
 trigger.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','Enter',' '].includes(e.key)){e.preventDefault();open()} });
 list.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close(true);return}if(e.key==='Tab'){close();return}if(e.key==='ArrowDown'||e.key==='ArrowUp'||e.key==='Home'||e.key==='End'){e.preventDefault();if(e.key==='Home')active=0;else if(e.key==='End')active=buttons.length-1;else active=(active+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[active]?.focus();buttons[active]?.scrollIntoView({block:'nearest'});return}if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(buttons.indexOf(document.activeElement))}});
 document.addEventListener('pointerdown',e=>{if(!shell.contains(e.target))close()});native.addEventListener('change',paint);native.insertAdjacentElement('afterend',shell);shell.append(trigger,list);paint();
});
// FAQ disclosure: cancellable height animation; rapid reversals resume from the rendered height.
const faqs=[...document.querySelectorAll('.faq-list details')];
const faqAnimations=new WeakMap();
function faqPanel(item){return item.querySelector('.faq-answer')}
function faqSetA11y(item,expanded){
 const summary=item.querySelector('summary'),panel=faqPanel(item);
 summary?.setAttribute('aria-expanded',String(expanded));
 if(panel){panel.inert=!expanded;panel.setAttribute('aria-hidden',String(!expanded))}
}
function faqTransition(item,expanded){
 const panel=faqPanel(item);if(!panel)return;
 const previous=faqAnimations.get(item);
 const current=Math.max(0,panel.getBoundingClientRect().height);
 const currentOpacity=Number(getComputedStyle(panel).opacity);
 if(previous){previous.cancel();faqAnimations.delete(item)}
 panel.style.height=current+'px';panel.style.opacity=String(currentOpacity);panel.style.overflow='hidden';
 if(expanded){item.open=true;panel.inert=false;faqSetA11y(item,true)}
 else faqSetA11y(item,false);
 const target=expanded?panel.scrollHeight:0;
 if(reduce){panel.style.height=expanded?'auto':'0px';panel.style.opacity=expanded?'1':'0';if(!expanded)item.open=false;return}
 const animation=panel.animate(
  [{height:current+'px',opacity:getComputedStyle(panel).opacity||String(current?1:0)},
   {height:target+'px',opacity:expanded?1:0}],
  {duration:380,easing:'cubic-bezier(.22,.72,.18,1)',fill:'forwards'}
 );
 faqAnimations.set(item,animation);
 animation.onfinish=()=>{
  if(faqAnimations.get(item)!==animation)return;
  faqAnimations.delete(item);panel.style.height=expanded?'auto':'0px';
  panel.style.opacity=expanded?'1':'0';panel.style.overflow=expanded?'visible':'hidden';
  if(!expanded)item.open=false;animation.cancel();
 };
}
faqs.forEach(item=>{
 const summary=item.querySelector('summary'),panel=faqPanel(item);if(!summary||!panel)return;
 const expanded=item.open;faqSetA11y(item,expanded);
 panel.style.height=expanded?'auto':'0px';panel.style.opacity=expanded?'1':'0';
 panel.style.overflow=expanded?'visible':'hidden';if(!expanded)panel.inert=true;
 item.dataset.faqExpanded=String(expanded);
 summary.addEventListener('click',event=>{
  event.preventDefault();const next=item.dataset.faqExpanded!=='true';
  item.dataset.faqExpanded=String(next);
  if(next)faqs.filter(other=>other!==item&&other.dataset.faqExpanded==='true').forEach(other=>{
   other.dataset.faqExpanded='false';faqTransition(other,false)
  });
  faqTransition(item,next)
 });
 summary.addEventListener('keydown',event=>{
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
   event.preventDefault();const next=faqs[(faqs.indexOf(item)+(event.key==='ArrowDown'?1:-1)+faqs.length)%faqs.length].querySelector('summary');next?.focus()
  }
 });
});
// Small, consistent tactile feedback across links/cards/controls; never follows the pointer across the page.
document.querySelectorAll('.project-card,.service-tile,.principle-grid article,.process-steps article,.timeline-step').forEach(card=>{card.addEventListener('pointermove',e=>{if(reduce||matchMedia('(hover:none)').matches)return;const r=card.getBoundingClientRect();card.style.setProperty('--pointer-x',((e.clientX-r.left)/r.width*100)+'%');card.style.setProperty('--pointer-y',((e.clientY-r.top)/r.height*100)+'%')},{passive:true});card.addEventListener('pointerleave',()=>{card.style.removeProperty('--pointer-x');card.style.removeProperty('--pointer-y')},{passive:true})});
// Form labels announce progress without retaining or transmitting field values.
if(form){const requiredFields=[...form.querySelectorAll('[required]')];const updateProgress=()=>{const completed=requiredFields.filter(f=>String(f.value||'').trim()).length;form.style.setProperty('--form-progress',(completed/Math.max(1,requiredFields.length)*100)+'%');form.dataset.completed=String(completed)};requiredFields.forEach(field=>{field.addEventListener('input',updateProgress);field.addEventListener('change',updateProgress)});updateProgress()}

})();

// R5.5 — intentional entrance cadence and pointer-positioned surface feedback.
(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 requestAnimationFrame(()=>document.documentElement.classList.add('page-ready'));
 if(!reduced){
  document.querySelectorAll('[data-reveal]').forEach((el)=>{
   const siblings=[...el.parentElement.querySelectorAll(':scope > [data-reveal]')];
   const index=Math.max(0,siblings.indexOf(el));
   el.style.setProperty('--reveal-delay',Math.min(index*85,340)+'ms');
  });
  document.querySelectorAll('.project-card,.service-detail,.timeline-step,.principle-grid article').forEach(card=>{
   card.addEventListener('pointermove',event=>{
    if(matchMedia('(hover:none)').matches)return;
    const rect=card.getBoundingClientRect();
    card.style.setProperty('--pointer-x',((event.clientX-rect.left)/rect.width*100)+'%');
    card.style.setProperty('--pointer-y',((event.clientY-rect.top)/rect.height*100)+'%');
   },{passive:true});
   card.addEventListener('pointerleave',()=>{card.style.removeProperty('--pointer-x');card.style.removeProperty('--pointer-y')},{passive:true});
  });
 }
 const count=document.querySelector('[data-filter-count]');
 if(count){count.setAttribute('aria-live','polite');count.setAttribute('aria-atomic','true')}
})();



// Home process grid: one photographic field shared by all four steps.
(()=>{
 const grid=document.querySelector('[data-process-hover]');
 if(!grid||matchMedia('(hover:none)').matches)return;
 const items=[...grid.querySelectorAll('article')];
 const over=e=>{
  const card=e.target.closest('article');if(!card||!grid.contains(card))return;
  items.forEach(item=>item.classList.toggle('is-current',item===card));
 };
 const leave=()=>items.forEach(item=>item.classList.remove('is-current'));
 grid.addEventListener('pointerover',over,{passive:true});
 grid.addEventListener('pointerleave',leave,{passive:true});
})();

// R5.5.3 — low-latency ambient cursor; position follows the pointer directly.
(()=>{
 const fine=matchMedia('(hover:hover) and (pointer:fine)');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(!fine.matches||reduced.matches)return;
 const cursor=document.createElement('span');cursor.className='ambient-pointer';cursor.setAttribute('aria-hidden','true');document.body.append(cursor);
 const targets='a,button,summary,[role="button"],input,select,textarea,.service-tile,.principle-grid article';
 let visible=false;
 const move=e=>{cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px';if(!visible){visible=true;cursor.classList.add('is-visible')}};
 const over=e=>{if(e.target.closest(targets))cursor.classList.add('is-hovering')};
 const out=e=>{if(e.target.closest(targets)&&!e.relatedTarget?.closest(targets))cursor.classList.remove('is-hovering')};
 const leave=()=>{visible=false;cursor.classList.remove('is-visible','is-hovering')};
 document.addEventListener('pointermove',move,{passive:true});
 document.addEventListener('pointerover',over,{passive:true});
 document.addEventListener('pointerout',out,{passive:true});
 document.addEventListener('pointerleave',leave);
 const disable=e=>{if(e.matches){cursor.remove();document.removeEventListener('pointermove',move);document.removeEventListener('pointerover',over);document.removeEventListener('pointerout',out);document.removeEventListener('pointerleave',leave)}};
 reduced.addEventListener?.('change',disable);
})();


// R5.5.13 — map every tile to one shared image coordinate system, so the four crops connect.
(()=>{
 const grid=document.querySelector('.page-studio .principle-grid');
 if(!grid)return;
 const cards=[...grid.querySelectorAll(':scope > article')];
 if(cards.length!==4)return;
 const sync=()=>{
  const width=grid.clientWidth,height=grid.clientHeight;
  cards.forEach(card=>{
   card.style.setProperty('--principle-photo-width',width+'px');
   card.style.setProperty('--principle-photo-height',height+'px');
   card.style.setProperty('--principle-photo-x',(-card.offsetLeft)+'px');
   card.style.setProperty('--principle-photo-y',(-card.offsetTop)+'px');
  });
 };
 sync();
 if('ResizeObserver'in window){
  const observer=new ResizeObserver(sync);
  observer.observe(grid);
  cards.forEach(card=>observer.observe(card));
 }
 window.addEventListener('load',sync,{once:true});
})();
