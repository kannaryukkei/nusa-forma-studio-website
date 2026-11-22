document.documentElement.classList.add('js-enabled');

const menuToggle=document.getElementById('menuToggle');
const navLinks=document.getElementById('navLinks');
function closeMenu(){if(!menuToggle||!navLinks)return;menuToggle.setAttribute('aria-expanded','false');navLinks.classList.remove('open')}
if(menuToggle&&navLinks){
  menuToggle.addEventListener('click',()=>{
    const open=menuToggle.getAttribute('aria-expanded')!=='true';
    menuToggle.setAttribute('aria-expanded',String(open));
    navLinks.classList.toggle('open',open);
  });
  navLinks.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&menuToggle.getAttribute('aria-expanded')==='true'){
      closeMenu();menuToggle.focus();
    }
  });
  document.addEventListener('click',event=>{
    if(navLinks.classList.contains('open')&&!navLinks.contains(event.target)&&!menuToggle.contains(event.target))closeMenu();
  });
}

const progress=document.getElementById('readingProgress');
function updateProgress(){
  if(!progress)return;
  const max=document.documentElement.scrollHeight-window.innerHeight;
  const value=max>0?Math.min(100,Math.max(0,window.scrollY/max*100)):0;
  progress.style.width=value+'%';
}
window.addEventListener('scroll',updateProgress,{passive:true});
window.addEventListener('resize',updateProgress);
updateProgress();

const revealItems=[...document.querySelectorAll('[data-reveal]')];
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduceMotion&&'IntersectionObserver' in window){
  const revealObserver=new IntersectionObserver((entries,observer)=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  },{threshold:.12,rootMargin:'0px 0px -5% 0px'});
  revealItems.forEach(item=>revealObserver.observe(item));
}else revealItems.forEach(item=>item.classList.add('is-visible'));

const form=document.getElementById('inquiryForm');
if(form){
  const fields={
    type:document.getElementById('projectType'),
    location:document.getElementById('location'),
    size:document.getElementById('size'),
    budget:document.getElementById('budget'),
    needs:document.getElementById('needs')
  };
  const makeButton=document.getElementById('makeSummary');
  const copyButton=document.getElementById('copySummary');
  const status=document.getElementById('formStatus');
  const result=document.getElementById('inquiryResult');
  let currentSummary='';

  function invalidateSummary(){
    if(!currentSummary)return;
    currentSummary='';
    result.hidden=true;
    copyButton.disabled=true;
    status.textContent='Isian berubah. Buat ulang ringkasan sebelum menyalin.';
  }
  Object.values(fields).forEach(field=>{
    field.addEventListener('input',invalidateSummary);
    field.addEventListener('change',invalidateSummary);
  });

  makeButton.addEventListener('click',()=>{
    const required=[fields.type,fields.location,fields.size,fields.needs];
    const invalid=required.find(field=>!field.value.trim());
    if(invalid){
      status.textContent='Lengkapi jenis proyek, lokasi, ukuran dan kebutuhan utama.';
      invalid.focus();
      return;
    }
    currentSummary=[
      'NUSA FORMA STUDIO — RINGKASAN KEBUTUHAN (KONSEP)',
      'Jenis proyek: '+fields.type.value,
      'Lokasi: '+fields.location.value.trim(),
      'Ukuran perkiraan: '+fields.size.value.trim(),
      'Anggaran: '+(fields.budget.value||'Belum ditentukan'),
      'Kebutuhan utama: '+fields.needs.value.trim(),
      '',
      'Catatan: ringkasan simulasi lokal; bukan pengiriman inquiry.'
    ].join('\n');
    result.textContent=currentSummary;
    result.hidden=false;
    copyButton.disabled=false;
    status.textContent='Ringkasan siap. Tidak ada data yang dikirim atau disimpan.';
  });

  copyButton.addEventListener('click',async()=>{
    if(!currentSummary)return;
    try{
      if(!navigator.clipboard||!navigator.clipboard.writeText)throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(currentSummary);
      status.textContent='Ringkasan disalin ke clipboard.';
    }catch{
      result.hidden=false;
      result.focus();
      const range=document.createRange();
      range.selectNodeContents(result);
      const selection=window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent='Clipboard tidak tersedia. Ringkasan dipilih; gunakan Ctrl/Cmd+C.';
    }
  });
}
