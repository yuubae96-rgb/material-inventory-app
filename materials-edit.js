'use strict';
(function(){
  let editingId=null;
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const todayLocal=()=>{const d=new Date(),z=d.getTimezoneOffset();return new Date(d.getTime()-z*60000).toISOString().slice(0,10)};

  function ensureStyles(){
    if(document.getElementById('materialEditStyles'))return;
    const s=document.createElement('style');s.id='materialEditStyles';s.textContent=`
      .material-edit-btn{margin-top:9px;border:1px solid #cbd5e1;background:#fff;color:#1f2937;border-radius:9px;padding:6px 12px;font-weight:800;font-size:13px}
      .material-edit-box{margin-top:10px;padding:12px;border:1px solid #d8dee6;border-radius:12px;background:#f8fafc}
      .material-edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
      .material-edit-box label{display:block;font-size:11px;font-weight:800;margin-bottom:4px;color:#4b5563}
      .material-edit-box input,.material-edit-box textarea{width:100%;box-sizing:border-box;font-size:16px;padding:9px;border:1px solid #cbd5e1;border-radius:8px;background:#fff}
      .material-edit-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .material-edit-save{background:#168447;color:#fff;border:0;border-radius:9px;padding:9px 13px;font-weight:900}
      .material-edit-cancel{background:#fff;border:1px solid #cbd5e1;border-radius:9px;padding:9px 13px;font-weight:800}
      .material-edit-delete{background:#fff;color:#b42318;border:1px solid #efb4ae;border-radius:9px;padding:9px 13px;font-weight:800;margin-left:auto}
      @media(max-width:700px){.material-edit-grid{grid-template-columns:1fr}.material-edit-delete{margin-left:0}}
    `;document.head.appendChild(s);
  }
  function byId(id){return (window.materials||materials||[]).find(x=>String(x.id)===String(id));}
  function latest(id){return (window.prices||prices||[]).filter(p=>String(p.material_id)===String(id)).sort((a,b)=>(b.effective_from||'').localeCompare(a.effective_from||'')||Number(b.id)-Number(a.id))[0]||null;}
  function addButtons(){
    ensureStyles();
    const list=$('mList');if(!list)return;
    const mats=(typeof materials!=='undefined'?materials:[]);
    list.querySelectorAll('.material-list-item').forEach((row,i)=>{
      if(row.querySelector('.material-edit-btn'))return;
      const m=mats[i];if(!m)return;
      const btn=document.createElement('button');btn.type='button';btn.className='material-edit-btn';btn.textContent='編集';btn.dataset.id=m.id;
      btn.onclick=()=>openEditor(row,m.id);row.appendChild(btn);
    });
  }
  function openEditor(row,id){
    document.querySelectorAll('.material-edit-box').forEach(x=>x.remove());editingId=id;
    const m=byId(id);if(!m)return;const p=latest(id);
    const box=document.createElement('div');box.className='material-edit-box';
    box.innerHTML=`<div style="font-weight:900;margin-bottom:9px">材料マスターを編集</div><div class="material-edit-grid">
      <div><label>材料名</label><input id="me_name" value="${esc(m.name)}"></div>
      <div><label>規格</label><input id="me_spec" value="${esc(m.spec||'')}"></div>
      <div><label>厚み mm</label><input id="me_thickness" type="number" step="any" value="${esc(m.thickness_mm??'')}"></div>
      <div><label>購入サイズ・形態</label><input id="me_purchase" value="${esc(m.purchase_form||'')}"></div>
      <div><label>仕入先</label><input id="me_supplier" value="${esc(m.supplier||'')}"></div>
      <div><label>発注点</label><input id="me_reorder" type="number" step="any" value="${esc(m.reorder_point??0)}"></div>
      <div><label>保管場所</label><input id="me_location" value="${esc(m.storage_location||'')}"></div>
      <div><label>最新単価</label><input id="me_price" type="number" step="any" value="${esc(p?.price??'')}"></div>
      <div><label>単価適用日</label><input id="me_price_date" type="date" value="${esc(p?.effective_from||todayLocal())}"></div>
    </div><div style="margin-top:9px"><label>備考</label><textarea id="me_notes">${esc(m.notes||'')}</textarea></div>
    <div class="material-edit-actions"><button class="material-edit-save" type="button">保存</button><button class="material-edit-cancel" type="button">キャンセル</button><button class="material-edit-delete" type="button">削除</button></div>`;
    row.appendChild(box);box.querySelector('.material-edit-save').onclick=saveEdit;box.querySelector('.material-edit-cancel').onclick=()=>{box.remove();editingId=null};box.querySelector('.material-edit-delete').onclick=deleteMaterial;
  }
  async function saveEdit(){
    const m=byId(editingId);if(!m)return;const name=$('me_name').value.trim();if(!name){alert('材料名を入力してください');return;}
    const changes={name,spec:$('me_spec').value.trim()||null,thickness_mm:$('me_thickness').value===''?null:Number($('me_thickness').value),purchase_form:$('me_purchase').value.trim()||null,supplier:$('me_supplier').value.trim()||null,reorder_point:Number($('me_reorder').value)||0,storage_location:$('me_location').value.trim()||null,notes:$('me_notes').value.trim()||null};
    const {error}=await supabaseClient.from('materials').update(changes).eq('id',editingId);if(error){console.error(error);alert('材料の修正に失敗しました');return;}
    const price=Number($('me_price').value);if(Number.isFinite(price)&&price>0){const old=latest(editingId);if(!old||Number(old.price)!==price||old.effective_from!==$('me_price_date').value){const {error:pe}=await supabaseClient.from('material_prices').insert({material_id:Number(editingId),effective_from:$('me_price_date').value||todayLocal(),price,price_basis:old?.price_basis||'stock_unit',supplier:changes.supplier,notes:'材料マスター編集'});if(pe){console.error(pe);alert('材料情報は修正しましたが単価履歴の追加に失敗しました');await loadAll();return;}}}
    editingId=null;alert('材料を修正しました');await loadAll();
  }
  async function deleteMaterial(){
    const id=editingId,m=byId(id);if(!m)return;
    const moveRows=(typeof moves!=='undefined'?moves:[]).filter(x=>String(x.material_id)===String(id));
    if(moveRows.length){alert('この材料には入出庫履歴があるため削除できません。材料名などは「編集」で訂正してください。');return;}
    if(!confirm('「'+m.name+'」を削除しますか？\n入出庫履歴のない誤登録だけ削除できます。'))return;
    const {error}=await supabaseClient.from('materials').update({active:false}).eq('id',id);if(error){console.error(error);alert('削除に失敗しました');return;}
    editingId=null;alert('材料を削除しました');await loadAll();
  }
  function hook(){const list=$('mList');if(!list)return;addButtons();new MutationObserver(()=>setTimeout(addButtons,0)).observe(list,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();
})();
