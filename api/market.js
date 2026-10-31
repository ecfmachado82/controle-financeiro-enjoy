// Public market quotes only. Never access customer positions here.
const CRYPTOS = new Set(["BTC","ETH","BNB","SOL","XRP","ADA","DOGE","AVAX","LINK","DOT","LTC"]);
const STOCK = /^[A-Z]{4}\d{1,2}$/;
async function json(url,headers={}){
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),7500);
 try{
  const response=await fetch(url,{headers:{Accept:"application/json",...headers},signal:controller.signal});
  const data=await response.json().catch(()=>null);
  if(!response.ok)throw Error("API HTTP "+response.status);
  return data;
 }finally{clearTimeout(timeout);}
}
const safeNumber=x=>typeof x==="number"&&Number.isFinite(x)?x:(x===null||x===undefined?null:Number.isFinite(Number(x))?Number(x):null);
async function quote(code){
 if(CRYPTOS.has(code)){
  const pair=code+"BRL";
  try{
   const result=await json("https://data-api.binance.vision/api/v3/ticker/24hr?symbol="+pair);
   const price=safeNumber(result.lastPrice);
   if(price===null||price<=0)throw Error("Preço não retornado");
   return {ticker:code,price,changePercent:safeNumber(result.priceChangePercent),source:"Binance Spot BRL",currency:"BRL",asOf:new Date().toISOString(),delay:"Dados consultados no momento",status:"ok"};
  }catch(e){return {ticker:code,status:"unavailable",message:"Par BRL ou API Binance indisponível",source:"Binance Spot"};}
 }
 if(STOCK.test(code)){
  const token=process.env.BRAPI_TOKEN||"";
  const query=token?"?token="+encodeURIComponent(token):"";
  try{
   const result=await json("https://brapi.dev/api/quote/"+encodeURIComponent(code)+query);
   const item=result&&Array.isArray(result.results)?result.results.find(x=>x.symbol===code)||result.results[0]:null;
   const price=safeNumber(item&&item.regularMarketPrice);
   if(price===null||price<=0)throw Error("Ativo sem cotação");
   return {ticker:code,price,changePercent:safeNumber(item.regularMarketChangePercent),source:"brapi.dev / B3",currency:"BRL",asOf:item.regularMarketTime?new Date(item.regularMarketTime).toISOString():null,delay:"Pode haver atraso conforme o plano do provedor",status:"ok"};
  }catch(e){return {ticker:code,status:"unavailable",source:"brapi.dev / B3",message:token?"Cotação indisponível na API brapi":"Cotação indisponível; configure BRAPI_TOKEN na Vercel para ampliar o acesso"};}
 }
 return {ticker:code,status:"unsupported",message:"Sem feed automático; atualizar manualmente (ex.: CDB, LCI, Tesouro)"};
}
module.exports=async function handler(req,res){
 res.setHeader("Content-Type","application/json; charset=utf-8");
 res.setHeader("Cache-Control","public, s-maxage=45, stale-while-revalidate=90");
 if(req.method!=="GET")return res.status(405).json({error:"Método inválido"});
 const raw=String(req.query.tickers||"");
 if(raw.length>320)return res.status(400).json({error:"Códigos em excesso"});
 const tickers=[...new Set(raw.split(",").map(x=>x.trim().toUpperCase()).filter(Boolean))];
 if(!tickers.length||tickers.length>20||tickers.some(x=>!(/^[A-Z0-9]{2,12}$/.test(x))))return res.status(400).json({error:"Informe até 20 códigos válidos"});
 const items=await Promise.all(tickers.map(quote));
 return res.status(200).json({quotes:items,generatedAt:new Date().toISOString(),notice:"Cotações indicativas; não representam recomendações. Fontes podem apresentar atrasos."});
};