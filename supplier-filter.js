(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let suppliers=[];
async function loadSuppliers(){
  try{
    const {data,error}=await supabaseClient.from('materials').select('supplier').eq('active',true);
    if(error)throw error;
    suppliers=[...new Set((data||[]).map(x=>(x.supplier||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ja'));
    renderChoices();
  }catch(e){console.error('supplier filter load',e)}
}
function renderChoices(){
  const filter=document.getElementById('mSupplierFilter');
  if(!filter)return;
  const current=filter.value;
  filter.innerHTML='<option value="">すべてのサプライヤー</option>'+suppliers.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
  if(suppliers.includes(current))filter.value=current;
  const dl=document.getElementById('mSupplierList');
  if(dl)dl.innerHTML=suppliers.map(n=>`<option value="${esc(n)}"></option>`).join('');
}
function applyFilter(){
  const filter=document.getElementById('mSupplierFilter');
  if(!filter)return;
  const supplier=filter.value;
  document.querySelectorAll('#mList .material-list-item').forEach(row=>{
    if(!supplier){row.style.display='';return}
    const meta=row.querySelector('.material-meta')?.innerText||'';
    row.style.display=meta.includes('仕入先 '+supplier)?'':'none';
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
    new MutationObserver(()=>{clearTimeout(t);t=setTimeout(()=>{renderChoices();applyFilter()},100)}).observe(list,{childList:true,subtree:true});
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();
})();