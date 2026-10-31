// Pesquisa pública de cotações, sem login nem chaves no navegador.
// Fontes: Capital Agora (fechamentos B3), Binance Spot (preço e variação 24h).
const CRIPTO = {
 BTC:"Bitcoin",ETH:"Ethereum",BNB:"BNB",SOL:"Solana",XRP:"XRP",ADA:"Cardano",
 DOGE:"Dogecoin",AVAX:"Avalanche",LINK:"Chainlink",DOT:"Polkadot",LTC:"Litecoin",
 BCH:"Bitcoin Cash",TRX:"TRON",SHIB:"Shiba Inu",UNI:"Uniswap",XLM:"Stellar",NEAR:"NEAR"
};
const B3=/^[A-Z]{4}\d{1,2}$/;
function num(v){if(v===null||v===undefined||v==="")return null;const n=Number(v);return Number.isFinite(n)?n:null;}
async function getJSON(url){
 const control=new AbortController(),timeout=setTimeout(()=>control.abort(),8500);
 try{
  const r=await fetch(url,{headers:{"Accept":"application/json","User-Agent":"ControleFinanceiroEnjoy/1.0 (+https://controle-financeiro-enjoy.vercel.app)"},signal:control.signal});
  if(!r.ok){const e=new Error(r.status===404?"Ativo não encontrado nesta fonte":r.status===429?"Limite temporário de consultas atingido":"Serviço temporariamente indisponível");e.code=r.status;throw e;}
  const data=await r.json();if(!data||typeof data!=="object")throw Error("Resposta inválida do provedor");
  return data;
 }finally{clearTimeout(timeout);}
}
async function getQuote(raw){
 const ticker=String(raw||"").trim().toUpperCase().replace(/\s/g,"");
 if(!/^[A-Z0-9]{2,12}$/.test(ticker))return {ok:false,ticker,error:"Informe um ticker válido, como BBSE3, MXRF11 ou BTC."};
 if(Object.prototype.hasOwnProperty.call(CRIPTO,ticker)){
   const pair=ticker+"BRL";
   try{
     const rawQuote=await getJSON("https://data-api.binance.vision/api/v3/ticker/24hr?symbol="+pair);
     const price=num(rawQuote.lastPrice);
     if(price===null||price<=0)throw Error("Preço não disponível no par "+pair);
     const time=num(rawQuote.closeTime);
     return {
       ok:true,ticker,name:CRIPTO[ticker],category:"Criptomoeda",price,currency:"BRL",
       variation:num(rawQuote.priceChangePercent),variationLabel:"Oscilação nas últimas 24 horas",
       high24h:num(rawQuote.highPrice),low24h:num(rawQuote.lowPrice), volume24h:num(rawQuote.volume),
       reference:time?new Date(time).toISOString():new Date().toISOString(),
       referenceLabel:"Consulta de mercado (24 horas móveis)",
       source:"Binance Spot",sourceUrl:"https://www.binance.com/pt-BR/trade/"+ticker+"_BRL",
       primarySource:"Binance",delay:"Valores de mercado podem variar a cada instante.",
       tvSymbol:"BINANCE:"+pair,
       isClosingPrice:false
     };
   }catch(e){
     return {ok:false,ticker,error:"Não foi possível consultar "+pair+" na Binance. O par em reais pode estar indisponível ou a API pode estar fora do ar.",source:"Binance Spot",errorCode:e.code||null};
   }
 }
 if(B3.test(ticker)){
   try{
     const data=await getJSON("https://capitalagora.com.br/api/ativo/"+ticker);
     const price=num(data.preco);
     if(price===null||price<=0)throw Error("Sem preço de fechamento");
     const kind=String(data.tipo||"").toLowerCase();
     const isFund=/fii|fundo imobili/.test(kind);
     const variance=data.variacoes||{};
     const details=data.indicadores||{};
     return {
       ok:true,ticker,name:String(data.empresa||data.nome||ticker).slice(0,140),
       category:isFund?"Fundo imobiliário":"Ação / ativo B3",
       price,currency:"BRL",variation:num(variance.dia),
       variationLabel:"Variação do último pregão",
       monthlyVariation:num(variance.mes),yearVariation:num(variance.ano),
       twelveMonthVariation:num(variance.doze_meses),
       low52:num(data.faixa52&&data.faixa52.minima),high52:num(data.faixa52&&data.faixa52.maxima),
       pl:num(details.pl),pvp:num(details.pvp),dy12m:num(details.dy12m??details.dy_12m),
       reference:data.data||null,referenceLabel:"Fechamento do último pregão disponível",
       source:"Capital Agora",sourceUrl:"https://capitalagora.com.br/api",primarySource:"B3 / CVM",
       delay:"Cotação de fechamento, não representa preço intradiário.",
       tvSymbol:"BMFBOVESPA:"+ticker,isClosingPrice:true
     };
   }catch(e){
     return {ok:false,ticker,error:(e.code===404?"Ativo não disponível na base de consulta.":"Cotação B3 temporariamente indisponível. ")+" Use o gráfico de referência como alternativa.",source:"Capital Agora / B3",sourceUrl:"https://capitalagora.com.br/api",tvSymbol:"BMFBOVESPA:"+ticker,isClosingPrice:true,errorCode:e.code||null};
   }
 }
 return {ok:false,ticker,error:"Código não reconhecido como ação ou FII da B3 ou criptomoeda suportada. Digite um ticker, como BBSE3, MXRF11, BTC ou ETH."};
}
module.exports=async function handler(req,res){
 res.setHeader("Content-Type","application/json; charset=utf-8");
 res.setHeader("Cache-Control","public, s-maxage=90, stale-while-revalidate=180");
 if(req.method!=="GET")return res.status(405).json({ok:false,error:"Método não permitido"});
 const ticker=req.query&&req.query.ticker;
 if(Array.isArray(ticker)||typeof ticker!=="string"||ticker.length>24)return res.status(400).json({ok:false,error:"Ticker inválido"});
 try{const result=await getQuote(ticker);return res.status(result.ok?200:result.errorCode===429?429:result.errorCode===404?404:200).json(result);}
 catch(e){return res.status(503).json({ok:false,error:"Serviço de consulta indisponível. Tente novamente mais tarde."});}
};
module.exports.getQuote=getQuote;
module.exports.CRIPTO=CRIPTO;