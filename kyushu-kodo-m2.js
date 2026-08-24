(()=>{
'use strict';
const DENSITIES={aluminum:2.71,iron:7.85,stainless304:7.93,stainless316:7.98,stainless430:7.70,brass:8.50,copper:8.96};
function norm(s){return String(s||'').normalize('NFKC').replace(/\s/g,'').toLowerCase()}
function textOf(m){return norm(`${m?.category||''} ${m?.name||''} ${m?.spec||''}`)}
function isKyushuKodo(m){return norm(m?.supplier).includes('九州黄銅')}
function materialDensity(m){const t=textOf(m);if(/a1050|a1070|a1100|a5052|a6061|アルミ/.test(t))return{density:DENSITIES.aluminum,label:'アルミ'};if(/sus316l?|316l?/.test(t))return{density:DENSITIES.stainless316,label:'SUS316'};if(/sus430|430/.test(t))return{density:DENSITIES.stainless430,label:'SUS430'};if(/sus304|304|ステンレス|sus/.test(t))return{density:DENSITIES.stainless304,label:'SUS304'};if(/\bbsp\b|bsp|真鍮|黄銅|brass|c2600|c2680|c2801/.test(t))return{density:DENSITIES.brass,label:'真鍮'};if(/銅|copper|c1100|c1020|c1220/.test(t))return{density:DENSITIES.copper,label:'銅'};if(/鉄|steel|spcc|ss400/.test(t))return{density:DENSITIES.iron,label:'鉄'};return null}
function roundM2Price(kgPrice,thickness,density){return Math.round(Number(kgPrice)*Number(thickness)*Number(density))}
function fmt(n){return Number(n).toLocaleString('ja-JP',{maximumFractionDigits:2})}
function unitOf(m){const u=norm(m?.stock_unit);if(u==='k'||u==='kg')return'kg';if(u==='s'||u==='枚'||u==='sheet'||u==='シート')return'sheet';if(u==='㎡'||u==='m2'||u==='m²')return'm2';return u}
function dimensions(m){const t=String(`${m?.spec||''} ${m?.name||''}`).normalize('NFKC');const a=t.match(/(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)/);if(a)return{th:+a[1],w:+a[2],l:+a[3]};const b=t.match(/(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)/);return b?{w:+b[1],l:+b[2]}:{} }
function clearCalc(row){row.querySelectorAll('.kyushu-kodo-calc').forEach(x=>x.remove())}
function renderCalc(row,html){clearCalc(row);let n=document.createElement('div');n.className='kyushu-kodo-calc';const price=row.querySelector('.material-price');(price?.parentNode||row).insertBefore(n,price?.nextSibling||null);n.innerHTML=html}
async function showCalculations(){
  if(!window.supabaseClient)return;
  const {data:ms}=await supabaseClient.from('materials').select('*').eq('active',true);
  for(const m of ms||[]){
    if(!isKyushuKodo(m))continue;
    const {data:ps}=await supabaseClient.from('material_prices').select('*').eq('material_id',m.id).order('effective_from',{ascending:false}).order('id',{ascending:false}).limit(1);
    const p=ps?.[0];if(!p)continue;
    const rows=document.querySelectorAll(`#mList .material-list-item[data-material-id="${m.id}"]`);
    const u=unitOf(m),price=Number(p.price);
    if(!Number.isFinite(price)||price<=0){rows.forEach(clearCalc);continue}
    if(u==='sheet'){
      const d=dimensions(m),w=Number(d.w),l=Number(d.l);
      if(!(w>0&&l>0)){rows.forEach(clearCalc);continue}
      const area=(w/1000)*(l/1000),raw=price/area,rounded=Math.round(raw);
      rows.forEach(row=>{row.querySelectorAll('.m2-display-note').forEach(x=>x.remove());renderCalc(row,`<div style="margin-top:8px;padding:9px 10px;border-radius:9px;background:#f4f7fb;font-size:12px;line-height:1.65;font-weight:700"><b>㎡単価の計算</b><br>仕入単位：S（枚）<br>① 1枚の面積：${fmt(w/1000)}m × ${fmt(l/1000)}m ＝ <b>${fmt(area)}㎡</b><br>② ㎡単価：${fmt(price)}円/枚 ÷ ${fmt(area)}㎡ ＝ ${fmt(raw)}円/㎡<br>③ 小数点以下四捨五入 → <b>${fmt(rounded)}円/㎡</b></div>`)});
      continue;
    }
    if(u==='kg'){
      if(!m.thickness_mm){rows.forEach(clearCalc);continue}
      const md=materialDensity(m);if(!md){rows.forEach(clearCalc);continue}
      const thickness=Number(m.thickness_mm),kgPerM2=thickness*md.density,raw=price*kgPerM2,rounded=Math.round(raw);
      rows.forEach(row=>{row.querySelectorAll('.m2-display-note').forEach(x=>x.remove());renderCalc(row,`<div style="margin-top:8px;padding:9px 10px;border-radius:9px;background:#f4f7fb;font-size:12px;line-height:1.65;font-weight:700"><b>㎡単価の計算</b><br>材質：${md.label}　比重：${fmt(md.density)}<br>① 1㎡の重量：${fmt(thickness)}mm × ${fmt(md.density)} ＝ <b>${fmt(kgPerM2)}kg/㎡</b><br>② ㎡単価：${fmt(price)}円/kg × ${fmt(kgPerM2)}kg/㎡ ＝ ${fmt(raw)}円/㎡<br>③ 小数点以下四捨五入 → <b>${fmt(rounded)}円/㎡</b></div>`)});
      continue;
    }
    rows.forEach(clearCalc);
  }
}
async function normalize(){
  if(!window.supabaseClient)return;
  const {data:ms,error}=await supabaseClient.from('materials').select('*').eq('active',true);if(error)return console.error(error);
  for(const m of ms||[]){
    if(!isKyushuKodo(m)||!m.thickness_mm)continue;
    /* 原本の在庫単位が K/kg の材料だけを比重換算する。S/枚は絶対にkg扱いしない。 */
    if(unitOf(m)!=='kg')continue;
    const md=materialDensity(m);if(!md)continue;
    const {data:ps,error:pe}=await supabaseClient.from('material_prices').select('*').eq('material_id',m.id).order('effective_from',{ascending:false}).order('id',{ascending:false}).limit(1);
    if(pe||!ps?.[0])continue;
    const p=ps[0],original=Number(p.price);if(!Number.isFinite(original)||original<=0)continue;
    const thickness=Number(m.thickness_mm),kgPerM2=thickness*md.density,raw=original*kgPerM2,m2=Math.round(raw),areaPerKg=1/kgPerM2;
    await supabaseClient.from('materials').update({stock_unit:'㎡'}).eq('id',m.id);
    await supabaseClient.from('material_prices').update({price:m2,price_basis:'stock_unit',notes:`${p.notes||''} / 九州黄銅 K=kg → ㎡換算（${md.label} 比重 ${md.density}、${thickness}mm × ${md.density} = ${kgPerM2}kg/㎡、元単価 ${original}円/kg、㎡単価 ${raw}円/㎡ → ${m2}円/㎡）`.trim()}).eq('id',p.id);
    const {data:moves}=await supabaseClient.from('inventory_movements').select('*').eq('material_id',m.id);
    for(const mv of moves||[]){if(Number(mv.unit_price)===original){await supabaseClient.from('inventory_movements').update({quantity:Number((Number(mv.quantity)*areaPerKg).toFixed(4)),unit_price:m2,memo:`${mv.memo||''} / 九州黄銅 K=kg → ㎡換算（${md.label} 比重 ${md.density}、${kgPerM2}kg/㎡）`.trim()}).eq('id',mv.id)}}
  }
  document.dispatchEvent(new CustomEvent('kyushu-kodo-m2-normalized'));setTimeout(showCalculations,300);
}
function loadComparison(){if(window.__metalPriceComparisonLoading)return;window.__metalPriceComparisonLoading=true;const s=document.createElement('script');s.src='./metal-price-comparison.js?v=20260825-0818';s.onerror=()=>{window.__metalPriceComparisonLoading=false};document.body.appendChild(s)}
function run(){normalize();loadComparison();setTimeout(showCalculations,900);setTimeout(showCalculations,1800)}
window.kyushuKodoM2={DENSITIES,materialDensity,roundM2Price,showCalculations};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
document.addEventListener('click',e=>{if(e.target.closest?.('.material-compact-summary'))setTimeout(showCalculations,50)},true);
document.addEventListener('material-native-rendered',()=>setTimeout(showCalculations,50));
})();