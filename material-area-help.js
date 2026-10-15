(()=>{
'use strict';
if(window.__materialAreaHelp)return;window.__materialAreaHelp=true;
const lin='https://www.livasta-labels.com/products/decorative.html', sheet='https://www.livasta-labels.com/pdf/0843398F8.pdf', mar='https://maruu-s.com/film/';
const terms=[
 ['FNS','蒸着ポリエステルフィルム（銀色）。ツヤ＝光沢、ケシ＝つや消し。FNSはリンテックの製品系列名です。',lin],
 ['PVC','ポリ塩化ビニル（塩ビ／エンビ）フィルム。',lin],
 ['PET','ポリエチレンテレフタレート。ポリエステルの一種で、フィルムの材料名です。','https://www.teijin-resin.jp/products/pet'],
 ['PAT','材質名ではなく粘着剤側の品番。確認例：PAT1はアクリル系・永久接着タイプ。PAT1Eなど別品番へ同じ仕様を当てはめず、個別資料を確認してください。',sheet],
 ['LK','剥離材（裏紙）側の品番に使われる記号。確認例：PET38(A) PAT1 8LKの剥離材は片面ポリラミグラシン紙（青）。LK単独の正式な略語展開、7LK・8LK2等の仕様は未確認です。',sheet],
 ['OPP','二軸延伸ポリプロピレンフィルム。マルウではラミネート用のOPP製品などが掲載されています。','https://www.horiaki.co.jp/asset/product/pdf/HORIAKI_CATALOG_Vol4_WEB_01_PB.pdf'],
 ['YUPO','ユポ。ポリプロピレン樹脂と炭酸カルシウムを主原料にした合成紙のブランドです。','https://www.yupo.com/technology/core/index.html'],
 ['SM','マルウのSMはケシ銀（つや消し銀）の製品系列。公式ページではPET蒸着フィルムの区分です。英字の正式な略語展開は未確認です。',mar]
];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function description(t){return '<div class="mah-term"><b>'+t[0]+'</b>：'+esc(t[1])+' <a href="'+t[2]+'" target="_blank" rel="noopener noreferrer">公式資料</a></div>'}
function areaPrice(text){const s=String(text).normalize('NFKC').replace(/,/g,'');const m=s.match(/(\d+(?:\.\d+)?)\s*円\s*[／/]\s*(?:m2|m²|㎡|平米|平方メートル)(?![a-z0-9])/i);return m?Number(m[1]):null}
function calculate(w,l,q,wu,lu,p){if(![w,l,q,p].every(Number.isFinite)||w<=0||l<=0||q<=0||!Number.isInteger(q)||p<0)return null;const area=(w/(wu==='mm'?1000:1))*(l/(lu==='mm'?1000:1));const total=area*q*p;return Number.isFinite(total)&&Number.isFinite(area)?{area,total,each:area*p}:null}
function installRow(row){
 let box=row.querySelector(':scope > .mah-box');
 const name=row.querySelector('.material-name')?.textContent||'';
 const priceText=row.querySelector('.material-price')?.textContent||'';
 const p=areaPrice(priceText);
 const key=name+'|'+priceText;
 if(box?.dataset.key===key)return;
 if(!box){box=document.createElement('div');box.className='mah-box';row.appendChild(box)}
 box.dataset.key=key;
 const normalized=name.normalize('NFKC').toUpperCase();
 const matched=terms.filter(t=>normalized.includes(t[0])||(t[0]==='YUPO'&&normalized.includes('ユポ')));
 box.innerHTML=(matched.length?'<div class="mah-meaning"><b>この材料の略号</b>'+matched.map(description).join('')+'</div>':'')+
 (p===null?'<div class="mah-note">寸法計算：㎡単価が登録されている材料で利用できます。</div>':
 '<details class="mah-calculator"><summary>幅・長さから金額を計算</summary><p>使用面積による概算材料費（単価 '+esc(p.toLocaleString('ja-JP'))+'円／㎡）</p><div class="mah-grid">'+['幅','長さ'].map((v,i)=>'<label>'+v+'<span class="mah-dimension"><input class="mah-'+(i?'length':'width')+'" type="number" min="0" step="any" inputmode="decimal" placeholder="例：'+(i?'300':'200')+'" aria-label="'+v+'"><select class="mah-'+(i?'lu':'wu')+'" aria-label="'+v+'の単位"><option value="mm">mm</option><option value="m">m</option></select></span></label>').join('')+'<label>枚数（同じ寸法）<input class="mah-qty" type="number" min="1" step="1" value="1" inputmode="numeric"></label></div><output class="mah-result" aria-live="polite">幅と長さを入力してください。</output><div class="mah-note">計算式：幅(m) × 長さ(m) × 枚数 × ㎡単価。表示は小数第2位まで。端材・取り都合・最低発注量・加工費・送料・消費税の加算は含みません。単価の税込／税別は元データに従います。</div></details>');
 if(p!==null){const update=()=>{const val=s=>Number(box.querySelector(s).value);const r=calculate(val('.mah-width'),val('.mah-length'),val('.mah-qty'),box.querySelector('.mah-wu').value,box.querySelector('.mah-lu').value,p);const fmt=n=>n.toLocaleString('ja-JP',{maximumFractionDigits:2});box.querySelector('output').textContent=r?'1枚 '+r.area.toLocaleString('ja-JP',{maximumSignificantDigits:10})+'㎡ ／ '+fmt(r.each)+'円　合計 '+fmt(r.total)+'円':'幅・長さは0より大きい数、枚数は1以上の整数を入力してください。'};box.addEventListener('input',update);box.addEventListener('change',update)}
}
function install(){
 const list=document.getElementById('mList');if(!list)return;
 const style=document.createElement('style');style.textContent='.mah-box{padding:12px;background:#f4f8fc;border-radius:10px;margin:8px 0;color:#1c2938}.mah-term{font-size:13px;line-height:1.7;margin:5px 0}.mah-box a,.mah-glossary a{color:#155db0}.mah-calculator summary,.mah-glossary summary{cursor:pointer;font-weight:800;padding:8px 0}.mah-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.mah-grid label{font-size:14px;font-weight:700}.mah-dimension{display:flex;gap:5px}.mah-grid input,.mah-grid select{box-sizing:border-box;font-size:16px;min-width:0;width:100%;padding:10px;border:1px solid #b8c5d3;border-radius:6px;background:white;color:#172435}.mah-dimension select{width:70px;flex-shrink:0}.mah-result{display:block;font-size:18px;font-weight:800;padding:14px 0}.mah-note{font-size:12px;line-height:1.7;color:#536170}.mah-glossary{margin:12px 0;padding:10px 14px;background:#eef4fb;border-radius:10px}';document.head.appendChild(style);
 const glossary=document.createElement('details');glossary.className='mah-glossary';glossary.innerHTML='<summary>材料の略号早見表（FNS・PVC・PET・PAT・LK・OPP・YUPO・SM）</summary>'+terms.map(description).join('')+'<p class="mah-note">公式資料確認日：2026年10月15日。材質・粘着剤・裏紙の記号を区別して記載しています。品番末尾や厚みで仕様は変わります。</p>';list.before(glossary);
 let queued=false;const scan=()=>{queued=false;list.querySelectorAll('.material-list-item').forEach(installRow)};
 new MutationObserver(ms=>{if(ms.every(m=>(m.target.nodeType===1?m.target:m.target.parentElement)?.closest('.mah-box, .material-compact-summary')))return;if(!queued){queued=true;requestAnimationFrame(scan)}}).observe(list,{childList:true,subtree:true,characterData:true});scan();
}
window.materialAreaHelp={areaPrice,calculate};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
