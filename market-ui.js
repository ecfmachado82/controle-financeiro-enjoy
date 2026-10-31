(function(){
"use strict";
const root=document.getElementById("marketPanel");if(!root)return;
let cached=[],current=[],timestamp="",busy=false,selected=null,timer=null;
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>Number.isFinite(Number(n))?new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(n)):"—";
const pct=n=>n===null||!Number.isFinite(Number(n))?"—":Number(n).toLocaleString("pt-BR",{maximumFractionDigits:2,minimumFractionDigits:2})+"%";
let api=null;
function render(){
 const positions=api&&api.getPositions?api.getPositions():[];
 const filtered=selected?positions.filter(x=>String(x.ticker).toUpperCase()===selected):positions;
 const idx=new Map(cached.map(x=>[x.ticker,x]));
 root.innerHTML='<div class="market-head"><div><h2>Mercado e rentabilidade</h2><p class="small muted">Cotações apenas para consulta — não alteram o valor cadastrado na sua carteira.</p></div><div><button id="marketRefresh">↻ Atualizar preços</button><span class="small muted" id="marketStamp">'+esc(timestamp)+'</span></div></div>'+
 (selected?'<button id="marketClear">← Ver todos os ativos</button>':"")+
 '<div class="scroll"><table><thead><tr><th>Ativo</th><th class="right">Cotação BRL</th><th class="right">Variação dia / 24h</th><th class="right">Posição ao preço de mercado</th><th class="right">Resultado total*</th><th>Origem e data</th></tr></thead><tbody>'+
 (filtered.length?filtered.map(p=>{
  const c=idx.get(String(p.ticker).toUpperCase()),ok=c&&c.status==="ok";
  const qty=Number(p.qty),currentValue=ok&&Number.isFinite(qty)&&qty>0?qty*Number(c.price):null;
  const paid=Number(p.purchase_price),hasCost=p.purchase_price!==null&&p.purchase_price!==undefined&&Number.isFinite(paid)&&qty>0;
  const dividend=Number(p.dividends_received||0);
  const gain=hasCost&&currentValue!==null?currentValue-paid*qty+dividend:null;
  const color=ok&&c.changePercent!==null?(c.changePercent<0?"var(--red)":"var(--teal)"):"var(--muted)";
  return '<tr data-market="'+esc(p.ticker)+'"><td><b>'+esc(p.ticker)+'</b><div class="small muted">'+esc(p.category)+'</div></td>'+
  '<td class="right">'+(ok?money(c.price):"—")+'</td><td class="right" style="color:'+color+'">'+(ok?pct(c.changePercent):"—")+'</td><td class="right">'+(currentValue===null?"—":money(currentValue))+'</td>'+
  '<td class="right">'+(gain===null?"—":money(gain))+'</td><td class="small">'+esc(c?(c.source||"")+(c.status!=="ok"?" — "+(c.message||"indisponível"):c.asOf?" — "+new Date(c.asOf).toLocaleString("pt-BR"):""):"Aguardando consulta")+'</td></tr>';
 }).join(""):'<tr><td colspan="6" class="muted">Cadastre investimentos para acompanhar as cotações.</td></tr>')+'</tbody></table></div>'+
 '<p class="small muted">* Resultado total = valor de mercado − (quantidade × preço de compra) + proventos informados. Não inclui taxas, impostos ou operações anteriores. Preencha o preço de compra e os proventos no cadastro. Renda fixa sem cotação automática nesta etapa.</p>';
 root.querySelector("#marketRefresh").onclick=refresh;
 const clear=root.querySelector("#marketClear");if(clear)clear.onclick=()=>{selected=null;render()};
 root.querySelectorAll("[data-market]").forEach(tr=>tr.onclick=()=>{selected=tr.dataset.market;render()});
}
async function refresh(){
 if(!api||busy||!api.getUser())return;
 const positions=api.getPositions();
 const tickers=[...new Set(positions.map(x=>String(x.ticker||"").trim().toUpperCase()).filter(Boolean))];
 if(!tickers.length){cached=[];timestamp="Sem investimentos";render();return;}
 busy=true;timestamp="Consultando mercado...";render();
 try{
  const all=[];
  for(let i=0;i<tickers.length;i+=20){
   const r=await fetch("/api/market?tickers="+encodeURIComponent(tickers.slice(i,i+20).join(",")),{cache:"no-store"});
   if(!r.ok)throw Error("Erro HTTP "+r.status);
   const j=await r.json();all.push(...j.quotes);
  }
  cached=all;timestamp="Última consulta: "+new Date().toLocaleString("pt-BR");
 }catch(e){timestamp="Falha: "+e.message+" — preços indisponíveis";cached=[];}
 finally{busy=false;render();}
}
window.MarketPanel={
 attach:function(input){api=input;render();},
 refresh:refresh,
 clear:function(){cached=[];selected=null;timestamp="";render();}
};
})();