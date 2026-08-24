(()=>{
'use strict';
const n=s=>String(s||'').normalize('NFKC').toUpperCase();
const ARCHIVE_FN='https://vnnvuxccazkdzwqjmntz.supabase.co/functions/v1/delivery-note-archive';
const sourceByMaterial=new Map();
let sourceLoaded=false,sourceLoading=false,sourceTimer=null;
function explain(text){const t=n(text),parts=[];
  if(/FNS/.test(t)){
    if(/ケシ/.test(t)) parts.push('蒸着PET（銀ケシ）');
    else if(/ツヤ/.test(t)) parts.push('蒸着PET（銀ツヤ）');
    else parts.push('FNS系ポリエステルフィルム');
  } else if(/PETWH/.test(t)) parts.push('白色PETフィルム');
  else if(/PET\s*\d+/.test(t)) parts.push('PETフィルム');
  else if(/PVC/.test(t)) parts.push('PVCフィルム');
  const th=t.match(/(?:FNS[^\s]*N?|PETWH|PET|PVC)[^\d]*(25|38|50|75|80|100|125|150|200|250)(?:\D|$)/);
  if(th) parts.push(`${th[1]}μm級`);
  if(/PAT1E/.test(t)) parts.push('汎用強粘着（エマルション）');
  else if(/PAT1/.test(t)) parts.push('汎用強粘着');
  if(/8LK/.test(t)) parts.push('青色ポリラミグラシン剥離紙');
  else if(/7LK/.test(t)) parts.push('白色ポリラミグラシン剥離紙');
  else if(/8K(?:\D|$)/.test(t)) parts.push('青色グラシン剥離紙');
  if(/背割/.test(text)) parts.push('背割あり');
  return [...new Set(parts)];
}
function isLintec(row){return /仕入先\s*リンテック/.test(String(row?.innerText||''));}
function rollSize(text){const t=String(text||'').normalize('NFKC');let m=t.match(/(?:^|[\s/])([1-9]\d{1,3}(?:\.\d+)?)\s*[×xX＊*]\s*([1-9]\d{0,3}(?:\.\d+)?)(?=$|[\s/])/);if(!m)m=t.match(/(?:^|[\s/])([1-9]\d{1,3}(?:\.\d+)?)\s+([1-9]\d{0,3}(?:\.\d+)?)(?=$|[\s/])/);if(!m)return null;const widthMm=Number(m[1]),lengthM=Number(m[2]);if(!(widthMm>=50&&widthMm<=3000&&lengthM>=1&&lengthM<=1000))return null;return{widthMm,lengthM,area:(widthMm/1000)*lengthM};}
function convertPrice(row){const price=row.querySelector('.material-price');if(!price)return;const original=price.dataset.lintecRollPrice||price.textContent||'';if(!price.dataset.lintecRollPrice)price.dataset.lintecRollPrice=original;const pm=original.replace(/,/g,'').match(/最新単価\s*([0-9]+(?:\.[0-9]+)?)円\s*\/\s*(?:R|ロール|巻)/i);if(!pm)return;const size=rollSize(row.querySelector('.material-meta')?.textContent||'');if(!size||!size.area)return;const rollPrice=Number(pm[1]),m2Price=rollPrice/size.area,date=(original.match(/\([^)]*\)/)||[''])[0];const shown=Number.isInteger(Math.round(m2Price*100)/100)?Math.round(m2Price).toLocaleString('ja-JP'):(Math.round(m2Price*100)/100).toLocaleString('ja-JP',{maximumFractionDigits:2});price.textContent=`最新単価 ${shown}円 / ㎡ ${date}`.trim();price.title=`1R ${rollPrice.toLocaleString('ja-JP')}円 ÷ ${size.area.toLocaleString('ja-JP',{maximumFractionDigits:3})}㎡（幅${size.widthMm}mm × 長さ${size.lengthM}m）`;}
async function loadSourceMap(){if(sourceLoading)return;sourceLoading=true;try{if(!window.supabaseClient)return;const {data,error}=await window.supabaseClient.from('material_prices').select('id,material_id,effective_from,source_file_path,source_file_name,source_page,source_item_index').not('source_file_path','is',null).order('effective_from',{ascending:false}).order('id',{ascending:false});if(error)throw error;sourceByMaterial.clear();for(const x of data||[]){const k=String(x.material_id);if(!sourceByMaterial.has(k))sourceByMaterial.set(k,x)}sourceLoaded=true}catch(e){console.warn('Lintec original source load failed',e)}finally{sourceLoading=false}}
async function openOriginal(path,button){if(!path)return;const old=button.textContent;button.disabled=true;button.textContent='開いています…';try{const r=await fetch(ARCHIVE_FN,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'url',path})}),j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||`HTTP ${r.status}`);window.open(j.url,'_blank','noopener')}catch(e){alert('原本を開けませんでした：'+(e?.message||String(e)))}finally{button.disabled=false;button.textContent=old}}
function addOriginalButton(row){if(!isLintec(row))return;const warning=row.querySelector('.lintec-m2-warning,.lintec-m2-reason');let btn=row.querySelector('.lintec-quick-original');if(!warning){if(btn)btn.remove();return}const id=String(row.dataset.materialId||'');const src=sourceByMaterial.get(id);if(!src?.source_file_path){if(btn)btn.remove();return}const edit=row.querySelector('.material-edit-btn');if(!edit)return;if(!btn){btn=document.createElement('button');btn.type='button';btn.className='lintec-quick-original';btn.textContent='原本を見る';btn.style.cssText='display:inline-flex;align-items:center;justify-content:center;margin-top:10px;margin-left:8px;border:2px solid #dc2626;background:#fff;color:#b91c1c;border-radius:10px;padding:8px 14px;font-weight:900;font-size:14px;min-width:92px;touch-action:manipulation';btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openOriginal(btn.dataset.path,btn)},true);edit.insertAdjacentElement('afterend',btn)}btn.dataset.path=src.source_file_path;btn.title=`${src.source_file_name||'原本'}${src.source_page?` / ${src.source_page}ページ目`:''}`;}
function applySourceButtons(){document.querySelectorAll('#mList .material-list-item').forEach(addOriginalButton)}
function scheduleSourceButtons(){clearTimeout(sourceTimer);sourceTimer=setTimeout(async()=>{if(!sourceLoaded)await loadSourceMap();applySourceButtons()},60)}
function apply(row){if(!isLintec(row))return;const name=row.querySelector('.material-name');if(!name)return;const parts=explain(`${name.textContent||''} ${row.querySelector('.material-meta')?.textContent||''}`);let box=row.querySelector('.lintec-label-explain');if(!parts.length){if(box)box.remove();}else{if(!box){box=document.createElement('div');box.className='lintec-label-explain';box.style.cssText='margin-top:7px;padding:8px 10px;border-radius:9px;background:#f3f8f4;color:#287a3d;font-size:13px;font-weight:750;line-height:1.55';const meta=row.querySelector('.material-meta');(meta||name).insertAdjacentElement('afterend',box);}box.textContent='仕様説明：'+parts.join(' ／ ');}convertPrice(row);addOriginalButton(row);}
function run(){document.querySelectorAll('#mList .material-list-item').forEach(apply);scheduleSourceButtons()}
async function start(){await loadSourceMap();run();const root=document.getElementById('mList');if(root)new MutationObserver(()=>{setTimeout(run,30);scheduleSourceButtons()}).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['data-material-id','class']});window.addEventListener('delivery-archive-reanalyzed',async()=>{sourceLoaded=false;await loadSourceMap();applySourceButtons()});setTimeout(run,500);setTimeout(run,1500);setTimeout(run,2600)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();