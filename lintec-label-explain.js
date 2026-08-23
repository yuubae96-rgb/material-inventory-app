(()=>{
'use strict';
const n=s=>String(s||'').normalize('NFKC').toUpperCase();
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
function apply(row){if(!isLintec(row))return;const name=row.querySelector('.material-name');if(!name)return;const parts=explain(`${name.textContent||''} ${row.querySelector('.material-meta')?.textContent||''}`);let box=row.querySelector('.lintec-label-explain');if(!parts.length){if(box)box.remove();}else{if(!box){box=document.createElement('div');box.className='lintec-label-explain';box.style.cssText='margin-top:7px;padding:8px 10px;border-radius:9px;background:#f3f8f4;color:#287a3d;font-size:13px;font-weight:750;line-height:1.55';const meta=row.querySelector('.material-meta');(meta||name).insertAdjacentElement('afterend',box);}box.textContent='仕様説明：'+parts.join(' ／ ');}convertPrice(row);}
function run(){document.querySelectorAll('#mList .material-list-item').forEach(apply)}
function start(){run();const root=document.getElementById('mList');if(root)new MutationObserver(()=>setTimeout(run,30)).observe(root,{childList:true,subtree:true});setTimeout(run,500);setTimeout(run,1500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();