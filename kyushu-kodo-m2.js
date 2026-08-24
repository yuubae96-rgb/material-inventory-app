(()=>{
'use strict';
const AL_DENSITY=2.71;
function norm(s){return String(s||'').normalize('NFKC').replace(/\s/g,'').toLowerCase()}
function isKyushuKodo(m){const s=norm(m?.supplier);return s.includes('九州黄銅')}
function isA1050(m){return /a1050/i.test(`${m?.name||''} ${m?.spec||''}`)}
function roundM2Price(kgPrice,thickness,density=AL_DENSITY){return Math.round(Number(kgPrice)*Number(thickness)*density)}
window.kyushuKodoM2={AL_DENSITY,roundM2Price};
async function normalize(){if(!window.supabaseClient)return;const {data:ms,error}=await supabaseClient.from('materials').select('*').eq('active',true);if(error)return console.error(error);for(const m of ms||[]){if(!isKyushuKodo(m)||!isA1050(m)||!m.thickness_mm)continue;const {data:ps,error:pe}=await supabaseClient.from('material_prices').select('*').eq('material_id',m.id).order('effective_from',{ascending:false}).order('id',{ascending:false}).limit(1);if(pe||!ps?.[0])continue;const p=ps[0];if(String(m.stock_unit)==='㎡')continue;const basis=norm(p.price_basis),unit=norm(m.stock_unit);if(!(unit==='k'||unit==='kg'||basis==='kg'))continue;const m2=roundM2Price(p.price,m.thickness_mm);const areaPerKg=1/(Number(m.thickness_mm)*AL_DENSITY);await supabaseClient.from('materials').update({stock_unit:'㎡'}).eq('id',m.id);await supabaseClient.from('material_prices').update({price:m2,price_basis:'stock_unit',notes:`${p.notes||''} / 九州黄銅 K=kg → ㎡換算・小数点以下四捨五入（元単価 ${p.price}円/kg）`.trim()}).eq('id',p.id);const {data:moves}=await supabaseClient.from('inventory_movements').select('*').eq('material_id',m.id);for(const mv of moves||[]){if(Number(mv.unit_price)===Number(p.price)){await supabaseClient.from('inventory_movements').update({quantity:Number((Number(mv.quantity)*areaPerKg).toFixed(4)),unit_price:m2,memo:`${mv.memo||''} / 九州黄銅 K=kg → ㎡換算・単価四捨五入`.trim()}).eq('id',mv.id)}}}
document.dispatchEvent(new CustomEvent('kyushu-kodo-m2-normalized'))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(normalize,700),{once:true});else setTimeout(normalize,700);
})();