(function(){
"use strict";
const input=document.getElementById("tickerInput"),form=document.getElementById("searchForm"),suggestions=document.getElementById("suggestions");
const status=document.getElementById("searchStatus"),button=document.getElementById("searchButton");
const $=id=>document.getElementById(id);
const brl=n=>n===null||n===undefined||!Number.isFinite(Number(n))?"—":new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:2,maximumFractionDigits:Number(n)<1?8:2}).format(Number(n));
const pct=n=>n===null||n===undefined||!Number.isFinite(Number(n))?"—":Number(n).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})+"%";
const num=n=>n===null||n===undefined||!Number.isFinite(Number(n))?"—":Number(n).toLocaleString("pt-BR",{maximumFractionDigits:2});
function text(id,value){$(id).textContent=value==null?"":String(value);}
function dateLabel(value){
 if(!value)return "Data do último fechamento não informada";
 if(/^\d{4}-\d{2}-\d{2}$/.test(value))return value.split("-").reverse().join("/");
 const d=new Date(value);return Number.isNaN(d.valueOf())?String(value):d.toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short",timeZone:"America/Sao_Paulo"});
}
let requestSeq=0,debounce=null,abort=null;
function message(m,isError){status.textContent=m;status.className="status"+(isError?" error":"");}
function hideSuggestions(){suggestions.hidden=true;suggestions.replaceChildren();}
function suffix(code){return code.startsWith("BTC")?"Bitcoin":code;}
async function suggest(q){
 const seq=++requestSeq;
 try{
  const resp=await fetch("/api/sugerir?q="+encodeURIComponent(q),{cache:"default"});
  if(!resp.ok)return;
  const data=await resp.json();if(seq!==requestSeq||input.value.trim()!==q)return;
  const list=Array.isArray(data.suggestions)?data.suggestions:[];
  hideSuggestions();if(!list.length)return;
  list.forEach(item=>{
   const row=document.createElement("button");row.type="button";row.className="suggest";
   const name=document.createElement("b");name.textContent=item.ticker;
   const desc=document.createElement("small");desc.textContent=(item.name||"")+(item.category?" • "+item.category:"");
   row.append(name,desc);
   row.onclick=()=>{input.value=item.ticker;hideSuggestions();lookup(item.ticker);};
   suggestions.appendChild(row);
  });
  suggestions.hidden=false;
 }catch(e){hideSuggestions();}
}
input.addEventListener("input",()=>{
 clearTimeout(debounce);hideSuggestions();
 const q=input.value.trim();
 if(q.length>=2)debounce=setTimeout(()=>suggest(q),290);
});
document.addEventListener("click",e=>{if(!e.target.closest(".searchbox"))hideSuggestions();});
document.querySelectorAll("[data-symbol]").forEach(btn=>btn.onclick=()=>{input.value=btn.dataset.symbol;hideSuggestions();lookup(btn.dataset.symbol);});
form.onsubmit=e=>{e.preventDefault();hideSuggestions();lookup(input.value.trim());};
function addDetail(label,value){
 if(value===null||value===undefined||value==="—")return;
 const holder=$("quoteDetails");const div=document.createElement("div");div.className="pair";
 const dt=document.createElement("dt");dt.textContent=label;
 const dd=document.createElement("dd");dd.textContent=value;
 div.append(dt,dd);holder.appendChild(div);
}
function refLink(parent,label,url){
 const a=document.createElement("a");a.textContent=label;a.href=url;a.target="_blank";a.rel="noopener noreferrer";parent.appendChild(a);
}
function renderChart(data){
 const panel=$("chartPanel");panel.classList.remove("hide");
 const node=$("chartFrame");node.replaceChildren();
 const symbol=data.tvSymbol;
 if(!symbol){node.textContent="Gráfico indisponível para este ticker.";return;}
 const outer=document.createElement("div");outer.className="tradingview-widget-container";
 outer.style.height="370px";outer.style.width="100%";
 const inner=document.createElement("div");inner.className="tradingview-widget-container__widget";
 inner.style.width="100%";inner.style.height="100%";
 outer.appendChild(inner);
 node.appendChild(outer);
 const script=document.createElement("script");
 script.type="text/javascript";script.async=true;
 script.src="https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
 script.textContent=JSON.stringify({
  symbols:[[data.ticker,symbol+"|1D"]],
  chartOnly:false,width:"100%",height:370,locale:"br",colorTheme:"dark",
  autosize:true,showVolume:false,showMA:false,hideDateRanges:false,
  hideMarketStatus:false,hideSymbolLogo:false,scalePosition:"right",
  scaleMode:"Normal",fontFamily:"system-ui",fontSize:"12",
  noTimeScale:false,valuesTracking:"1",changeMode:"price-and-percent",
  chartType:"area"
 });
 script.onerror=function(){
  node.replaceChildren();
  const p=document.createElement("p");p.textContent="Não foi possível carregar o gráfico neste dispositivo. ";
  node.appendChild(p);
  refLink(node,"Abrir TradingView","https://br.tradingview.com/chart/?symbol="+encodeURIComponent(symbol));
 };
 outer.appendChild(script);
 text("chartExplanation",data.isClosingPrice?"O gráfico TradingView da B3 pode ter pelo menos 15 minutos de atraso. O preço destacado acima é do último fechamento.":"Gráfico Binance/TradingView de cripto. A oscilação de 24h não equivale à variação de pregão da B3.");
}
function renderQuote(data){
 $("results").classList.remove("hide");
 text("quoteCategory",data.category||"Cotação de mercado");
 text("quoteTicker",data.ticker);
 text("quoteName",data.name||"");
 text("quoteLabel",data.referenceLabel||"Preço de referência");
 text("quotePrice",brl(data.price));
 const d=$("quoteChange");d.replaceChildren();
 if(data.variation!==null&&data.variation!==undefined){
  const chip=document.createElement("span");chip.className="change "+(data.variation>0?"up":data.variation<0?"down":"neutral");
  chip.textContent=(data.variation>0?"+":"")+pct(data.variation)+" • "+(data.variationLabel||"Variação");
  d.appendChild(chip);
 }else{d.textContent="Variação não disponível neste momento.";}
 $("quoteDetails").replaceChildren();
 addDetail("Data da referência",dateLabel(data.reference));
 if(data.isClosingPrice){
  addDetail("Variação no mês",pct(data.monthlyVariation));
  addDetail("Variação no ano",pct(data.yearVariation));
  addDetail("Variação em 12 meses",pct(data.twelveMonthVariation));
  addDetail("Mínima em 52 semanas",brl(data.low52));
  addDetail("Máxima em 52 semanas",brl(data.high52));
  addDetail("Dividend Yield 12m",pct(data.dy12m));
  addDetail("P/L",num(data.pl));
  addDetail("P/VP",num(data.pvp));
 }else{
  addDetail("Mínima nas últimas 24h",brl(data.low24h));
  addDetail("Máxima nas últimas 24h",brl(data.high24h));
 }
 const src=$("quoteSource");src.replaceChildren();
 const s=document.createElement("span");s.textContent="Fonte: ";src.appendChild(s);
 refLink(src,data.source||"Fonte de mercado",data.sourceUrl||"https://capitalagora.com.br/api");
 const more=document.createElement("span");more.textContent=" • Referência: "+dateLabel(data.reference)+" • "+(data.delay||"");src.appendChild(more);
 const explain=$("explain");explain.replaceChildren();
 const title=document.createElement("p");
 title.textContent=data.isClosingPrice?"Este valor é o preço oficial de fechamento do último pregão disponível, e não uma cotação em tempo real.":"Este é o preço negociado no mercado Spot da Binance para o par em reais, no momento da consulta.";
 explain.appendChild(title);
 const q=document.createElement("p");
 q.innerHTML=data.isClosingPrice?"<strong>Variação do dia</strong> compara fechamentos de pregões. Fim de semana e feriados usam o pregão mais recente.":"<strong>Variação de 24h</strong> reflete uma janela móvel de negociação, diferente da variação diária de ações.";
 explain.appendChild(q);
 const p=document.createElement("p");p.textContent="A cotação exibida é informativa e não representa rentabilidade da sua carteira ou recomendação de compra.";
 explain.appendChild(p);
 renderChart(data);
}
function showError(data){
 $("results").classList.add("hide");
 message(data.error||"Não foi possível obter a cotação. Confira o ticker e tente novamente.",true);
 if(data.tvSymbol){$("chartPanel").classList.remove("hide");renderChart(data);}else $("chartPanel").classList.add("hide");
}
async function lookup(raw){
 const q=String(raw||"").trim().toUpperCase().replace(/\s+/g,"");
 input.value=q;
 if(!/^[A-Z0-9]{2,12}$/.test(q)){message("Digite o código do ativo, não apenas o nome. Se necessário, escolha uma sugestão.",true);return;}
 if(abort)abort.abort();abort=new AbortController();
 const signal=abort.signal;
 button.disabled=true;message("Consultando fontes públicas para "+q+"...");$("results").classList.add("hide");
 try{
  const response=await fetch("/api/consulta?ticker="+encodeURIComponent(q),{signal:signal});
  const data=await response.json();
  if(signal.aborted)return;
  if(!data.ok){showError(data);return;}
  message("Consulta concluída: "+data.source+" • "+dateLabel(data.reference));
  renderQuote(data);
  const params=new URLSearchParams(window.location.search);params.set("ticker",q);
  history.replaceState(null,"","?"+params.toString());
 }catch(e){
  if(e.name==="AbortError")return;
  showError({error:"Não foi possível consultar o mercado. Tente novamente em instantes."});
 }finally{if(!signal.aborted)button.disabled=false;}
}
const initial=new URLSearchParams(window.location.search).get("ticker");
if(initial&&/^[A-Za-z0-9]{2,12}$/.test(initial))lookup(initial);
})();
