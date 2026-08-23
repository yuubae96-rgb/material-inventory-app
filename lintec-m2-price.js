(()=>{
'use strict';
const num=s=>Number(String(s||'').replace(/,/g,''));
const fmt=n=>new Intl.NumberFormat('ja-JP',{maximumFractionDigits:2}).format(n);
function isLintec(row){return /仕入先\s*リンテック/i.test(String(row?.innerText||''));}
function parseSize(text){
  const t=String(text||'').normalize('NFKC').replace(/，/g,',');
  let m=t.match(/幅\s*(\d+(?:\.\d+)?)\s*(?:mm)?\s*[×xX*＊]\s*(?:長さ)?\s*(\d+(?:\.\d+)?)\s*(?:m)?/i);
  if(m)return{w:num(m[1]),l:num(m[2])};
  m=t.match(/(\d+(?:\.\d+)?)\s*[×xX*＊]\s*(\d+(?:\.\d+)?)\s*(?:R|ロール|巻)?(?:\s|$)/i);
  if(m)return{w:num(m[1]),l:num(m[2])};
  m=t.match(/幅\s*(\d+(?:\.\d+)?)\s*(?:mm)?\s*[×xX*＊]?\s*長さ\s*(\d+(?:\.\d+)?)\s*(?:m)?/i);
  if(m)return{w:num(m[1]),l:num(m[2])};
  m=t.match(/(?:^|[\/|,、\s])((?:\d+(?:\.\d+)?))\s+((?:\d+(?:\.\d+)?))\s*(?:R|ロール|巻)(?:\s|$)/i);
  if(m)return{w:num(m[1]),l:num(m[2])};
  return null;
}
function parseRollPrice(text){const m=String(text||'').replace(/,/g,'').match(/最新単価\s*(\d+(?:\.\d+)?)円\s*\/\s*(R|ロール|巻)/i);return m?num(m[1]):null;}
function reason(row,msg){let el=row.querySelector('.lintec-m2-reason');if(!el){el=document.createElement('div');el.className='lintec-m2-reason';el.style.cssText='margin-top:5px;color:#9a3412;font-size:12px;font-weight:800;line-height:1.5';const p=row.querySelector('.material-price');p?.insertAdjacentElement('afterend',el);}if(el)el.textContent='㎡単価を表示できない理由：'+msg+'。編集から幅(mm)・長さ(m)を入力してください。';}
function apply(row){if(!isLintec(row))return;const priceEl=row.querySelector('.material-price');if(!priceEl)return;const original=priceEl.dataset.lintecOriginal||priceEl.textContent||'';if(!priceEl.dataset.lintecOriginal)priceEl.dataset.lintecOriginal=original;const rollPrice=parseRollPrice(original);if(!rollPrice){row.querySelector('.lintec-m2-reason')?.remove();return;}const meta=row.querySelector('.material-meta')?.innerText||'';const size=parseSize(meta);if(!size||!size.w||!size.l){reason(row,'幅mmと長さmを規格から確定できません');return;}const area=(size.w/1000)*size.l;if(!(area>0)){reason(row,'ロール面積を計算できません');return;}const unit=rollPrice/area;priceEl.innerHTML='最新単価 '+fmt(unit)+'円 / ㎡'+(original.match(/\([^)]*\)/)?.[0]?' '+original.match(/\([^)]*\)/)[0]:'');let box=row.querySelector('.lintec-m2-calc');if(!box){box=document.createElement('div');box.className='lintec-m2-calc';box.style.cssText='margin-top:5px;color:#287a3d;font-size:12px;font-weight:800;line-height:1.55';priceEl.insertAdjacentElement('afterend',box);}box.innerHTML='㎡換算表示（元 '+fmt(rollPrice)+'円/R・'+fmt(area)+'㎡）<br><span style="color:#475569">計算：'+fmt(rollPrice)+'円 ÷ ('+fmt(size.w)+'mm ÷ 1000 × '+fmt(size.l)+'m) = '+fmt(unit)+'円/㎡</span>';row.querySelector('.lintec-m2-reason')?.remove();}
function run(){document.querySelectorAll('#mList .material-list-item').forEach(apply)}
function start(){run();const root=document.getElementById('mList');if(root)new MutationObserver(()=>setTimeout(run,30)).observe(root,{childList:true,subtree:true});setTimeout(run,400);setTimeout(run,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();