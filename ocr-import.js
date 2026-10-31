(function(){
"use strict";
function el(x){return document.getElementById(x);}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]});}
function br(s){
  if(s===null||s===undefined||String(s).trim()==="")return null;
  var v=String(s).replace(/[^\d.,+\-]/g,"");if(!v||v==="-")return null;
  var comma=v.lastIndexOf(","),dot=v.lastIndexOf(".");
  if(comma>=0&&dot>=0)v=comma>dot?v.replace(/\./g,"").replace(",","."):v.replace(/,/g,"");
  else if(comma>=0)v=v.replace(/\./g,"").replace(",",".");
  else if((v.match(/\./g)||[]).length>1)v=v.replace(/\./g,"");
  var n=Number(v);return Number.isFinite(n)?n:null;
}
function reais(s){var m=Array.from(String(s).matchAll(/R\s*\$\s*([+\-]?\s*[\d.,]+)/gi));return m.length?br(m[m.length-1][1]):null;}
function usdt(s){var m=Array.from(String(s).matchAll(/([+\-]?\s*\d[\d.,]*)\s*(?:USDT|USD)\b/gi));return m.length?br(m[m.length-1][1]):null;}
function number(s){var m=String(s).match(/[+\-]?\d[\d.,]*/g)||[];return m.length?br(m[m.length-1]):null;}
function category(code){
 if(/^(BTC|ETH|BNB|SOL|XRP|ADA|DOGE|AVAX|LINK|DOT|LTC|USDT|USDC)$/.test(code))return "Criptomoedas";
 if(/^(CDB|LCI|LCA|TESOURO)$/.test(code))return "Renda fixa";
 return /^[A-Z]{4}11$/.test(code)?"Fundos imobiliários":"Ações";
}
function parseImageText(text,filename){
 var lines=String(text||"").replace(/\u00a0/g," ").split(/\r?\n/).map(function(x){return x.trim().replace(/[ \t]+/g," ");}).filter(Boolean);
 var hits=[],pattern=/\b(?:[A-Z]{4}\s?\d{1,2}|BTC|ETH|BNB|SOL|XRP|ADA|DOGE|AVAX|LINK|DOT|LTC|USDT|USDC|CDB|LCI|LCA|TESOURO)\b/gi;
 lines.forEach(function(line,i){
   var m,regex=new RegExp(pattern.source,"gi");
   while((m=regex.exec(line))){
     var ticker=m[0].toUpperCase().replace(/\s/g,"");
     if(/^(CDB|LCI|LCA|TESOURO)$/.test(ticker)&&!new RegExp("^"+ticker+"\\b","i").test(line))continue;
     if(/^(USDT|USDC)$/.test(ticker)&&!new RegExp("^"+ticker+"\\b","i").test(line))continue;
     if(!hits.some(function(h){return h.i===i&&h.ticker===ticker;}))hits.push({i:i,ticker:ticker});
   }
 });
 hits.sort(function(a,b){return a.i-b.i});
 var result=[],seen=new Set();
 hits.forEach(function(hit,h){
   var ticker=hit.ticker;
   if(seen.has(ticker))return;seen.add(ticker);
   var stop=h+1<hits.length?hits[h+1].i:lines.length;
   var block=lines.slice(hit.i,Math.max(hit.i+1,stop)).slice(0,30);
   var c=category(ticker),isCrypto=c==="Criptomoedas";
   var qty=null,price=null,value=null,gain=null,warnings=[],notes=[];
   function fromLabel(re,money){
     for(var i=0;i<block.length;i++)if(re.test(block[i])){
       var a=money?reais(block[i]):number(block[i]);
       if(a!==null)return a;
       if(i+1<block.length){a=money?reais(block[i+1]):number(block[i+1]);if(a!==null)return a;}
     }
     return null;
   }
   if(isCrypto){
     for(var i=0;i<Math.min(7,block.length);i++){
       if(i>0&&/PNL|GANHO|RENDA|RESULTADO|PRE[CÇ]O|USDT|USD|R\$|%/i.test(block[i]))continue;
       var qm=block[i].match(/\b0[,\.]\d{4,}\b/);
       if(qm){qty=br(qm[0]);break;}
     }
     for(var j=0;j<Math.min(9,block.length);j++){
       if(/PNL|GANHO|RENDA|RESULTADO|LUCRO/i.test(block[j]))continue;
       var u=usdt(block[j]);
       if(u!==null){notes.push("Saldo na imagem: "+u.toLocaleString("pt-BR")+" USDT.");warnings.push("Valor exibido em USDT: informe o equivalente em reais (R$).");break;}
     }
   }else{
     qty=fromLabel(/\b(?:quantidade|qtd|cotas)\b/i,false);
     price=fromLabel(/pre[cç]o\s+atual|cota[cç][aã]o/i,true);
     value=fromLabel(/\bposi[cç][aã]o\b|\bvalor\s+atual\b|\bvalor\s+total\b/i,true);
     if(value===null)value=reais(block[0]);
     if(value===null&&qty!==null&&price!==null&&qty>0){value=Math.round(qty*price*100)/100;warnings.push("Valor calculado: quantidade × cotação. Confira.");}
     gain=fromLabel(/\b(?:resultado\s+total|rentabilidade|lucro|preju[ií]zo|p\/l)\b/i,true);
     if(gain!==null&&block.some(function(x){return /resultado|rentabilidade|lucro|preju/i.test(x)&&/(↓|↘|\-\s*\d)/.test(x)}))gain=-Math.abs(gain);
   }
   if(qty===null){qty=0;warnings.push("Quantidade não identificada; confira.");}
   if(value===null)warnings.push("Informe o valor atual em R$ antes de salvar.");
   var name=ticker;
   for(var i=1;i<Math.min(block.length,4);i++){
     var z=block[i];
     if(/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ ]{4,45}$/.test(z)&&!/^(quantidade|saldo|preço|valor|resultado|rentabilidade|comprar|vender|trade|earn|bitcoin)/i.test(z)){name=z;break;}
   }
   result.push({ticker:ticker,name:name,category:c,type:"",source:"",qty:qty,price:price,value:value,gain:gain,notes:notes.join(" "),warnings:warnings,fileName:filename||""});
 });
 return result;
}
function blank(name){return {ticker:"",name:"",category:"Ações",type:"",source:"",qty:0,price:null,value:null,gain:null,notes:"",warnings:["Confira e preencha os campos com base no print."],fileName:name||""};}
window.InvestmentImageImport={parseImageText:parseImageText,attach:function(api){
 var button=el("importImage"),input=el("imageFile"),modal=el("imageDlg");
 if(!button||!input||!modal)return;
 var preview=el("imagePreview"),list=el("imageCandidates"),status=el("imageStatus"),saveButton=el("saveImageImport"),rows=[],fileUrls=[],rawTexts=[],busy=false;
 function statusText(t){status.textContent=t;}
 function setBusy(v){
   busy=v;saveButton.disabled=v;el("closeImageImport").disabled=v;el("addImageManual").disabled=v;
 }
 function cleanup(){
   fileUrls.forEach(function(u){URL.revokeObjectURL(u);});fileUrls=[];rows=[];rawTexts=[];
   list.replaceChildren();preview.replaceChildren();el("ocrDetails").replaceChildren();statusText("");
 }
 function getMatches(ticker){return api.getPositions().filter(function(p){return String(p.ticker||"").toUpperCase()===String(ticker).toUpperCase();});}
 function numberField(i,key,title,v){
   return '<label>'+title+'<input data-row="'+i+'" data-field="'+key+'" inputmode="decimal" value="'+esc(v===null||v===undefined?"":String(v).replace(".",","))+'"></label>';
 }
 function textField(i,key,title,v){return '<label>'+title+'<input data-row="'+i+'" data-field="'+key+'" value="'+esc(v||"")+'"></label>';}
 function render(){
   list.innerHTML=rows.map(function(r,i){
     var matches=r.ticker?getMatches(r.ticker):[];
     var html='<article class="ocr-card"><div class="ocr-card-head"><strong>Ativo '+(i+1)+'</strong><span class="small muted">'+esc(r.fileName)+'</span></div>';
     html+='<div class="ocr-grid">'+textField(i,"ticker","Código / ticker",r.ticker)+textField(i,"name","Nome do investimento",r.name);
     html+='<label>Categoria<select data-row="'+i+'" data-field="category">'+["Ações","Fundos imobiliários","Renda fixa","Criptomoedas","Outros"].map(function(c){return '<option '+(c===r.category?"selected":"")+'>'+c+'</option>';}).join("")+'</select></label>';
     html+=textField(i,"source","Banco ou corretora",r.source);
     html+=numberField(i,"qty","Quantidade",r.qty);
     html+=numberField(i,"price","Preço unitário atual em R$ (opcional)",r.price);
     html+=numberField(i,"value","Valor total atual em R$ (obrigatório)",r.value);
     html+=numberField(i,"gain","Lucro/prejuízo em R$ (opcional)",r.gain)+'</div>';
     html+='<label class="ocr-full">Observações<input data-row="'+i+'" data-field="notes" maxlength="2000" value="'+esc(r.notes)+'"></label>';
     if(r.warnings.length)html+='<div class="ocr-warning">'+r.warnings.map(esc).join(" ")+'</div>';
     if(matches.length)html+='<p class="small" style="color:var(--gold)">Este código já existe na sua carteira. Por segurança, será ignorado até você escolher outra ação.</p>';
     html+='<label class="ocr-action">Ação<select data-row="'+i+'" data-field="action"><option value="skip" '+(matches.length?"selected":"")+'>Ignorar</option><option value="add" '+(!matches.length?"selected":"")+'>Adicionar como nova posição</option>'+(matches.length===1?'<option value="update">Atualizar posição existente</option>':"")+'</select></label></article>';
     return html;
   }).join("")||'<p class="muted">Nenhum investimento reconhecido. Adicione uma linha manualmente.</p>';
   el("ocrDetails").innerHTML=rawTexts.map(function(t){return '<details><summary>Texto extraído: '+esc(t.filename)+'</summary><pre>'+esc(t.text.slice(0,12000))+'</pre></details>';}).join("");
 }
 function values(i){
   var a={};["ticker","name","category","source","qty","price","value","gain","notes","action"].forEach(function(key){
      var field=list.querySelector('[data-row="'+i+'"][data-field="'+key+'"]');a[key]=field?field.value.trim():"";
   });
   a.ticker=a.ticker.toUpperCase();["qty","price","value","gain"].forEach(function(k){a[k]=br(a[k]);});
   a.type=rows[i].type||"";return a;
 }
 button.addEventListener("click",function(){if(!api.getUser()){alert("Entre na sua conta.");return;}input.click();});
 el("closeImageImport").addEventListener("click",function(){if(busy)return;modal.close();cleanup();});
 modal.addEventListener("cancel",function(e){if(busy){e.preventDefault();return;}cleanup();});
 el("addImageManual").addEventListener("click",function(){rows.push(blank("Preenchimento manual"));render();});
 saveButton.addEventListener("click",async function(){
   if(busy||!api.getUser())return;
   var chosen=rows.map(function(_,i){return values(i)}).filter(function(a){return a.action!=="skip";});
   if(!chosen.length){statusText("Escolha ao menos uma posição para adicionar ou atualizar.");return;}
   for(var i=0;i<chosen.length;i++){
     var a=chosen[i];
     if(!/^[A-Z0-9._-]{2,40}$/.test(a.ticker)){statusText("Corrija o código do ativo.");return;}
     if(a.value===null||a.value<0){statusText("Preencha o valor total em R$ de "+a.ticker+". Não copie USDT como R$.");return;}
     if((a.qty!==null&&a.qty<0)||(a.price!==null&&a.price<0)){statusText("Quantidade e preço não podem ser negativos.");return;}
     if(a.action==="update"&&getMatches(a.ticker).length!==1){statusText("Não é possível identificar a posição existente de "+a.ticker+".");return;}
   }
   if(!confirm("Salvar "+chosen.length+" investimento(s) revisado(s) na sua conta?"))return;
   setBusy(true);var success=0,errors=[],userId=api.getUser().id;
   for(var j=0;j<chosen.length;j++){
      var item=chosen[j],p={ticker:item.ticker,name:item.name||item.ticker,category:item.category,type:item.type||"",source:item.source||"",qty:item.qty===null?0:item.qty,price:item.price,value:item.value,gain:item.gain,notes:(item.notes||"").slice(0,2000)};
      try{
        if(!api.getUser()||api.getUser().id!==userId)throw Error("Sessão alterada.");
        var res;
        if(item.action==="update"){
          res=await api.db.from("investment_positions").update(p).eq("id",getMatches(item.ticker)[0].id).eq("user_id",userId).select("id").single();
        }else{
          res=await api.db.from("investment_positions").insert(Object.assign({user_id:userId},p)).select("id").single();
        }
        if(res.error)throw res.error;success++;
      }catch(err){errors.push(item.ticker+": "+(err.message||String(err)));}
   }
   try{await api.refresh();}catch(err){errors.push("Recarregar: "+err.message);}
   setBusy(false);
   if(!errors.length){modal.close();cleanup();alert(success+" investimento(s) salvo(s) no Supabase.");}
   else statusText(success+" salvos. Falhas: "+errors.join(" / ")+". Confira sua carteira antes de repetir a importação.");
 });
 function loadOCR(){
   if(window.Tesseract&&window.Tesseract.createWorker)return Promise.resolve();
   if(!window.__tesseractLoader){
     window.__tesseractLoader=new Promise(function(resolve,reject){
       var s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
       s.onload=function(){window.Tesseract&&window.Tesseract.createWorker?resolve():reject(Error("OCR indisponível."));};
       s.onerror=function(){reject(Error("Não foi possível carregar o leitor de imagens."));};document.head.appendChild(s);
     }).catch(function(err){window.__tesseractLoader=null;throw err;});
   }
   return window.__tesseractLoader;
 }
 input.addEventListener("change",async function(){
   var files=Array.from(input.files||[]);input.value="";if(!files.length||!api.getUser())return;
   if(files.length>5){alert("Envie até cinco imagens de cada vez.");return;}
   if(files.some(function(f){return !["image/png","image/jpeg","image/webp"].includes(f.type)||f.size>12*1024*1024;})){alert("Use imagens PNG, JPG ou WEBP de até 12 MB cada.");return;}
   cleanup();
   files.forEach(function(f){
     var u=URL.createObjectURL(f);fileUrls.push(u);
     var div=document.createElement("div");div.className="ocr-thumb";
     var img=document.createElement("img");img.src=u;img.alt="Foto para conferência";
     var cap=document.createElement("span");cap.textContent=f.name;div.append(img,cap);preview.appendChild(div);
   });
   modal.showModal();setBusy(true);statusText("Preparando leitura de imagens no seu dispositivo...");
   var worker=null,failed=false;
   try{
     await loadOCR();
     worker=await window.Tesseract.createWorker("por+eng",1,{logger:function(m){
       if(m&&m.status==="recognizing text"&&typeof m.progress==="number")statusText("Reconhecendo texto: "+Math.round(m.progress*100)+"%");
     }});
     for(var i=0;i<files.length;i++){
       statusText("Lendo imagem "+(i+1)+" de "+files.length+": "+files[i].name);
       var ocr=await worker.recognize(files[i]),text=ocr.data.text||"";
       rawTexts.push({filename:files[i].name,text:text});
       var found=parseImageText(text,files[i].name);
       rows.push.apply(rows,found.length?found:[blank(files[i].name)]);
       render();
     }
   }catch(err){
     failed=true;statusText("Não foi possível extrair texto: "+(err.message||String(err))+". Preencha os dados manualmente.");
     if(!rows.length)rows.push(blank(files[0].name));render();
   }finally{
     if(worker)try{await worker.terminate();}catch(err){}
     setBusy(false);if(!failed)statusText("Leitura concluída. Revise cada valor e selecione a ação antes de salvar.");
   }
 });
}};
})();