'use strict';
(function(){
  const AREA_CATEGORIES=['金属板','樹脂板・フィルム','シール・ラベル','ラミネート'];
  const q=s=>document.querySelector(s);
  const qa=s=>Array.from(document.querySelectorAll(s));

  function parseAreaPerUnit(text){
    text=String(text||'').replace(/,/g,'').replace(/X/g,'×').replace(/x/g,'×');
    // 板・シート: 1000×2000板 など（両方mm）
    let m=text.match(/(\d+(?:\.\d+)?)\s*(?:mm)?\s*×\s*(\d+(?:\.\d+)?)\s*(?:mm)?\s*(?:板|枚|シート)?/i);
    if(m && !/シール/.test(text)){
      const a=Number(m[1]),b=Number(m[2]);
      // 2辺とも通常の板寸法ならmm×mmとして㎡化
      if(a>=100 && b>=100) return a*b/1000000;
    }
    // ロール: 幅60mm×600m / 60×600（シール納品書形式）
    m=text.match(/(?:幅\s*)?(\d+(?:\.\d+)?)\s*(?:mm)?\s*×\s*(?:長さ\s*)?(\d+(?:\.\d+)?)\s*m(?:巻)?/i);
    if(m) return Number(m[1])/1000*Number(m[2]);
    return null;
  }

  function isAreaRow(row){
    const name=(row.querySelector('.material-name')?.textContent||'');
    const meta=(row.querySelector('.material-meta')?.textContent||'');
    return /^シール\s/.test(name)||/金属板|樹脂|フィルム|ラミネート/.test(meta)||/1000[×xX]2000|1000[×xX]1000|500[×xX]1000/.test(meta);
  }

  function normalizeRows(){
    qa('#mList .material-list-item').forEach(row=>{
      if(!isAreaRow(row)) return;
      const stock=row.querySelector('.material-stock');
      const price=row.querySelector('.material-price');
      const meta=row.querySelector('.material-meta');
      const name=(row.querySelector('.material-name')?.textContent||'');
      const metaText=meta?.textContent||'';
      const isLabel=/^シール\s/.test(name);
      const areaPerUnit=parseAreaPerUnit(metaText);

      if(stock){
        const sm=stock.textContent.replace(/,/g,'').match(/(-?\d+(?:\.\d+)?)/);
        if(sm){
          let n=Number(sm[1]);
          // 既存の金属板等は「枚」で保存済みなので面積へ換算。シールは既に㎡数量。
          if(!isLabel && /枚/.test(stock.textContent) && areaPerUnit) n*=areaPerUnit;
          stock.textContent=(Math.round(n*1000)/1000).toLocaleString('ja-JP')+' ㎡';
        }
      }
      if(price){
        // 納品書AI取込のシールは既に円/㎡。その他も今後は㎡基準で統一表示。
        price.textContent=price.textContent.replace(/\/\s*(枚|巻|単位不明|個|kg)(?=\s|$)/,'/ ㎡');
      }
      if(meta){
        let note=meta.querySelector('.area-standard-note');
        if(!note){note=document.createElement('div');note.className='area-standard-note';note.style.cssText='margin-top:4px;font-weight:800;color:#287a3d;opacity:1';meta.appendChild(note);}
        note.textContent='在庫・数量・単価基準：㎡（平方メートル）';
      }
    });
  }

  function forceAreaForm(){
    const cat=q('#mm_category');
    const unit=q('#mm_stock_unit');
    const basis=q('#mm_price_basis');
    if(!cat||!unit) return;
    const area=AREA_CATEGORIES.includes(cat.value);
    if(area){
      unit.innerHTML='<option value="㎡">㎡（平方メートル）</option>';
      unit.value='㎡';
      if(basis){basis.innerHTML='<option value="stock_unit">1㎡あたり</option>';basis.value='stock_unit';}
    }
  }

  function relabelMovement(){
    const mat=q('#mv_material');
    const qty=q('#mv_qty');
    if(!mat||!qty) return;
    const txt=mat.options[mat.selectedIndex]?.textContent||'';
    const label=qty.closest('.field')?.querySelector('label');
    if(label && /シール|ステンレス|アルミ|真鍮|PET|ポリカ|PVC|アクリル|ラミネート|ユポ|塩ビ/.test(txt)) label.textContent='数量 ㎡（平方メートル）';
  }

  function run(){normalizeRows();forceAreaForm();relabelMovement();}
  document.addEventListener('change',e=>{if(['mm_category','mm_material','mv_material'].includes(e.target?.id)) setTimeout(run,0);});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{run();setTimeout(run,400);setTimeout(run,1200)}); else {run();setTimeout(run,400);}
  new MutationObserver(()=>setTimeout(normalizeRows,0)).observe(document.documentElement,{childList:true,subtree:true});
})();
