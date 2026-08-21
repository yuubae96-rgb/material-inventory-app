'use strict';
(function(){
 let activeMaterials=[],editingId=null,attachTimer=null;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
 const today=()=>{const d=new Date(),z=d.getTimezoneOffset();return new Date(d.getTime()-z*60000).toISOString().slice(0,10)};
 try{if('scrollRestoration' in history)history.scrollRestoration='manual'}catch(e){}

 function ensureStyles(){
  if(document.getElementById('materialEditStyles'))return;
  const s=document.createElement('style');s.id='materialEditStyles';s.textContent=`
   .material-edit-btn{display:inline-flex!important;align-items:center;justify-content:center;margin-top:10px;border:2px solid #2563eb!important;background:#fff!important;color:#1d4ed8!important;border-radius:10px;padding:8px 17px;font-weight:900;font-size:14px;min-width:72px;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
   .material-edit-btn:active,.material-tab:active{transform:scale(.98)}
   .material-edit-box{margin-top:10px;padding:13px;border:2px solid #93c5fd;border-radius:12px;background:#f8fbff}.material-edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
   .material-edit-box label{display:block;font-size:11px;font-weight:800;margin-bottom:4px;color:#4b5563}.material-edit-box input,.material-edit-box textarea{width:100%;box-sizing:border-box;font-size:16px;padding:10px;border:1px solid #cbd5e1;border-radius:8px;background:#fff}
   .material-edit-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.material-edit-save{background:#168447;color:#fff;border:0;border-radius:9px;padding:10px 15px;font-weight:900}.material-edit-cancel{background:#fff;border:1px solid #cbd5e1;border-radius:9px;padding:10px 15px;font-weight:800}.material-edit-delete{background:#fff;color:#b42318;border:1px solid #efb4ae;border-radius:9px;padding:10px 15px;font-weight:800;margin-left:auto}
   @media(max-width:700px){.material-edit-grid{grid-template-columns:1fr}.material-edit-delete{margin-left:0}}
  `;document.head.appendChild(s);
 }
 async function fetchMaterials(){const {data,error}=await supabaseClient.from('materials').select('*').eq('active',true).order('name');if(error){console.error(error);return activeMaterials}activeMaterials=data||[];return activeMaterials}
 function filteredMaterials(){const q=(document.getElementById('mSearch')?.value||'').trim().toLowerCase();return q?activeMaterials.filter(m=>[m.name,m.category,m.spec,m.supplier,m.purchase_form,m.surface_finish,m.adhesive_type,m.laminate_type].join(' ').toLowerCase().includes(q)):activeMaterials}
 function scheduleAttach(){clearTimeout(attachTimer);attachTimer=setTimeout(attachButtons,16)}
 function attachButtons(){const rows=[...document.querySelectorAll('#mList .material-list-item')],shown=filteredMaterials();rows.forEach((row,i)=>{const m=shown[i];if(!m)return;let btn=row.querySelector('.material-edit-btn');if(!btn){btn=document.createElement('button');btn.type='button';btn.className='material-edit-btn';btn.textContent='編集';row.appendChild(btn)}btn.dataset.id=m.id})}
 function findMaterial(id){return activeMaterials.find(m=>String(m.id)===String(id))||null}
 async function latestPrice(id){const {data,error}=await supabaseClient.from('material_prices').select('*').eq('material_id',id).order('effective_from',{ascending:false}).order('id',{ascending:false}).limit(1);if(error){console.error(error);return null}return data?.[0]||null}
 function openEditor(row,id){
  document.querySelectorAll('.material-edit-box').forEach(x=>x.remove());editingId=id;const m=findMaterial(id);if(!m)return;
  const box=document.createElement('div');box.className='material-edit-box';box.innerHTML=`<div style="font-weight:900;font-size:17px;margin-bottom:10px">材料マスターを編集</div><div class="material-edit-grid"><div><label>材料名</label><input id="me_name" value="${esc(m.name)}"></div><div><label>規格</label><input id="me_spec" value="${esc(m.spec||'')}"></div><div><label>厚み mm</label><input id="me_thickness" type="number" step="any" value="${esc(m.thickness_mm??'')}"></div><div><label>購入サイズ・形態</label><input id="me_purchase" value="${esc(m.purchase_form||'')}"></div><div><label>仕入先</label><input id="me_supplier" value="${esc(m.supplier||'')}"></div><div><label>発注点</label><input id="me_reorder" type="number" step="any" value="${esc(m.reorder_point??0)}"></div><div><label>保管場所</label><input id="me_location" value="${esc(m.storage_location||'')}"></div><div><label>最新単価</label><input id="me_price" type="number" step="any" placeholder="読み込み中…"></div><div><label>単価適用日</label><input id="me_price_date" type="date" value="${today()}"></div></div><div style="margin-top:9px"><label>備考</label><textarea id="me_notes">${esc(m.notes||'')}</textarea></div><div class="material-edit-actions"><button type="button" class="material-edit-save">保存</button><button type="button" class="material-edit-cancel">キャンセル</button><button type="button" class="material-edit-delete">削除</button></div>`;
  row.appendChild(box);box.querySelector('.material-edit-save').onclick=saveEdit;box.querySelector('.material-edit-cancel').onclick=()=>{box.remove();editingId=null};box.querySelector('.material-edit-delete').onclick=deleteMaterial;box.scrollIntoView({behavior:'auto',block:'nearest'});
  latestPrice(id).then(p=>{if(editingId!==id||!box.isConnected)return;const pi=box.querySelector('#me_price'),di=box.querySelector('#me_price_date');if(pi){pi.value=p?.price??'';pi.placeholder=''}if(di)di.value=p?.effective_from||today()}).catch(console.error);
 }
 async function saveEdit(){
  const m=findMaterial(editingId);if(!m)return;const name=document.getElementById('me_name').value.trim();if(!name){alert('材料名を入力してください');return}
  const thick=document.getElementById('me_thickness').value,changes={name,spec:document.getElementById('me_spec').value.trim()||null,thickness_mm:thick===''?null:Number(thick),purchase_form:document.getElementById('me_purchase').value.trim()||null,supplier:document.getElementById('me_supplier').value.trim()||null,reorder_point:Number(document.getElementById('me_reorder').value)||0,storage_location:document.getElementById('me_location').value.trim()||null,notes:document.getElementById('me_notes').value.trim()||null};
  const btn=document.querySelector('.material-edit-save');if(btn){btn.disabled=true;btn.textContent='保存中…'}
  const {error}=await supabaseClient.from('materials').update(changes).eq('id',editingId);if(error){if(btn){btn.disabled=false;btn.textContent='保存'}alert('材料の修正に失敗しました');return}
  const price=Number(document.getElementById('me_price').value),date=document.getElementById('me_price_date').value||today();if(Number.isFinite(price)&&price>0){const old=await latestPrice(editingId);if(!old||Number(old.price)!==price||old.effective_from!==date){const {error:pe}=await supabaseClient.from('material_prices').insert({material_id:Number(editingId),effective_from:date,price,price_basis:old?.price_basis||'stock_unit',supplier:changes.supplier,notes:'材料マスター編集'});if(pe){alert('材料名などは修正しましたが、単価履歴の追加に失敗しました');location.reload();return}}}
  alert('材料を修正しました');location.reload();
 }
 async function deleteMaterial(){const m=findMaterial(editingId);if(!m)return;const {data,error}=await supabaseClient.from('inventory_movements').select('id').eq('material_id',editingId).limit(1);if(error){alert('履歴確認に失敗しました');return}if(data?.length){alert('この材料には入出庫履歴があります。削除せず「編集」で訂正してください。');return}if(!confirm('「'+m.name+'」を削除しますか？\n履歴のない誤登録だけ削除できます。'))return;const {error:de}=await supabaseClient.from('materials').update({active:false}).eq('id',editingId);if(de){alert('削除に失敗しました');return}alert('材料を削除しました');location.reload()}
 function showTab(btn){const tab=btn.dataset.tab,panel=document.getElementById('mp-'+tab);if(!tab||!panel)return;document.querySelectorAll('.material-tab').forEach(x=>x.classList.toggle('active',x===btn));document.querySelectorAll('.material-panel').forEach(x=>{const on=x===panel;x.classList.toggle('active',on);x.style.display=on?'block':'none'})}
 function hookTabs(){document.querySelectorAll('.material-tab').forEach(btn=>{if(btn.dataset.fastUi==='1')return;btn.dataset.fastUi='1';btn.style.touchAction='manipulation';btn.addEventListener('pointerdown',()=>showTab(btn),{passive:true});btn.addEventListener('click',()=>showTab(btn),true)})}
 function ensureSquareMeterUnit(){const select=document.getElementById('mm_stock_unit');if(select&&![...select.options].some(o=>o.value==='㎡'))select.add(new Option('㎡（平方メートル）','㎡'))}
 function loadStocktake(){if(document.getElementById('stocktakeModule'))return;const s=document.createElement('script');s.id='stocktakeModule';s.src='./stocktake.js?v=20260820-2118';document.body.appendChild(s)}
 function replaceListToDropLegacyObservers(){
  const old=document.getElementById('mList');if(!old||old.dataset.observerReset==='1')return old;
  const fresh=old.cloneNode(true);fresh.dataset.observerReset='1';old.replaceWith(fresh);return fresh;
 }
 async function init(){
  ensureStyles();hookTabs();ensureSquareMeterUnit();if(!location.hash)requestAnimationFrame(()=>window.scrollTo(0,0));
  // 過去の表示補正スクリプトがmListに付けた重いMutationObserverをここで完全に切り離す。
  const list=replaceListToDropLegacyObservers();
  await fetchMaterials();scheduleAttach();
  if(list){new MutationObserver(scheduleAttach).observe(list,{childList:true});list.addEventListener('click',e=>{const btn=e.target.closest?.('.material-edit-btn');if(!btn)return;e.preventDefault();e.stopPropagation();const row=btn.closest('.material-list-item');if(row)openEditor(row,btn.dataset.id)},true)}
  document.getElementById('mSearch')?.addEventListener('input',scheduleAttach,{passive:true});
  setTimeout(loadStocktake,700);setTimeout(hookTabs,900);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();