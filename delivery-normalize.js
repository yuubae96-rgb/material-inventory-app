(()=>{
'use strict';
const DENSITY={aluminum:2.70,stainless:7.93,steel:7.85,brass:8.50,copper:8.96};
const num=v=>{const n=Number(String(v??'').replace(/[,円￥\s]/g,''));return Number.isFinite(n)?n:null};
const round=(n,d=2)=>Math.round(n*10**d)/10**d;
function fixDate(s){const m=String(s||'').trim().match(/^(20)(0[1-9]|1\d)-(\d{2})-(\d{2})$/);if(!m)return s;const era=Number(m[2]);return `${2018+era}-${m[3]}-${m[4]}`;}
function densityFor(text){const t=String(text||'').normalize('NFKC').toLowerCase();if(/a1\d{3}|a1050|a1070|アルミ/.test(t))return DENSITY.aluminum;if(/sus|ステンレス/.test(t))return DENSITY.stainless;if(/真鍮|brass|c2[678]\d{2}/.test(t))return DENSITY.brass;if(/銅|copper|c1100/.test(t))return DENSITY.copper;if(/鉄|steel|spcc|ss400/.test(t))return DENSITY.steel;return null;}
function dims(text){const t=String(text||'').normalize('NFKC').replace(/[φΦ]/g,'');const m=t.match(/(?:^|[^\d.])(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)(?:[^\d.]|$)/);if(m){return {th:Number(m[1]),w:Number(m[2]),l:Number(m[3])};}const m2=t.match(/(?:^|[^\d.])(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)(?:[^\d.]|$)/);if(m2)return {w:Number(m2[1]),l:Number(m2[2])};return null;}
function normalizeCard(card){if(card.dataset.m2Normalized==='1')return;const get=k=>card.querySelector(`[data-k="${k}"]`);const date=get('delivery_date');if(date&&/^20(0[1-9]|1\d)-/.test(date.value))date.value=fixDate(date.value);
 const unit=get('unit'),price=get('unit_price'),qty=get('quantity'),thEl=get('thickness_mm'),spec=get('spec'),name=get('name'),form=get('purchase_form'),notes=get('notes');if(!unit||!price)return;
 const u=String(unit.value||'').trim().toUpperCase(),p=num(price.value),q=num(qty?.value);if(p==null)return;
 const text=[name?.value,spec?.value,form?.value].filter(Boolean).join(' ');const dm=dims(text);const th=num(thEl?.value)||(dm?.th||null);let area=null,newPrice=null,newQty=null,reason='';
 if(u==='S'){
   const w=dm?.w,l=dm?.l;if(w&&l){area=(w/1000)*(l/1000);if(area>0){newPrice=p/area;newQty=q==null?null:q*area;reason=`元単価 ${p.toLocaleString()}円/S（シート・枚と解釈） → ${Math.round(newPrice).toLocaleString()}円/㎡`;}}
 } else if(u==='K'){
   const den=densityFor(text);if(th&&den){const kgPerM2=th*den;newPrice=p*kgPerM2;newQty=q==null?null:q/kgPerM2;reason=`元単価 ${p.toLocaleString()}円/K（kgと解釈） → ${Math.round(newPrice).toLocaleString()}円/㎡（厚み${th}mm・密度${den}）`;}
 }
 if(newPrice!=null){price.value=String(round(newPrice,2));unit.value='㎡';if(qty&&newQty!=null)qty.value=String(round(newQty,4));if(notes&&!notes.value.includes('㎡換算'))notes.value=(notes.value?notes.value+' / ':'')+'㎡換算: '+reason;let badge=card.querySelector('.m2-convert-note');if(!badge){badge=document.createElement('div');badge.className='m2-convert-note';badge.style.cssText='margin:8px 0;padding:8px 10px;border-radius:8px;background:#ecfdf5;color:#14532d;font-weight:800;font-size:12px';card.querySelector('.delivery-grid')?.before(badge);}if(badge)badge.textContent='✓ ㎡単価へ自動換算：'+reason;}
 card.dataset.m2Normalized='1';
}
function run(){document.querySelectorAll('#deliveryResults .delivery-result').forEach(normalizeCard);}
function start(){run();const root=document.getElementById('deliveryResults')||document.getElementById('materialApp');if(root)new MutationObserver(()=>setTimeout(run,0)).observe(root,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();