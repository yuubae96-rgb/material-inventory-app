(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFKC').replace(/[\s　]+/g,'').toLowerCase();
const displayName=s=>String(s||'').normalize('NFKC').replace(/[\s　]+/g,' ').trim();
let suppliers=[],refreshing=false,refreshTimer=null;

function installLargeFileUploadFix(){
  if(window.__deliveryLargeUploadFixed)return;
  window.__deliveryLargeUploadFixed=true;
  const originalFetch=window.fetch.bind(window);
  const target='https://vnnvuxccazkdzwqjmntz.supabase.co/functions/v1/delivery-note-ai';
  const signer='https://vnnvuxccazkdzwqjmntz.supabase.co/functions/v1/delivery-upload-url';
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    if(url===target&&init?.method==='POST'&&typeof init.body==='string'){
      let body=null;try{body=JSON.parse(init.body)}catch{}
      if(body?.action==='store_source'&&body.base64){
        try{
          const metaRes=await originalFetch(signer,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file_name:body.file_name,mime_type:body.mime_type,size:Math.floor((body.base64.length*3)/4)})});
          const meta=await metaRes.json();
          if(!metaRes.ok)throw new Error(meta.error||`HTTP ${metaRes.status}`);
          const bin=atob(body.base64),bytes=new Uint8Array(bin.length);
          for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
          const blob=new Blob([bytes],{type:body.mime_type||'application/octet-stream'});
          const {error}=await supabaseClient.storage.from('delivery-notes').uploadToSignedUrl(meta.path,meta.token,blob,{contentType:body.mime_type||'application/octet-stream'});
          if(error)throw error;
          return new Response(JSON.stringify({ok:true,storage_path:meta.path}),{status:200,headers:{'Content-Type':'application/json'}});
        }catch(e){
          return new Response(JSON.stringify({error:'原本保存エラー: '+(e?.message||String(e))}),{status:500,headers:{'Content-Type':'application/json'}});
        }
      }
    }
    return originalFetch(input,init);
  };
}

function fixReviewSummary(){
  const results=document.getElementById('deliveryResults');
  const uncertain=results?[...results.querySelectorAll('.delivery-result')].filter(x=>x.dataset.safe==='0'||x.classList.contains('uncertain')):[];
  const nodes=[...document.querySelectorAll('div,section')].filter(el=>{
    const t=(el.firstChild?.textContent||el.textContent||'').trim();
    return t.includes('要確認の明細')&&el.querySelector('button');
  });
  nodes.forEach(box=>{
    const btn=[...box.querySelectorAll('button')].find(b=>(b.textContent||'').includes('最初の要確認'));
    if(!uncertain.length){box.style.display='none';return}
    box.style.display='';
    if(btn){btn.disabled=false;btn.style.pointerEvents='auto';btn.onclick=e=>{e.preventDefault();e.stopPropagation();const first=uncertain[0];first.scrollIntoView({behavior:'smooth',block:'center'});first.style.outline='3px solid #f59e0b';setTimeout(()=>first.style.outline='',1800)}}
  });
}

function watchReviewSummary(){
  const root=document.getElementById('materialApp')||document.body;
  let t;
  const run=()=>{clearTimeout(t);t=setTimeout(fixReviewSummary,30)};
  run();
  new MutationObserver(run).observe(root,{childList:true,subtree:true,characterData:true});
  const hookFile=()=>{const f=document.getElementById('deliveryFiles');if(!f){setTimeout(hookFile,150);return}if(f.dataset.reviewReset)return;f.dataset.reviewReset='1';f.addEventListener('change',()=>setTimeout(fixReviewSummary,0),true)};
  hookFile();
}

async function loadSuppliers(){
  try{
    const {data,error}=await supabaseClient.from('materials').select('supplier').eq('active',true);
    if(error)throw error;
    const groups=new Map();
    for(const row of data||[]){
      const raw=displayName(row.supplier);if(!raw)continue;
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
  const filter=document.getElementById('mSupplierFilter');if(!filter)return;
  const current=filter.value;
  filter.innerHTML='<option value="">すべてのサプライヤー</option>'+suppliers.map(x=>`<option value="${esc(x.key)}">${esc(x.label)}</option>`).join('');
  if(suppliers.some(x=>x.key===current))filter.value=current;
  const dl=document.getElementById('mSupplierList');if(dl)dl.innerHTML=suppliers.map(x=>`<option value="${esc(x.label)}"></option>`).join('');
}
function applyFilter(){
  const filter=document.getElementById('mSupplierFilter');if(!filter)return;
  const key=filter.value;
  document.querySelectorAll('#mList .material-list-item').forEach(row=>{
    if(!key){row.style.display='';return}
    const meta=norm(row.querySelector('.material-meta')?.innerText||'');
    row.style.display=meta.includes(key)?'':'none';
  });
}
async function refreshInventory(){
  if(refreshing)return;refreshing=true;
  try{
    if(typeof loadAll==='function')await loadAll();
    await loadSuppliers();
    setTimeout(applyFilter,50);
  }catch(e){console.error('inventory live refresh',e)}finally{refreshing=false}
}
function scheduleRefresh(){clearTimeout(refreshTimer);refreshTimer=setTimeout(refreshInventory,120)}
function watchDelivery(){
  const results=document.getElementById('deliveryResults');
  if(!results){setTimeout(watchDelivery,200);return}
  if(results.dataset.liveRefreshWatch)return;
  results.dataset.liveRefreshWatch='1';
  let doneCount=results.querySelectorAll('.delivery-result.delivery-done').length;
  new MutationObserver(()=>{
    const next=results.querySelectorAll('.delivery-result.delivery-done').length;
    if(next>doneCount)scheduleRefresh();
    doneCount=next;
  }).observe(results,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
}
function hook(){
  installLargeFileUploadFix();watchReviewSummary();
  const filter=document.getElementById('mSupplierFilter');
  if(!filter){setTimeout(hook,150);return}
  if(!filter.dataset.directSupplierFix){filter.dataset.directSupplierFix='1';filter.addEventListener('change',applyFilter)}
  loadSuppliers();watchDelivery();
  const list=document.getElementById('mList');
  if(list&&!list.dataset.supplierFixObserver){
    list.dataset.supplierFixObserver='1';let t;
    new MutationObserver(()=>{clearTimeout(t);t=setTimeout(()=>{loadSuppliers();applyFilter()},120)}).observe(list,{childList:true,subtree:true});
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();
})();