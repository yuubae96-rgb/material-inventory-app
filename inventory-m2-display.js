(()=>{
'use strict';
const DENSITY={aluminum:2.70,stainless:7.93,steel:7.85,brass:8.50,copper:8.96};
const n=s=>{const m=String(s??'').replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):null};
const fmt=x=>Number(x).toLocaleString('ja-JP',{maximumFractionDigits:2});
function fixDateText(s){return String(s||'').replace(/\b20(0[1-9]|1\d)-(\d{2})-(\d{2})\b/g,(_,yy,mm,dd)=>`${2018+Number(yy)}-${mm}-${dd}`)}
function densityFor(t){t=String(t||'').normalize('NFKC').toLowerCase();if(/a1\d{3}|a1050|a1070|アルミ/.test(t))return DENSITY.aluminum;if(/sus|ステンレス/.test(t))return DENSITY.stainless;if(/真鍮|brass|c2[678]\d{2}/.test(t))return DENSITY.brass;if(/銅|copper|c1100/.test(t))return DENSITY.copper;if(/鉄|steel|spcc|ss400/.test(t))return DENSITY.steel;return null}
function dims(t){t=String(t||'').normalize('NFKC');let m=t.match(/(?:^|[^\d.])(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)(?:[^\d.]|$)/);if(m)return{th:+m[1],w:+m[2],l:+m[3]};m=t.match(/t\s*(\d+(?:\.\d+)?)/i);const th=m?+m[1]:null;const a=[...t.matchAll(/(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)/g)].map(x=>({w:+x[1],l:+x[2]})).find(x=>x.w>=100&&x.l>=100);return a?{th,w:a.w,l:a.l}:{th}}
function isPlate(text){return /板材|金属板|板|sheet|a1\d{3}|sus|ステンレス|アルミ|真鍮/.test(String(text||'').toLowerCase())}
function normalizeRow(row){
 const name=row.querySelector('.material-name'),meta=row.querySelector('.material-meta'),stock=row.querySelector('.material-stock'),price=row.querySelector('.material-price');if(!name||!meta||!price)return;
 const text=`${name.textContent||''} ${meta.textContent||''}`;if(!isPlate(text))return;
 const dm=dims(text),den=densityFor(text);let changed=false;
 const ptxt=price.textContent||'';const pm=ptxt.replace(/,/g,'').match(/最新単価\s*([\d.]+)円\s*\/\s*([KSk s㎡m²]+)/i);if(pm){const p=+pm[1],u=pm[2].trim().toUpperCase();let m2=null,detail='';if(u==='K'&&dm?.th&&den){m2=p*dm.th*den;detail=`元 ${fmt(p)}円/kg`;}else if(u==='S'&&dm?.w&&dm?.l){const area=dm.w/1000*dm.l/1000;if(area>0){m2=p/area;detail=`元 ${fmt(p)}円/シート`;}}if(m2!=null){const date=(ptxt.match(/\(([^)]+)\)/)||[])[1]||'';price.textContent=`最新単価 ${fmt(m2)}円 / ㎡${date?` (${fixDateText(date)})`:''}`;let note=row.querySelector('.m2-display-note');if(!note){note=document.createElement('div');note.className='m2-display-note';note.style.cssText='font-size:12px;color:#287a3d;font-weight:800;margin-top:4px';price.insertAdjacentElement('afterend',note)}note.textContent=`㎡換算表示（${detail}）`;changed=true}else{price.textContent=fixDateText(ptxt)}}else price.textContent=fixDateText(ptxt);
 if(stock){const st=stock.textContent||'';const sm=st.replace(/,/g,'').match(/^\s*([\d.]+)\s*([KS])\s*$/i);if(sm){const q=+sm[1],u=sm[2].toUpperCase();let qm2=null;if(u==='K'&&dm?.th&&den){const kgm2=dm.th*den;if(kgm2>0)qm2=q/kgm2}else if(u==='S'&&dm?.w&&dm?.l){qm2=q*(dm.w/1000)*(dm.l/1000)}if(qm2!=null){stock.textContent=`${fmt(qm2)} ㎡`;changed=true}}}
 if(changed)row.dataset.m2Display='1';
}
function run(){document.querySelectorAll('#mList .material-list-item').forEach(normalizeRow)}
function start(){run();const root=document.getElementById('mList');if(root)new MutationObserver(()=>setTimeout(run,20)).observe(root,{childList:true,subtree:true});setTimeout(run,500);setTimeout(run,1500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();