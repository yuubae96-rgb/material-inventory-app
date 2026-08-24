(()=>{
'use strict';
const DENSITIES={
  aluminum:2.71,
  iron:7.85,
  stainless304:7.93,
  stainless316:7.98,
  brass:8.50,
  copper:8.96
};
function norm(s){return String(s||'').normalize('NFKC').replace(/\s/g,'').toLowerCase()}
function textOf(m){return norm(`${m?.category||''} ${m?.name||''} ${m?.spec||''}`)}
function isKyushuKodo(m){return norm(m?.supplier).includes('九州黄銅')}
function materialDensity(m){
  const t=textOf(m);
  if(/a1050|a1100|a5052|a6061|アルミ/.test(t))return {density:DENSITIES.aluminum,label:'アルミ'};
  if(/sus316|sus316l/.test(t))return {density:DENSITIES.stainless316,label:'SUS316'};
  if(/sus304|ステンレス/.test(t))return {density:DENSITIES.stainless304,label:'SUS304'};
  if(/真鍮|brass|c2600|c2680|c2801/.test(t))return {density:DENSITIES.brass,label:'真鍮'};
  if(/銅|copper|c1100|c1020|c1220/.test(t))return {density:DENSITIES.copper,label:'銅'};
  if(/鉄|steel|spcc|ss400/.test(t))return {density:DENSITIES.iron,label:'鉄'};
  return null;
}
function roundM2Price(kgPrice,thickness,density){return Math.round(Number(kgPrice)*Number(thickness)*Number(density))}
function originalKgPrice(p){
  const t=String(p?.notes||'');
  let x=t.match(/元単価\s*([\d,.]+)円\s*\/\s*(?:kg|k)/i);
  if(x)return Number(x[1].replace(/,/g,''));
  if(norm(p?.price_basis)==='kg')return Number(p.price);
  return null;
}
function fmt(n){return Number(n).toLocaleString('ja-JP',{maximumFractionDigits:2})}
window.kyushuKodoM2={DENSITIES,materialDensity,roundM2Price};
async function showCalculations(){
  if(!window.supabaseClient)return;
  const {data:ms}=await supabaseClient.from('materials').select('*').eq('active',true);
  for(const m of ms||[]){
    if(!isKyushuKodo(m)||!m.thickness_mm)continue;
    const md=materialDensity(m);if(!md)continue;
    const {data:ps}=await supabaseClient.from('material_prices').select('*').eq('material_id',m.id).order('effective_from',{ascending:false}).order('id',{ascending:false}).limit(1);
    const p=ps?.[0],kg=originalKgPrice(p);if(!p||!kg)continue;
    const raw=kg*Number(m.thickness_mm)*md.density,rounded=Math.round(raw);
    document.querySelectorAll(`#mList .material-list-item[data-material-id="${m.id}"]`).forEach(row=>{
      let n=row.querySelector('.kyushu-kodo-calc');
      if(!n){n=document.createElement('div');n.className='kyushu-kodo-calc';const price=row.querySelector('.material-price');(price?.parentNode||row).insertBefore(n,price?.nextSibling||null)}
      n.innerHTML=`<div style="margin-top:8px;padding:9px 10px;border-radius:9px;background:#f4f7fb;font-size:12px;line-height:1.65;font-weight:700"><b>㎡単価の計算</b><br>${md.label} 比重 ${fmt(md.density)}<br>${fmt(kg)}円/kg × ${fmt(m.thickness_mm)}mm × ${fmt(md.density)} ＝ ${fmt(raw)}円/㎡<br>→ 小数点以下四捨五入 ＝ <b>${fmt(rounded)}円/㎡</b></div>`;
    });
  }
}
async function normalize(){
  if(!window.supabaseClient)return;
  const {data:ms,error}=await supabaseClient.from('materials').select('*').eq('active',true);if(error)return console.error(error);
  for(const m of ms||[]){
    if(!isKyushuKodo(m)||!m.thickness_mm)continue;
    const md=materialDensity(m);if(!md)continue;
    const {data:ps,error:pe}=await supabaseClient.from('material_prices').select('*').eq('material_id',m.id).order('effective_from',{ascending:false}).order('id',{ascending:false}).limit(1);
    if(pe||!ps?.[0])continue;
    const p=ps[0];if(String(m.stock_unit)==='㎡')continue;
    const basis=norm(p.price_basis),unit=norm(m.stock_unit);
    if(!(unit==='k'||unit==='kg'||basis==='kg'))continue;
    const original=Number(p.price);if(!Number.isFinite(original)||original<=0)continue;
    const raw=original*Number(m.thickness_mm)*md.density,m2=Math.round(raw),areaPerKg=1/(Number(m.thickness_mm)*md.density);
    await supabaseClient.from('materials').update({stock_unit:'㎡'}).eq('id',m.id);
    await supabaseClient.from('material_prices').update({price:m2,price_basis:'stock_unit',notes:`${p.notes||''} / 九州黄銅 K=kg → ㎡換算（${md.label} 比重 ${md.density}、元単価 ${original}円/kg）`.trim()}).eq('id',p.id);
    const {data:moves}=await supabaseClient.from('inventory_movements').select('*').eq('material_id',m.id);
    for(const mv of moves||[]){
      if(Number(mv.unit_price)===original){
        await supabaseClient.from('inventory_movements').update({quantity:Number((Number(mv.quantity)*areaPerKg).toFixed(4)),unit_price:m2,memo:`${mv.memo||''} / 九州黄銅 K=kg → ㎡換算（${md.label} 比重 ${md.density}）`.trim()}).eq('id',mv.id);
      }
    }
  }
  document.dispatchEvent(new CustomEvent('kyushu-kodo-m2-normalized'));setTimeout(showCalculations,300);
}
function run(){normalize();setTimeout(showCalculations,900);setTimeout(showCalculations,1800)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
document.addEventListener('click',e=>{if(e.target.closest?.('.material-compact-summary'))setTimeout(showCalculations,50)},true);
document.addEventListener('material-native-rendered',()=>setTimeout(showCalculations,50));
})();