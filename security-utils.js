/* Regras compartilhadas de validação local. A segurança entre contas permanece no RLS do Supabase. */
(function(root){
"use strict";
const MAX_FILE_BYTES=1024*1024,MAX_POSITIONS=200;
const categories=new Set(["Renda fixa","Ações","Fundos imobiliários","Criptomoedas","Outros"]);
const labels={ticker:40,name:200,type:100,source:120,notes:2000};
const fields=["ticker","name","category","type","source","qty","price","value","gain","notes","purchase_price","dividends_received"];
function text(value,max,label){
 if(value==null)return "";
 if(typeof value!=="string")throw Error("Campo de texto inválido: "+label);
 if(value.length>max)throw Error("Campo muito longo: "+label);
 return value;
}
function numeric(value,label,nullable,negativeAllowed){
 if(value==null||value===""){
  if(nullable)return null;
  if(value==null && label==="qty")return 0;
  if(value==null && label==="dividends_received")return 0;
  throw Error("Valor ausente: "+label);
 }
 if(typeof value!=="number" && (typeof value!=="string"||value.trim()===""))throw Error("Número inválido: "+label);
 const valueNumber=Number(value);
 if(!Number.isFinite(valueNumber)||Math.abs(valueNumber)>1e12||(!negativeAllowed&&valueNumber<0))throw Error("Número fora do limite: "+label);
 return valueNumber;
}
function validatePosition(input){
 if(!input||typeof input!=="object"||Array.isArray(input))throw Error("Posição inválida.");
 const ticker=text(input.ticker,labels.ticker,"ticker").trim().toUpperCase();
 if(!/^[A-Z0-9._-]{2,40}$/.test(ticker))throw Error("Código de ativo inválido.");
 const category=text(input.category||"Outros",80,"categoria");
 if(!categories.has(category))throw Error("Categoria não reconhecida: "+ticker);
 return {
  ticker,
  name:text(input.name||ticker,labels.name,"nome").trim(),
  category,
  type:text(input.type||"",labels.type,"tipo"),
  source:text(input.source||"",labels.source,"instituição"),
  qty:numeric(input.qty,"qty",false,false),
  price:numeric(input.price,"price",true,false),
  value:numeric(input.value,"value",false,false),
  gain:numeric(input.gain,"gain",true,true),
  notes:text(input.notes||"",labels.notes,"observações"),
  purchase_price:numeric(input.purchase_price,"purchase_price",true,false),
  dividends_received:numeric(input.dividends_received,"dividends_received",false,false)
 };
}
function parseBackupObject(parsed){
 const assets=Array.isArray(parsed)?parsed:parsed&&parsed.assets;
 if(!Array.isArray(assets))throw Error("O arquivo JSON precisa conter uma lista de investimentos.");
 if(assets.length===0)throw Error("O backup não contém investimentos.");
 if(assets.length>MAX_POSITIONS)throw Error("Importe no máximo "+MAX_POSITIONS+" investimentos de cada vez.");
 return assets.map(validatePosition);
}
function safeCsvCell(value,isText){
 const original=String(value==null?"":value);
 // Neutraliza formula injection, inclusive espaços/controles anteriores a = + - @.
 const escaped=isText&&(/^[\u0000-\u0020\u200b\uFEFF]*[=+\-@]/.test(original)||/^[\t\r\n]/.test(original))?"'"+original:original;
 return '"'+escaped.replace(/"/g,'""')+'"';
}
async function imageSignatureMatches(file){
 if(!file || !["image/png","image/jpeg","image/webp"].includes(file.type) ||file.size>12*1024*1024||file.size<12)return false;
 const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());
 const starts=expected=>expected.every((b,i)=>bytes[i]===b);
 if(file.type==="image/png")return starts([137,80,78,71,13,10,26,10]);
 if(file.type==="image/jpeg")return starts([255,216,255]);
 return starts([82,73,70,70])&&bytes[8]===87&&bytes[9]===69&&bytes[10]===66&&bytes[11]===80;
}
const methods={MAX_FILE_BYTES,MAX_POSITIONS,validatePosition,parseBackupObject,safeCsvCell,imageSignatureMatches,fields};
if(typeof module!=="undefined"&&module.exports)module.exports=methods;
root.SecurityUtils=methods;
})(typeof window!=="undefined"?window:globalThis);
