// Autocomplete público e sem cadastro, usando busca Capital Agora e lista curta de criptos.
const cryptos={
 BTC:"Bitcoin",ETH:"Ethereum",BNB:"BNB",SOL:"Solana",XRP:"XRP",ADA:"Cardano",
 DOGE:"Dogecoin",AVAX:"Avalanche",LINK:"Chainlink",DOT:"Polkadot",LTC:"Litecoin",
 BCH:"Bitcoin Cash",TRX:"TRON",SHIB:"Shiba Inu",UNI:"Uniswap",XLM:"Stellar",NEAR:"NEAR"
};
function normalized(raw){
 const item=typeof raw==="string"?{ticker:raw}:raw||{};
 const ticker=String(item.ticker||item.codigo||item.cod||item.symbol||item.sigla||item.value||"").trim().toUpperCase();
 if(!/^[A-Z]{4}\d{1,2}$/.test(ticker))return null;
 const name=String(item.empresa||item.nome||item.name||item.descricao||item.label||ticker).slice(0,100);
 return {ticker,name,category:String(item.tipo||"B3").slice(0,40)};
}
module.exports=async function handler(req,res){
 res.setHeader("Content-Type","application/json; charset=utf-8");
 res.setHeader("Cache-Control","public, s-maxage=300, stale-while-revalidate=600");
 if(req.method!=="GET")return res.status(405).json({suggestions:[]});
 const raw=req.query&&req.query.q;
 if(typeof raw!=="string"||raw.length>60)return res.status(400).json({suggestions:[]});
 const q=raw.trim();
 if(q.length<2)return res.status(200).json({suggestions:[]});
 const suggestions=Object.entries(cryptos)
 .filter(([code,name])=>code.includes(q.toUpperCase())||name.toLowerCase().includes(q.toLowerCase()))
 .slice(0,6).map(([ticker,name])=>({ticker,name,category:"Criptomoeda"}));
 if(/^[A-Z]{4}\d{1,2}$/i.test(q)&&!suggestions.some(x=>x.ticker===q.toUpperCase()))
 suggestions.push({ticker:q.toUpperCase(),name:"Consultar ticker da B3",category:"B3"});
 const control=new AbortController(),timeout=setTimeout(()=>control.abort(),6000);
 try{
   const response=await fetch("https://capitalagora.com.br/api/sugerir?q="+encodeURIComponent(q),{headers:{Accept:"application/json"},signal:control.signal});
   if(response.ok){
    const body=await response.json();
    const rows=Array.isArray(body)?body:Array.isArray(body.sugestoes)?body.sugestoes:Array.isArray(body.resultados)?body.resultados:Array.isArray(body.result)?body.result:Array.isArray(body.results)?body.results:Array.isArray(body.ativos)?body.ativos:Array.isArray(body.data)?body.data:[];
    for(const item of rows.slice(0,12)){
      const s=normalized(item);
      if(s&&!suggestions.some(x=>x.ticker===s.ticker))suggestions.push(s);
    }
   }
 }catch(e){/* Disponibilidade da busca externa não impede digitar o ticker diretamente. */}
 finally{clearTimeout(timeout);}
 return res.status(200).json({suggestions:suggestions.slice(0,8)});
};