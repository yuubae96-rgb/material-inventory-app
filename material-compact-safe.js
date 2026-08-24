(()=>{
'use strict';
if(window.__materialCompactSafe)return;window.__materialCompactSafe=true;
const expanded=new Set();
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function getId(row){return String(row.dataset.materialId||row.querySelector('.material-edit-btn')?.dataset.id||row.querySelector('[data-material-id]')?.dataset.materialId||'')}
function getThickness(row){const s=(row.querySelector('.material-meta')?.textContent||'')+' '+(row.textContent||'');let m=s.match(/(?:^|[\s/])t\s*([0-9]+(?:\.[0-9]+)?)/i);if(!m)m=s.match(/厚み\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*mm/i);return m?m[1]+'mm':'—'}
function build(row){if(row.querySelector(':scope > .material-compact-summary'))return;const id=getId(row);if(!id)return;const name=(row.querySelector('.material-name')?.textContent||'名称なし').trim();const price=(row.querySelector('.material-price')?.textContent||'単価未登録').trim();const summary=document.createElement('button');summary.type='button';summary.className='material-compact-summary';summary.innerHTML=`<span class="mcs-name">${esc(name)}</span><span class="mcs-thick">${esc(getThickness(row))}</span><span class="mcs-price">${esc(price.replace(/^最新単価\s*/,''))}</span><span class="mcs-arrow">▼</span>`;summary.addEventListener('click',()=>{const open=!expanded.has(id);if(open)expanded.add(id);else expanded.delete(id);row.classList.toggle('material-compact-open',open);summary.querySelector('.mcs-arrow').textContent=open?'▲':'▼'});row.insertBefore(summary,row.firstChild);row.classList.add('material-compact-safe')}
function scan(){document.querySelectorAll('#mList .material-list-item').forEach(build)}
function start(){const st=document.createElement('style');st.textContent=`
.material-compact-safe{padding:0!important}
.material-compact-summary{display:grid;width:100%;grid-template-columns:minmax(0,1fr) 64px minmax(105px,auto) 20px;gap:7px;align-items:center;border:0;background:#fff;color:#17191c;text-align:left;padding:13px 4px;font:inherit}
.mcs-name{font-weight:900;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mcs-thick{font-size:13px;font-weight:800;color:#5b626a;text-align:right}.mcs-price{font-size:14px;font-weight:900;text-align:right;white-space:nowrap}.mcs-arrow{font-size:12px;color:#777;text-align:right}
.material-compact-safe:not(.material-compact-open)>:not(.material-compact-summary){display:none!important}
.material-compact-safe.material-compact-open>.material-compact-summary{background:#f6f7f8;border-bottom:1px solid rgba(0,0,0,.08)}
@media(max-width:700px){.material-compact-summary{grid-template-columns:minmax(0,1fr) 55px minmax(92px,auto) 18px;padding:12px 2px}.mcs-name{font-size:14px}.mcs-price{font-size:13px}}
`;document.head.appendChild(st);scan();const root=document.getElementById('mList');if(root)new MutationObserver(()=>requestAnimationFrame(scan)).observe(root,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();