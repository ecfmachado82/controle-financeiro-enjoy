"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const Sec=require("../security-utils.js");
const root=path.resolve(__dirname,"..");
const sample={ticker:"MXRF11",name:"FII",category:"Fundos imobiliários",type:"tijolo",source:"Corretora",qty:10,price:9.4,value:94,gain:1.2,notes:"",purchase_price:9,dividends_received:0};

test("backup válido é normalizado, sem aceitar identidade fornecida no arquivo",()=>{
 const rows=Sec.parseBackupObject({assets:[{...sample,user_id:"outro-usuario",role:"admin"}]});
 assert.equal(rows.length,1);
 assert.equal(rows[0].ticker,"MXRF11");
 assert.equal(Object.hasOwn(rows[0],"user_id"),false);
 assert.equal(Object.hasOwn(rows[0],"role"),false);
});

test("backup inválido ou excessivo é rejeitado",()=>{
 assert.throws(()=>Sec.parseBackupObject({assets:[{...sample,ticker:'"><img src=x onerror=alert(1)>'}]}),/Código/);
 assert.throws(()=>Sec.parseBackupObject({assets:[{...sample,category:"__proto__"}]}),/Categoria/);
 assert.throws(()=>Sec.parseBackupObject({assets:[{...sample,qty:-1}]}),/limite/);
 assert.throws(()=>Sec.parseBackupObject({assets:[{...sample,notes:"x".repeat(3000)}]}),/longo/);
 assert.throws(()=>Sec.parseBackupObject({assets:Array(201).fill(sample)}),/no máximo/);
 assert.throws(()=>Sec.parseBackupObject({assets:[]}),/não contém/);
});

test("CSV neutraliza fórmulas e mantém números válidos",()=>{
 for(const hostile of ["=HYPERLINK(\"bad\")","+SUM(1,1)","-1+2","@SUM(3)"," \t=calc","\r\n=1+1"]){
  const out=Sec.safeCsvCell(hostile,true);
  assert.ok(out.startsWith('"\'"),"Fórmula não neutralizada: "+hostile);
 }
 assert.equal(Sec.safeCsvCell(-12.7,false),'"-12.7"');
 assert.equal(Sec.safeCsvCell("XPTO",true),'"XPTO"');
});

test("assinatura de imagem impede extensão/MIME falsificado",async()=>{
 const fake=(type,values)=>({type,size:100,slice:()=>({arrayBuffer:async()=>Uint8Array.from(values).buffer})});
 assert.equal(await Sec.imageSignatureMatches(fake("image/png",[137,80,78,71,13,10,26,10,0,0,0,0])),true);
 assert.equal(await Sec.imageSignatureMatches(fake("image/png",[60,115,99,114,105,112,116,62,0,0,0,0])),false);
 assert.equal(await Sec.imageSignatureMatches(fake("image/jpeg",[255,216,255,224,0,0,0,0,0,0,0,0])),true);
});

test("páginas privadas não contêm scripts inline executáveis",()=>{
 for(const name of ["index.html","cotacoes.html"]){
  const src=fs.readFileSync(path.join(root,name),"utf8");
  assert.equal(/<script\s*>/i.test(src),false,"Script inline em "+name);
 }
});

test("headers mantêm CSP bloqueando object-src e JavaScript inline",()=>{
 const config=JSON.parse(fs.readFileSync(path.join(root,"vercel.json"),"utf8"));
 const rules=config.headers.filter(x=>x.headers.some(y=>y.key==="Content-Security-Policy"));
 assert.ok(rules.length>=2);
 for(const rule of rules){
  const value=rule.headers.find(y=>y.key==="Content-Security-Policy").value;
  assert.match(value,/object-src 'none'/);
  assert.match(value,/frame-ancestors 'none'/);
  assert.equal(value.includes("'unsafe-inline'")&&/script-src[^;]*'unsafe-inline'/.test(value),false);
 }
});
