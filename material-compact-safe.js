(()=>{
'use strict';
if(window.__materialCompactPreferred)return;window.__materialCompactPreferred=true;

// Keep expanded rows by a stable key instead of by DOM node.
// The material list is sometimes re-rendered by other scripts, which replaces
// the row element. A WeakSet loses the open state in that case and made the
// detail flash open and immediately close.
const expandedKeys=new Set();
let observerPaused=false;
let scanQueued=false;

const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function getThickness(row){const s=(row.querySelector('.material-meta')?.textContent||'')+' '+(row.textContent||'');let m=s.match(/(?:^|[\s/])t\s*([0-9]+(?:\.[0-9]+)?)/i);if(!m)m=s.match(/厚み\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*mm/i);if(m)return m[1]+'mm';m=s.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:μm|um|μ)(?:級)?/i);return m?m[1]+'μm':'—'}
function cleanPrice(s){return String(s||'単価未登録').replace(/^最新単価\s*/,'').replace(/\s*\(\d{4}-\d{2}-\d{2}\)\s*$/,'').trim()}
function rowKey(row){
  const explicit=row.dataset.materialId||row.dataset.id||row.getAttribute('data-material-id')||row.id;
  if(explicit)return 'id:'+explicit;
  const name=(row.querySelector('.material-name')?.textContent||'名称なし').trim();
  const meta=(row.querySelector('.material-meta')?.textContent||'').trim();
  return 'text:'+name+'|'+meta;
}
function setSummaryHtml(summary,name,thickness,price,open){
  const next=`<span class="mcs-name">${esc(name)}</span><span class="mcs-thick">${esc(thickness)}</span><span class="mcs-price">${esc(price)}</span><span class="mcs-arrow">${open?'▲':'▼'}</span>`;
  if(summary.innerHTML!==next)summary.innerHTML=next;
}
function syncRow(row){
  if(!row||!row.isConnected)return;
  const key=rowKey(row);
  let summary=row.querySelector(':scope > .material-compact-summary');
  if(!summary){
    summary=document.createElement('button');
    summary.type='button';
    summary.className='material-compact-summary';
    summary.setAttribute('aria-expanded','false');
    summary.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();
      const currentKey=rowKey(row);
      if(expandedKeys.has(currentKey))expandedKeys.delete(currentKey);else expandedKeys.add(currentKey);
      syncRow(row);
    });
    row.insertBefore(summary,row.firstChild);
  }
  const name=(row.querySelector('.material-name')?.textContent||'名称なし').trim();
  const price=cleanPrice(row.querySelector('.material-price')?.textContent);
  const open=expandedKeys.has(key);
  setSummaryHtml(summary,name,getThickness(row),price,open);
  summary.setAttribute('aria-expanded',open?'true':'false');
  row.classList.add('material-compact-preferred');
  row.classList.toggle('material-compact-open',open);
}
function scan(){
  scanQueued=false;
  if(observerPaused)return;
  observerPaused=true;
  try{document.querySelectorAll('#mList .material-list-item').forEach(syncRow)}finally{
    queueMicrotask(()=>{observerPaused=false});
  }
}
function queueScan(){
  if(observerPaused||scanQueued)return;
  scanQueued=true;
  requestAnimationFrame(scan);
}
function ensureKyushuKodoM2(){
  if(window.__kyushuKodoM2LoaderStarted||window.kyushuKodoM2)return;
  window.__kyushuKodoM2LoaderStarted=true;
  const s=document.createElement('script');
  s.src='./kyushu-kodo-m2.js?v=20260825-0821';
  s.async=false;
  s.onerror=()=>{window.__kyushuKodoM2LoaderStarted=false;console.error('kyushu-kodo-m2.js load failed')};
  document.body.appendChild(s);
}
function install(){
  if(!document.getElementById('materialCompactPreferredStyle')){
    const st=document.createElement('style');st.id='materialCompactPreferredStyle';
    st.textContent=`.material-compact-preferred{padding:0!important}.material-compact-summary{display:grid!important;width:100%!important;grid-template-columns:minmax(0,1fr) 64px minmax(86px,auto) 18px!important;gap:8px!important;align-items:center!important;border:0!important;background:#fff!important;color:#17191c!important;text-align:left!important;padding:12px 2px!important;font:inherit!important}.mcs-name{font-weight:900!important;font-size:14px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}.mcs-thick{font-size:13px!important;font-weight:900!important;color:#333!important;text-align:right!important;white-space:nowrap!important}.mcs-price{font-size:13px!important;font-weight:900!important;text-align:right!important;white-space:nowrap!important}.mcs-arrow{font-size:12px!important;color:#777!important;text-align:right!important}.material-compact-preferred:not(.material-compact-open)>:not(.material-compact-summary){display:none!important}.material-compact-preferred.material-compact-open>.material-compact-summary{background:#f6f7f8!important;border-bottom:1px solid rgba(0,0,0,.08)!important}`;
    document.head.appendChild(st);
  }
  ensureKyushuKodoM2();scan();
  const list=document.getElementById('mList');
  if(list&&!list.dataset.compactPreferredWatch){
    list.dataset.compactPreferredWatch='1';
    new MutationObserver(mutations=>{
      if(observerPaused)return;
      // Ignore mutations caused only inside our own compact summary. They do
      // not require a full list scan and previously created a re-render loop.
      const needsScan=mutations.some(m=>{
        const el=m.target.nodeType===1?m.target:m.target.parentElement;
        return !el?.closest?.('.material-compact-summary');
      });
      if(needsScan)queueScan();
    }).observe(list,{childList:true,subtree:true});
  }
  const original=window.renderList||((typeof renderList==='function')?renderList:null);
  if(original&&!window.__compactWrappedRender){
    window.__compactWrappedRender=true;
    const wrapped=function(){const r=original.apply(this,arguments);queueScan();return r};
    try{window.renderList=wrapped;renderList=wrapped}catch(e){window.renderList=wrapped}
  }
  document.getElementById('mSearch')?.addEventListener('input',queueScan);
  window.addEventListener('pageshow',()=>{ensureKyushuKodoM2();queueScan()});
  document.addEventListener('material-native-rendered',queueScan);
  document.addEventListener('lintec-m2-normalized',queueScan);
  document.addEventListener('kyushu-kodo-m2-normalized',queueScan);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();