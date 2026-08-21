(()=>{
'use strict';
let refreshTimer=null;
let refreshing=false;
async function refreshInventory(){
  if(refreshing)return;
  refreshing=true;
  try{
    if(typeof loadAll==='function')await loadAll();
    window.dispatchEvent(new Event('materials-changed'));
  }catch(e){console.error('inventory live refresh',e)}
  finally{refreshing=false}
}
function scheduleRefresh(){
  clearTimeout(refreshTimer);
  refreshTimer=setTimeout(refreshInventory,120);
}
function watch(){
  const results=document.getElementById('deliveryResults');
  if(!results){setTimeout(watch,200);return}
  if(results.dataset.liveRefreshWatch)return;
  results.dataset.liveRefreshWatch='1';
  let doneCount=results.querySelectorAll('.delivery-result.delivery-done').length;
  new MutationObserver(()=>{
    const next=results.querySelectorAll('.delivery-result.delivery-done').length;
    if(next>doneCount){doneCount=next;scheduleRefresh()}
    else doneCount=next;
  }).observe(results,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
}
window.addEventListener('materials-changed',()=>{});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch);else watch();
})();