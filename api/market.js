// Consultas apenas de dados públicos de mercado; dados da carteira nunca são enviados aos provedores.
const {getQuote}=require("./consulta.js");
module.exports=async function handler(req,res){
 res.setHeader("Content-Type","application/json; charset=utf-8");
 res.setHeader("Cache-Control","public, s-maxage=180, stale-while-revalidate=360");
 if(req.method!=="GET")return res.status(405).json({error:"Método inválido"});
 const raw=String(req.query&&req.query.tickers||"");
 if(raw.length>320)return res.status(400).json({error:"Muitos códigos"});
 const tickers=[...new Set(raw.split(",").map(x=>x.trim().toUpperCase()).filter(Boolean))];
 if(!tickers.length||tickers.length>20||tickers.some(x=>!(/^[A-Z0-9]{2,12}$/.test(x))))return res.status(400).json({error:"Informe até 20 códigos"});
 try{
  const quotes=await Promise.all(tickers.map(async function(ticker){
    const r=await getQuote(ticker);
    if(!r.ok)return {ticker,status:"unavailable",message:r.error||"Sem cotação",source:r.source||"Não disponível"};
    return {ticker,status:"ok",price:r.price,changePercent:r.variation,
      source:r.source,currency:r.currency,asOf:r.reference,delay:r.delay,
      referenceLabel:r.referenceLabel,sourceUrl:r.sourceUrl,isClosingPrice:r.isClosingPrice};
  }));
  return res.status(200).json({quotes,generatedAt:new Date().toISOString(),notice:"B3: último fechamento de pregão. Criptomoedas: mercado spot, variação móvel de 24h. Consulta sem necessidade de cadastro em APIs."});
 }catch(e){return res.status(503).json({error:"Mercado temporariamente indisponível"});}
};