(()=>{
'use strict';
if(window.__materialCompactSafe)return;window.__materialCompactSafe=true;
const openIds=new Set();
function thicknessOf(m){if(m?.thickness_mm!==null&&m?.thickness_mm!==undefined&&m?.thickness_mm!=='')return `${m.thickness_mm}mm`;const s=`${m?.name||''} ${m?.spec||''} ${m?.purchase_form||''}`;const x=s.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:μm|um|μ)/i);return x?`${x[1]}μm`:'—'}
function priceText(p,m){if(!p)return '単価未登録';const unit=p.price_basis==='kg'?'kg':(m.stock_unit||'');return `${fmt(p.price)}円 / ${unit}`}
function nativeRenderList(){
  if(typeof materials==='undefined'||typeof latestPriceFor!=='function'||typeof stockFor!=='function'||!document.getElementById('mList'))return;
  const q=(document.getElementById('mSearch')?.value||'').trim().toLowerCase();
  const list=materials.filter(m=>[m.name,m.category,m.spec,m.supplier,m.purchase_form,m.surface_finish,m.adhesive_type,m.laminate_type].join(' ').toLowerCase().includes(q));
  document.getElementById('mList').innerHTML=list.length?list.map(m=>{
    const id=String(m.id),s=stockFor(m.id),p=latestPriceFor(m.id),alert=Number(m.reorder_point)>0&&s<=Number(m.reorder_point),opened=openIds.has(id);
    const spec=[m.category,m.spec,m.thickness_mm?`t${m.thickness_mm}`:'',m.color,m.surface_finish,m.adhesive_type&&m.adhesive_type!=='なし'?m.adhesive_type:'',m.laminate_type&&m.laminate_type!=='なし'?m.laminate_type:'',m.purchase_form].filter(Boolean).join(' / ');
    return `<div class="material-list-item material-native-row${opened?' material-native-open':''}" data-material-id="${esc(m.id)}">
      <button type="button" class="material-native-summary" data-native-id="${esc(m.id)}">
        <span class="mnl-name">${esc(m.name)}</span><span class="mnl-thick">${esc(thicknessOf(m))}</span><span class="mnl-price">${esc(priceText(p,m))}</span><span class="mnl-arrow">${opened?'▲':'▼'}</span>
      </button>
      <div class="material-native-detail">
        <div class="material-top"><div><div class="material-name">${esc(m.name)} ${alert?'<span class="mini-badge alert">発注</span>':''}</div><div class="material-meta">${esc(spec)}${m.supplier?'<br>仕入先 '+esc(m.supplier):''}${m.reorder_point?'<br>発注点 '+esc(m.reorder_point)+' '+esc(m.stock_unit):''}</div>${p?`<div class="material-price">最新単価 ${fmt(p.price)}円 / ${p.price_basis==='kg'?'kg':esc(m.stock_unit)} <span class="material-note">(${esc(p.effective_from)})</span></div>`:'<div class="material-note">単価未登録</div>'}</div><div class="material-stock ${alert?'material-alert':''}">${fmt(s)} ${esc(m.stock_unit)}</div></div>
      </div>
    </div>`;
  }).join(''):'<div class="empty-state">まだ材料がありません</div>';
  document.querySelectorAll('#mList .material-native-summary').forEach(b=>{b.addEventListener('click',()=>{const id=String(b.dataset.nativeId);openIds.has(id)?openIds.delete(id):openIds.add(id);nativeRenderList();document.dispatchEvent(new Event('material-native-rendered'))})});
  document.dispatchEvent(new Event('material-native-rendered'));
}
function install(){
  const st=document.createElement('style');st.id='materialNativeListStyle';st.textContent=`.material-native-row{padding:0!important}.material-native-summary{display:grid!important;width:100%;grid-template-columns:minmax(0,1fr) 70px minmax(92px,auto) 20px;gap:8px;align-items:center;border:0;background:#fff;color:#17191c;text-align:left;padding:13px 4px;font:inherit}.mnl-name{font-weight:900;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mnl-thick{font-size:14px;font-weight:900;text-align:right;white-space:nowrap}.mnl-price{font-size:14px;font-weight:900;text-align:right;white-space:nowrap}.mnl-arrow{font-size:12px;color:#777;text-align:right}.material-native-detail{display:none}.material-native-open>.material-native-detail{display:block;padding:8px 4px 14px}.material-native-open>.material-native-summary{background:#f6f7f8;border-bottom:1px solid rgba(0,0,0,.08)}@media(max-width:700px){.material-native-summary{grid-template-columns:minmax(0,1fr) 64px minmax(86px,auto) 18px;padding:12px 2px}.mnl-name{font-size:14px}.mnl-thick,.mnl-price{font-size:13px}}`;document.head.appendChild(st);
  try{window.renderList=nativeRenderList;renderList=nativeRenderList}catch(e){window.renderList=nativeRenderList}
  nativeRenderList();
  const input=document.getElementById('mSearch');if(input&&!input.dataset.nativeListHook){input.dataset.nativeListHook='1';input.addEventListener('input',nativeRenderList)}
  document.addEventListener('material-data-updated',nativeRenderList);
  window.addEventListener('pageshow',nativeRenderList);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();