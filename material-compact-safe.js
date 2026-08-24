(()=>{
'use strict';
if(window.__materialCompactSafe)return;window.__materialCompactSafe=true;
const expanded=new Set();let scanTimer=null;
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
function getId(row){return String(row.dataset.materialId||row.querySelector('.material-edit-btn')?.dataset.id||row.querySelector('[data-material-id]')?.dataset.materialId||'')}
function getThickness(row){const s=(row.querySelector('.material-meta')?.textContent||'')+' '+(row.textContent||'');let m=s.match(/(?:^|[\s/])t\s*([0-9]+(?:\.[0-9]+)?)/i);if(!m)m=s.match(/厚み\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*mm/i);if(m)return m[1]+'mm';m=s.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:μm|um|μ)(?:級)?/i);return m?m[1]+'μm':'—'}
function cleanPrice(s){return String(s||'単価未登録').replace(/^最新単価\s*/,'').replace(/\s*\(\d{4}-\d{2}-\d{2}\)\s*$/,'').trim()}
function syncRow(row){const id=getId(row);if(!id)return;let summary=row.querySelector(':scope > .material-compact-summary');if(!summary){summary=document.createElement('button');summary.type='button';summary.className='material-compact-summary';summary.addEventListener('click',()=>{const k=getId(row);if(!k)return;expanded.has(k)?expanded.delete(k):expanded.add(k);syncRow(row)});row.insertBefore(summary,row.firstChild)}const name=(row.querySelector('.material-name')?.textContent||'名称なし').trim(),price=cleanPrice(row.querySelector('.material-price')?.textContent),open=expanded.has(id);summary.innerHTML=`<span class="mcs-name">${esc(name)}</span><span class="mcs-thick">${esc(getThickness(row))}</span><span class="mcs-price">${esc(price)}</span><span class="mcs-arrow">${open?'▲':'▼'}</span>`;row.classList.add('material-compact-safe');row.classList.toggle('material-compact-open',open)}
function scan(){clearTimeout(scanTimer);scanTimer=setTimeout(()=>{document.querySelectorAll('#mList .material-list-item').forEach(syncRow)},20)}
function start(){const st=document.createElement('style');st.textContent=`
.material-compact-safe{padding:0!important}
.material-compact-summary{display:grid;width:100%;grid-template-columns:minmax(0,1fr) 70px minmax(92px,auto) 20px;gap:8px;align-items:center;border:0;background:#fff;color:#17191c;text-align:left;padding:13px 4px;font:inherit}
.mcs-name{font-weight:900;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mcs-thick{font-size:14px;font-weight:900;color:#333;text-align:right;white-space:nowrap}.mcs-price{font-size:14px;font-weight:900;text-align:right;white-space:nowrap}.mcs-arrow{font-size:12px;color:#777;text-align:right}
.material-compact-safe:not(.material-compact-open)>:not(.material-compact-summary){display:none!important}
.material-compact-safe.material-compact-open>.material-compact-summary{background:#f6f7f8;border-bottom:1px solid rgba(0,0,0,.08)}
@media(max-width:700px){.material-compact-summary{grid-template-columns:minmax(0,1fr) 64px minmax(86px,auto) 18px;padding:12px 2px}.mcs-name{font-size:14px}.mcs-thick,.mcs-price{font-size:13px}}
`;document.head.appendChild(st);scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden)scan()});window.addEventListener('pageshow',scan);setInterval(scan,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();