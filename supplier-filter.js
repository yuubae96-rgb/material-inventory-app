(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFKC').replace(/[\s　]+/g,'').toLowerCase();
const displayName=s=>String(s||'').normalize('NFKC').replace(/[\s　]+/g,' ').trim();
let suppliers=[];
async function loadSuppliers(){
  try{
    const {data,error}=await supabaseClient.from('materials').select('supplier').eq('active',true);
    if(error)throw error;
    const groups=new Map();
    for(const row of data||[]){
      const raw=displayName(row.supplier);
      if(!raw)continue;
      const key=norm(raw);
      if(!groups.has(key))groups.set(key,{key,label:raw,count:0});
      const g=groups.get(key);g.count++;
      if(raw.length<g.label.length)g.label=raw;
    }
    suppliers=[...groups.values()].sort((a,b)=>a.label.localeCompare(b.label,'ja'));
    renderChoices();
  }catch(e){console.error('supplier filter load',e)}
}
function renderChoices(){
  const filter=document.getElementById('mSupplierFilter');
  if(!filter)return;
  const current=filter.value;
  filter.innerHTML='<option value="">すべてのサプライヤー</option>'+suppliers.map(x=>`<option value="${esc(x.key)}">${esc(x.label)}</option>`).join('');
  if(suppliers.some(x=>x.key===current))filter.value=current;
  const dl=document.getElementById('mSupplierList');
  if(dl)dl.innerHTML=suppliers.map(x=>`<option value="${esc(x.label)}"></option>`).join('');
}
function applyFilter(){
  const filter=document.getElementById('mSupplierFilter');
  if(!filter)return;
  const key=filter.value;
  document.querySelectorAll('#mList .material-list-item').forEach(row=>{
    if(!key){row.style.display='';return}
    const meta=norm(row.querySelector('.material-meta')?.innerText||'');
    row.style.display=meta.includes(key)?'':'none';
  });
}
function hook(){
  const filter=document.getElementById('mSupplierFilter');
  if(!filter){setTimeout(hook,150);return}
  if(!filter.dataset.directSupplierFix){
    filter.dataset.directSupplierFix='1';
    filter.addEventListener('change',applyFilter);
  }
  loadSuppliers();
  const list=document.getElementById('mList');
  if(list&&!list.dataset.supplierFixObserver){
    list.dataset.supplierFixObserver='1';
    let t;
    new MutationObserver(()=>{clearTimeout(t);t=setTimeout(()=>{loadSuppliers();applyFilter()},120)}).observe(list,{childList:true,subtree:true});
  }
}
window.addEventListener('materials-changed',()=>{loadSuppliers();setTimeout(applyFilter,80)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();
})();