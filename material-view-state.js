(()=>{
'use strict';
if(window.__materialViewStateInstalled)return;window.__materialViewStateInstalled=true;
const KEY='materialInventoryViewStateV1';
function read(){try{return JSON.parse(sessionStorage.getItem(KEY)||'{}')}catch{return{}}}
function capture(){const search=document.getElementById('mSearch'),supplier=document.getElementById('mSupplierFilter');const state={search:search?.value||'',supplier:supplier?.value||'',supplierText:supplier?.selectedOptions?.[0]?.textContent||'',scrollY:window.scrollY||0,ts:Date.now()};try{sessionStorage.setItem(KEY,JSON.stringify(state))}catch{}}
function restoreSearch(state){const el=document.getElementById('mSearch');if(!el)return false;if(state.search!=null&&el.value!==state.search){el.value=state.search;el.dispatchEvent(new Event('input',{bubbles:true}))}return true}
function restoreSupplier(state){const el=document.getElementById('mSupplierFilter');if(!el)return false;if(!state.supplier&&!state.supplierText)return true;let opt=[...el.options].find(o=>o.value===state.supplier);if(!opt&&state.supplierText)opt=[...el.options].find(o=>(o.textContent||'').trim()===String(state.supplierText).trim());if(!opt)return false;if(el.value!==opt.value){el.value=opt.value;el.dispatchEvent(new Event('change',{bubbles:true}))}return true}
function restore(){const state=read();if(!state.ts||Date.now()-state.ts>30*60*1000)return;restoreSearch(state);let tries=0;const retry=()=>{tries++;const ok=restoreSupplier(state);if(!ok&&tries<40){setTimeout(retry,150);return}setTimeout(()=>window.scrollTo(0,Number(state.scrollY)||0),80)};retry()}
window.addEventListener('beforeunload',capture);
document.addEventListener('change',e=>{if(e.target?.id==='mSupplierFilter')capture()},true);
document.addEventListener('input',e=>{if(e.target?.id==='mSearch')capture()},true);
document.addEventListener('click',e=>{if(e.target.closest?.('.material-edit-save'))capture()},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(restore,100),{once:true});else setTimeout(restore,100);
})();