module.exports=async function handler(req,res){
const endpoints={
 cap:"https://capitalagora.com.br/api/ativo/BBSE3",
 railway:"https://capital-agora-production.up.railway.app/api/ativo/BBSE3",
 yahoo1:"https://query1.finance.yahoo.com/v8/finance/chart/BBSE3.SA?interval=1d&range=5d",
 yahoo2:"https://query2.finance.yahoo.com/v8/finance/chart/BBSE3.SA?interval=1d&range=5d",
 yahooFind:"https://query1.finance.yahoo.com/v1/finance/search?q=bbse",
 brapi:"https://brapi.dev/api/quote/BBSE3",
 brapiFii:"https://brapi.dev/api/quote/MXRF11",
 capFind:"https://capital-agora-production.up.railway.app/api/sugerir?q=BBSE",
};
const calls=await Promise.all(Object.entries(endpoints).map(async([key,url])=>{
 const c=new AbortController(),tid=setTimeout(()=>c.abort(),8500);
 try{
 const r=await fetch(url,{signal:c.signal,headers:{"Accept":"application/json","User-Agent":"Mozilla/5.0 (compatible; InvestmentDashboard/1.0)"}});
 const t=(await r.text()).slice(0,650);
 return {key,status:r.status,text:t};
 }catch(e){return {key,status:"error",text:String(e.message).slice(0,180)}}
 finally{clearTimeout(tid)}
}));
res.setHeader("Cache-Control","no-store");res.status(200).json({diagnostic:true,results:calls});
};