(()=>{
'use strict';
const fmt=n=>Number(n).toLocaleString('ja-JP',{maximumFractionDigits:4});
const yen=n=>Math.round(Number(n)||0).toLocaleString('ja-JP');
function fixDateText(s){return String(s||'').replace(/\b2062-(\d{2})-(\d{2})\b/g,'2026-$1-$2')}
function explicitArea(text){
  const t=String(text||'').normalize('NFKC').toUpperCase();
  const m=t.match(/(?:^|[\s/,(（])([0-9]+(?:\.[0-9]+)?)\s*M2(?:$|[\s/,)）])/);
  if(!m)return null;
  const a=Number(m[1]);
  return Number.isFinite(a)&&a>0?a:null;
}
function isLintec(meta){return /仕入先\s*リンテック(?:\s|$)/.test(String(meta||'').normalize('NFKC'))}
function isNonLabel(name){return /カッターヘッド|カッティング|カッテング|ラシャ|刃|ブレード|ヘッド/i.test(String(name||''))}
function normalizeRow(row){
  const nameEl=row.querySelector('.material-name'),metaEl=row.querySelector('.material-meta'),stockEl=row.querySelector('.material-stock'),priceEl=row.querySelector('.material-price');
  if(!nameEl||!metaEl||!priceEl)return;
  const name=(nameEl.textContent||'').trim(),meta=metaEl.textContent||'';
  if(!isLintec(meta)||isNonLabel(name))return;
  const area=explicitArea(meta);
  if(!area)return;
  if(row.dataset.lintecM2Done==='1')return;
  const originalPrice=priceEl.textContent||'';
  const pm=originalPrice.replace(/,/g,'').match(/最新単価\s*([\d.]+)円\s*\/\s*([^\s(]+)/);
  if(!pm)return;
  const price=Number(pm[1]);
  if(!Number.isFinite(price)||price<=0)return;
  const unit=(pm[2]||'').toUpperCase();
  if(unit==='㎡'||unit==='M²'||unit==='M2')return;
  const perM2=price/area;
  const date=(originalPrice.match(/\(([^)]+)\)/)||[])[1]||'';
  priceEl.textContent=`最新単価 ${yen(perM2)}円 / ㎡${date?` (${fixDateText(date)})`:''}`;
  let note=row.querySelector('.lintec-m2-note');
  if(!note){note=document.createElement('div');note.className='lintec-m2-note';note.style.cssText='font-size:12px;color:#287a3d;font-weight:800;margin-top:4px;line-height:1.55';priceEl.insertAdjacentElement('afterend',note)}
  note.innerHTML=`㎡換算表示（元 ${yen(price)}円/${unit||'R'}・${fmt(area)}㎡）<br><span style="font-weight:600;color:#475569">計算：${yen(price)}円 ÷ ${fmt(area)}㎡ ＝ ${yen(perM2)}円/㎡</span>`;
  let basis=row.querySelector('.lintec-m2-basis');
  if(!basis){basis=document.createElement('div');basis.className='lintec-m2-basis';basis.style.cssText='font-size:12px;color:#3f8f54;font-weight:900;margin-top:7px';metaEl.insertAdjacentElement('afterend',basis)}
  basis.textContent='在庫・数量・単価基準：㎡（平方メートル）';
  if(stockEl){
    const sm=(stockEl.textContent||'').replace(/,/g,'').match(/^\s*([\d.]+)\s*(R|巻)\s*$/i);
    if(sm){const rolls=Number(sm[1]);if(Number.isFinite(rolls))stockEl.textContent=`${fmt(rolls*area)} ㎡`;}
  }
  row.dataset.lintecM2Done='1';
}
function run(){document.querySelectorAll('#mList .material-list-item').forEach(normalizeRow)}
function start(){run();const root=document.getElementById('mList');if(root)new MutationObserver(()=>setTimeout(run,20)).observe(root,{childList:true,subtree:true});setTimeout(run,400);setTimeout(run,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();