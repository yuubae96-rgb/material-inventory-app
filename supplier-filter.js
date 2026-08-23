(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFKC').replace(/[\s　]+/g,'').toLowerCase();
const displayName=s=>String(s||'').normalize('NFKC').replace(/[\s　]+/g,' ').trim();
let suppliers=[],refreshing=false,refreshTimer=null;
function installLargeFileUploadFix(){
 if(window.__deliveryLargeUploadFixed)return;window.__deliveryLargeUploadFixed=true;
 const originalFetch=window.fetch.bind(window),target='https://vnnvuxccazkdzwqjmntz.supabase.co/functions/v1/delivery-note-ai',signer='https://vnnvuxccazkdzwqjmntz.supabase.co/functions/v1/delivery-upload-url';
 window.fetch=async function(input,init){
  const url=typeof input==='string'?input:(input?.url||'');
  if(url===target&&init?.method==='POST'&&typeof init.body==='string'){
   let body=null;try{body=JSON.parse(init.body)}catch{}
   if(body?.action==='store_source'&&body.base64){
    try{
     const metaRes=await originalFetch(signer,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file_name:body.file_name,mime_type:body.mime_type,size:Math.floor((body.base64.length*3)/4)})}),meta=await metaRes.json();
     if(!metaRes.ok)throw new Error(meta.error||`HTTP ${metaRes.status}`);
     const bin=atob(body.base64),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
     const blob=new Blob([bytes],{type:body.mime_type||'application/octet-stream'}),{error}=await supabaseClient.storage.from('delivery-notes').uploadToSignedUrl(meta.path,meta.token,blob,{contentType:body.mime_type||'application/octet-stream'});if(error)throw error;
     return new Response(JSON.stringify({ok:true,storage_path:meta.path}),{status:200,headers:{'Content-Type':'application/json'}});
    }catch(e){return new Response(JSON.stringify({error:'原本保存エラー: '+(e?.message||String(e))}),{status:500,headers:{'Content-Type':'application/json'}})}
   }
  }
  return originalFetch(input,init);
 };
}
function getReviewItems(){
 const results=document.getElementById('deliveryResults');if(!results)return [];
 return [...results.querySelectorAll('.delivery-result')].filter(x=>x.dataset.safe!=='1'||x.classList.contains('uncertain')||x.querySelector('.delivery-warnings'));
}
function jumpToFirstReview(){
 const first=getReviewItems()[0];if(!first)return false;
 first.scrollIntoView({behavior:'smooth',block:'center'});
 first.style.outline='4px solid #f59e0b';first.style.outlineOffset='4px';
 setTimeout(()=>{first.style.outline='';first.style.outlineOffset=''},1800);
 return true;
}
function fixReviewSummary(){
 const uncertain=getReviewItems();
 document.querySelectorAll('#deliveryReviewSummary').forEach(review=>{
  if(!uncertain.length){review.style.display='none';return}review.style.display='';
  const btn=review.querySelector('#jumpReview')||[...review.querySelectorAll('button')].find(b=>(b.textContent||'').includes('最初の要確認'));
  if(btn){btn.disabled=false;btn.style.pointerEvents='auto';btn.onclick=e=>{e.preventDefault();e.stopPropagation();jumpToFirstReview()}}
 });
}
function installReviewJumpDelegation(){
 if(window.__deliveryReviewJumpDelegated)return;window.__deliveryReviewJumpDelegated=true;
 document.addEventListener('click',e=>{
  const btn=e.target.closest?.('button');if(!btn)return;
  if((btn.textContent||'').includes('最初の要確認')){
   e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();jumpToFirstReview();
  }
 },true);
}
function watchReviewSummary(){
 const results=document.getElementById('deliveryResults');if(!results){setTimeout(watchReviewSummary,250);return}if(results.dataset.reviewObserver==='1')return;results.dataset.reviewObserver='1';
 let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(fixReviewSummary,50)}).observe(results,{childList:true,attributes:true,attributeFilter:['class'],subtree:true});
}
async function loadSuppliers(){
 try{const {data,error}=await supabaseClient.from('materials').select('supplier').eq('active',true);if(error)throw error;const groups=new Map();for(const row of data||[]){const raw=displayName(row.supplier);if(!raw)continue;const key=norm(raw);if(!groups.has(key))groups.set(key,{key,label:raw,count:0});const g=groups.get(key);g.count++;if(raw.length<g.label.length)g.label=raw}suppliers=[...groups.values()].sort((a,b)=>a.label.localeCompare(b.label,'ja'));renderChoices()}catch(e){console.error('supplier filter load',e)}
}
function renderChoices(){const filter=document.getElementById('mSupplierFilter');if(!filter)return;const current=filter.value;filter.innerHTML='<option value="">すべてのサプライヤー</option>'+suppliers.map(x=>`<option value="${esc(x.key)}">${esc(x.label)}</option>`).join('');if(suppliers.some(x=>x.key===current))filter.value=current;const dl=document.getElementById('mSupplierList');if(dl)dl.innerHTML=suppliers.map(x=>`<option value="${esc(x.label)}"></option>`).join('')}
function applyFilter(){const filter=document.getElementById('mSupplierFilter');if(!filter)return;const key=filter.value;document.querySelectorAll('#mList .material-list-item').forEach(row=>{if(!key){row.style.display='';return}const meta=norm(row.querySelector('.material-meta')?.innerText||'');row.style.display=meta.includes(key)?'':'none'})}
async function refreshInventory(){if(refreshing)return;refreshing=true;try{if(typeof loadAll==='function')await loadAll();await loadSuppliers();requestAnimationFrame(applyFilter)}catch(e){console.error('inventory live refresh',e)}finally{refreshing=false}}
function scheduleRefresh(){clearTimeout(refreshTimer);refreshTimer=setTimeout(refreshInventory,120)}
function watchDelivery(){const results=document.getElementById('deliveryResults');if(!results){setTimeout(watchDelivery,250);return}if(results.dataset.liveRefreshWatch)return;results.dataset.liveRefreshWatch='1';let doneCount=results.querySelectorAll('.delivery-result.delivery-done').length;new MutationObserver(()=>{const next=results.querySelectorAll('.delivery-result.delivery-done').length;if(next>doneCount)scheduleRefresh();doneCount=next}).observe(results,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})}
function loadNormalizer(){if(window.__deliveryNormalizerLoading)return;window.__deliveryNormalizerLoading=true;const s=document.createElement('script');s.src='./delivery-normalize.js?v=20260823-1';document.body.appendChild(s)}
function hook(){
 installLargeFileUploadFix();installReviewJumpDelegation();watchReviewSummary();loadNormalizer();
 const filter=document.getElementById('mSupplierFilter');if(!filter){setTimeout(hook,200);return}
 if(!filter.dataset.directSupplierFix){filter.dataset.directSupplierFix='1';filter.addEventListener('change',applyFilter)}
 loadSuppliers();watchDelivery();
 const list=document.getElementById('mList');if(list&&!list.dataset.supplierFilterLight){list.dataset.supplierFilterLight='1';let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(applyFilter,30)}).observe(list,{childList:true})}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook,{once:true});else hook();
})();