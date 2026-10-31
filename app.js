(function(){
"use strict";
var data=[], user=null, authMode="login", recoveryMode=false;
var PRODUCTION_URL="https://controle-financeiro-enjoy.vercel.app";
var sb=window.supabase&&window.supabase.createClient("https://szaguedaoveaeldtvxvb.supabase.co","sb_publishable_M3yKQEbu9pxkgNJaX7RZhw_Ybiv3LIk",{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});
if(!sb){document.getElementById("authMessage").textContent="Não foi possível carregar o serviço de autenticação. Verifique sua conexão e recarregue a página.";return}
var filters={category:"",type:"",source:"",search:""};
var palette={"Renda fixa":"#41d7ac","Ações":"#78aafc","Fundos imobiliários":"#f4bf70","Criptomoedas":"#ae92ff"};
var el=function(id){return document.getElementById(id)};
var money=function(v){return v==null||!isFinite(Number(v))?"—":new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v))};
var number=function(v){return new Intl.NumberFormat("pt-BR",{maximumFractionDigits:10}).format(Number(v)||0)};
var percent=function(v){return new Intl.NumberFormat("pt-BR",{style:"percent",maximumFractionDigits:1,minimumFractionDigits:1}).format(v||0)};
var escapeHTML=function(v){return String(v==null?"":v).replace(/[&<>"']/g,function(x){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]})};
var total=function(xs){return xs.reduce(function(sum,x){return sum+(Number(x.value)||0)},0)};
var selection=function(){return data.filter(function(x){return (!filters.category||x.category===filters.category)&&(!filters.type||x.type===filters.type)&&(!filters.source||x.source===filters.source)&&(!filters.search||(String(x.ticker)+" "+x.name+" "+x.source).toLowerCase().includes(filters.search.toLowerCase()))})};
async function loadPositions(){
 if(!user)return; var uid=user.id;
 var result=await sb.from("investment_positions").select("id,ticker,name,category,type,source,qty,price,value,gain,notes,purchase_price,dividends_received").eq("user_id",uid).order("created_at",{ascending:true});
 if(result.error)throw result.error;
 if(!user||user.id!==uid)return;
 data=result.data||[];render();if(window.MarketPanel)window.MarketPanel.refresh();
}
function notifyError(e){alert("Não foi possível concluir a operação. Verifique a conexão e tente novamente. Caso persista, contate o suporte.")}
async function refresh(){try{await loadPositions()}catch(e){notifyError(e)}}
function payload(a){if(!user)throw Error("Sessão encerrada");return Object.assign({user_id:user.id},SecurityUtils.validatePosition(a))}
function selectOptions(id){var vals=[...new Set(data.map(function(a){return a[id]}).filter(Boolean))].sort();el(id).innerHTML='<option value="">Todas</option>'+vals.map(function(v){return '<option value="'+escapeHTML(v)+'">'+escapeHTML(v)+'</option>'}).join("");el(id).value=filters[id]}
function render(){
["category","type","source"].forEach(selectOptions);el("search").value=filters.search;
var xs=selection(),sum=total(xs),known=xs.filter(function(a){return a.gain!==null&&a.gain!==undefined&&isFinite(Number(a.gain))}),g=known.reduce(function(n,a){return n+Number(a.gain)},0);
var cards=[["Patrimônio filtrado",money(sum),xs.length+" posições"],["Resultado conhecido",money(g),"Não inclui rendimentos não informados"],["Categorias",String(new Set(xs.map(function(x){return x.category})).size),"Classes de ativos"],["Resultados pendentes",String(xs.length-known.length),"Posições sem P/L"]];
el("kpis").innerHTML=cards.map(function(a){return '<div class="card"><div class="small muted">'+a[0]+'</div><div class="metric">'+a[1]+'</div><div class="small muted">'+a[2]+'</div></div>'}).join("");
var grouped={};xs.forEach(function(x){grouped[x.category]=(grouped[x.category]||0)+(Number(x.value)||0)});
var groups=Object.entries(grouped).sort(function(a,b){return b[1]-a[1]});
var start=0,stops=groups.map(function(a){var end=start+(sum?a[1]/sum*100:0),part=(palette[a[0]]||"#9faac2")+" "+start+"% "+end+"%";start=end;return part});
el("donut").style.background=stops.length?"conic-gradient("+stops.join(",")+")":"#2a3952";el("donutcenter").innerHTML="<div><strong>"+money(sum)+"</strong><div class='small muted'>Total filtrado</div></div>";
el("legend").innerHTML=groups.length?groups.map(function(a){return '<div class="leg" data-category="'+escapeHTML(a[0])+'"><span><span class="dot" style="background:'+(palette[a[0]]||"#9faac2")+'"></span>'+escapeHTML(a[0])+'</span><strong>'+percent(a[1]/sum)+'</strong></div>'}).join(""):'<div class="empty">Carteira vazia. Clique em + Adicionar para começar.</div>';
el("legend").querySelectorAll("[data-category]").forEach(function(n){n.onclick=function(){filters.category=filters.category===n.dataset.category?"":n.dataset.category;render()}});
var maximum=Math.max(1,...xs.map(function(a){return Number(a.value)||0}));
el("bars").innerHTML=xs.length?xs.slice().sort(function(a,b){return b.value-a.value}).map(function(a){return '<div class="bar" data-id="'+escapeHTML(a.id)+'"><div class="barline"><b>'+escapeHTML(a.ticker)+'</b><span>'+money(a.value)+" ("+percent(sum?a.value/sum:0)+')</span></div><div class="track"><div class="fill" style="width:'+Math.max(0,Number(a.value)||0)/maximum*100+'%;background:'+(palette[a.category]||"#9faac2")+'"></div></div></div>'}).join(""):'<div class="empty">Nenhuma posição cadastrada. Use + Adicionar para inserir o primeiro investimento.</div>';
el("gains").innerHTML=xs.length?xs.map(function(a){return '<div class="detail"><span>'+escapeHTML(a.ticker)+'</span><b style="color:'+(a.gain==null?"var(--muted)":Number(a.gain)<0?"var(--red)":"var(--teal)")+'">'+money(a.gain)+'</b></div>'}).join(""):'<div class="empty">Sem resultados informados.</div>';
var biggest=xs.slice().sort(function(a,b){return b.value-a.value})[0];
el("diagnostics").innerHTML='<div class="detail"><span>Ativos filtrados</span><b>'+xs.length+'</b></div><div class="detail"><span>Maior posição</span><b>'+(biggest?escapeHTML(biggest.ticker):"—")+'</b></div><div class="detail"><span>Concentração da maior posição</span><b>'+(biggest&&sum?percent(biggest.value/sum):"—")+'</b></div><div class="detail"><span>Criptomoedas no filtro</span><b>'+percent(sum?xs.filter(function(a){return a.category==="Criptomoedas"}).reduce(function(t,a){return t+a.value},0)/sum:0)+'</b></div>';
el("rows").innerHTML=xs.map(function(a){return '<tr data-id="'+escapeHTML(a.id)+'"><td><b>'+escapeHTML(a.ticker)+'</b><div class="small muted">'+escapeHTML(a.name)+'</div></td><td>'+escapeHTML(a.category)+'</td><td>'+escapeHTML(a.source)+'</td><td class="right">'+number(a.qty)+'</td><td class="right">'+money(a.value)+'</td><td class="right">'+money(a.gain)+'</td><td class="right">'+percent(sum?a.value/sum:0)+'</td></tr>'}).join("")||'<tr><td colspan="7" class="empty">Carteira vazia. Clique em + Adicionar para cadastrar seus investimentos.</td></tr>';
document.querySelectorAll("[data-id]").forEach(function(n){n.onclick=function(){detail(n.dataset.id)}});
}
function close(){el("dlg").close()}
function detail(id){var a=data.find(function(x){return x.id===id});if(!a)return;
el("dialogcontent").innerHTML='<h2>'+escapeHTML(a.ticker)+'</h2><div class="muted">'+escapeHTML(a.name)+'</div><h1>'+money(a.value)+'</h1>'+Object.entries({"Categoria":a.category,"Tipo":a.type,"Origem":a.source,"Quantidade":number(a.qty),"Preço de referência":money(a.price),"Resultado informado":money(a.gain),"Observações":a.notes||"—"}).map(function(x){return '<div class="detail"><span>'+x[0]+'</span><b>'+escapeHTML(x[1])+'</b></div>'}).join("")+'<div class="modalactions"><button id="close">Fechar</button><button class="primary" id="edit">Editar posição</button></div>';
el("dlg").showModal();el("close").onclick=close;el("edit").onclick=function(){close();edit(id)}}
function edit(id){if(!user)return;var old=data.find(function(x){return x.id===id})||{},fields=[["ticker","Código"],["name","Nome"],["category","Categoria"],["type","Tipo"],["source","Origem"],["qty","Quantidade"],["price","Preço de referência (R$)"],["value","Valor atual (R$)"],["gain","Resultado (R$)"],["notes","Observações"],["purchase_price","Preço médio de compra (R$)"],["dividends_received","Proventos recebidos (R$)"]];
el("dialogcontent").innerHTML='<h2>'+(id?"Editar investimento":"Adicionar investimento")+'</h2><form id="form"><div class="form">'+fields.map(function(f){var k=f[0];if(k==="category")return '<label>Categoria<select name="category" required><option value="">Selecione</option>'+["Renda fixa","Ações","Fundos imobiliários","Criptomoedas","Outros"].map(function(c){return '<option value="'+c+'" '+(old.category===c?"selected":"")+'>'+c+'</option>'}).join("")+'</select></label>';return '<label>'+f[1]+'<input name="'+k+'" value="'+escapeHTML(old[k]??"")+'" '+(["qty","price","value","gain","purchase_price","dividends_received"].includes(k)?'type="number" step="any" min="'+(k==="gain"?"-999999999999":"0")+'"':'type="text"')+' '+(["ticker","value"].includes(k)?"required":"")+'></label>'}).join("")+'</div><div class="modalactions"><button type="button" id="cancel">Cancelar</button>'+(id?'<button type="button" id="remove">Excluir</button>':"")+'<button class="primary" type="submit" id="positionSave">Salvar</button></div></form>';
el("dlg").showModal();el("cancel").onclick=close;
if(id)el("remove").onclick=async function(){if(!confirm("Excluir este investimento da sua conta?"))return;el("form").classList.add("busy");try{var res=await sb.from("investment_positions").delete().eq("id",id).eq("user_id",user.id);if(res.error)throw res.error;close();await loadPositions()}catch(e){notifyError(e)}finally{el("form").classList.remove("busy")}};
el("form").onsubmit=async function(e){e.preventDefault();var f=new FormData(e.target),o={};fields.forEach(function(z){var v=f.get(z[0]);o[z[0]]=["qty","price","value","gain","purchase_price","dividends_received"].includes(z[0])?(v===""?null:Number(v)):String(v||"")});if(!o.ticker||!Number.isFinite(o.value)||o.value<0||!o.category){alert("Informe código, categoria e valor válido.");return}
el("form").classList.add("busy");
try{var q=id?sb.from("investment_positions").update(payload(o)).eq("id",id).eq("user_id",user.id):sb.from("investment_positions").insert(payload(o));var res=await q;if(res.error)throw res.error;close();await loadPositions()}catch(err){notifyError(err)}finally{el("form").classList.remove("busy")}
}
}
function download(name,str,mime){var url=URL.createObjectURL(new Blob([str],{type:mime})),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(url)},1000)}
["category","type","source"].forEach(function(k){el(k).onchange=function(e){filters[k]=e.target.value;render()}});
el("search").oninput=function(e){filters.search=e.target.value;render();el("search").focus()};

if(window.MarketPanel)window.MarketPanel.attach({getUser:function(){return user},getPositions:function(){return data}});
el("add").onclick=function(){if(user)edit()};
function toggleMoreMenu(open){
 el("moreMenu").hidden=!open;
 el("moreToggle").setAttribute("aria-expanded",String(open));
}
el("moreToggle").onclick=function(){toggleMoreMenu(el("moreMenu").hidden)};
document.addEventListener("click",function(ev){if(!el("moreWrapper").contains(ev.target))toggleMoreMenu(false)});
document.addEventListener("keydown",function(ev){if(ev.key==="Escape"&&!el("moreMenu").hidden){toggleMoreMenu(false);el("moreToggle").focus()}});
el("moreMenu").addEventListener("click",function(ev){if(ev.target.closest("button"))toggleMoreMenu(false)});
el("settings").onclick=function(){
 if(!user)return;
 el("settingsAccount").textContent=user.email||"Conta autenticada";
 el("settingsCount").textContent=data.length+" posição(ões) cadastrada(s) serão excluídas.";
 el("resetConfirmation").value="";
 el("settingsStatus").textContent="";
 el("reset").disabled=true;
 el("settingsDlg").showModal();
};
el("settingsClose").onclick=function(){el("settingsDlg").close()};
el("resetConfirmation").oninput=function(){
 el("reset").disabled=el("resetConfirmation").value!=="ZERAR";
 el("settingsStatus").textContent="";
};
el("logout").onclick=async function(){var r=await sb.auth.signOut();if(r.error)notifyError(r.error);else{user=null;data=[];if(window.MarketPanel)window.MarketPanel.clear();showAuth()}};
el("reset").onclick=async function(){
 if(!user||!el("settingsDlg").open||el("resetConfirmation").value!=="ZERAR")return;
 if(!data.length){el("settingsStatus").textContent="Sua carteira já está vazia.";return;}
 if(!confirm("CONFIRMAÇÃO FINAL: excluir permanentemente TODAS as posições desta conta? Essa operação não pode ser desfeita."))return;
 var uid=user.id;
 el("reset").disabled=true;
 el("settingsClose").disabled=true;
 el("settingsStatus").textContent="Excluindo investimentos...";
 try{
   var res=await sb.from("investment_positions").delete().eq("user_id",uid).select("id");
   if(res.error)throw res.error;
   if(!user||user.id!==uid)throw Error("A sessão mudou durante a operação.");
   filters={category:"",type:"",source:"",search:""};
   await loadPositions();
   el("settingsDlg").close();
   el("resetConfirmation").value="";
   alert("Carteira zerada no Supabase.");
 }catch(err){
   el("settingsStatus").textContent="Falha ao excluir: "+(err.message||String(err))+". Confira os investimentos antes de tentar novamente.";
   try{await loadPositions()}catch(_){}
 }finally{
   el("settingsClose").disabled=false;
   el("reset").disabled=el("resetConfirmation").value!=="ZERAR";
 }
};
el("backup").onclick=function(){download("backup_investimentos.json",JSON.stringify({version:2,exportedAt:new Date().toISOString(),assets:data},null,2),"application/json")};
el("csv").onclick=function(){
 var keys=["ticker","name","category","type","source","qty","purchase_price","price","value","gain","dividends_received","notes"];
 var numericColumns=["qty","purchase_price","price","value","gain","dividends_received"];
 var rows=selection().map(function(a){return keys.map(function(k){return SecurityUtils.safeCsvCell(a[k],!numericColumns.includes(k))}).join(";")});
 download("carteira.csv","\ufeff"+keys.join(";")+"\r\n"+rows.join("\r\n"),"text/csv;charset=utf-8");
};
el("import").onclick=function(){if(user)el("file").click()};
el("file").onchange=async function(e){
 var f=e.target.files[0];if(!f||!user)return;
 try{
   if(f.size>SecurityUtils.MAX_FILE_BYTES)throw Error("Backup muito grande. Limite: 1 MB.");
   var records=SecurityUtils.parseBackupObject(JSON.parse(await f.text()));
   var identity=function(a){return a.ticker.toUpperCase()+"|"+(a.source||"").trim().toLowerCase()};
   var already=new Set(data.map(identity));
   var accepted=[],skipped=0;
   records.forEach(function(a){
     var key=identity(a);
     if(already.has(key)){skipped++;return}
     already.add(key);accepted.push(a);
   });
   if(!accepted.length){alert("Nenhuma posição nova: os investimentos já aparecem na carteira. Nenhum dado foi alterado.");return}
   var summary="Serão adicionados "+accepted.length+" investimentos.";
   if(skipped)summary+="\n"+skipped+" possível(is) duplicata(s) com mesmo ticker e instituição serão ignoradas.";
   summary+="\nPosições já cadastradas não serão alteradas. Confirma?";
   if(!confirm(summary))return;
   var completed=0;
   for(var i=0;i<accepted.length;i+=50){
     if(!user)throw Error("Sessão encerrada");
     var items=accepted.slice(i,i+50).map(payload);
     var res=await sb.from("investment_positions").insert(items);
     if(res.error)throw res.error;
     completed+=items.length;
   }
   await loadPositions();
   alert(completed+" investimento(s) importado(s) com sucesso. "+skipped+" duplicata(s) ignorada(s).");
 }catch(err){
   // Mensagens de validação local são controladas pelo próprio aplicativo.
   if(err&&typeof err.message==="string"&&/^(Backup muito grande|O arquivo JSON|O backup|Importe no máximo|Campo|Valor ausente|Número|Código de ativo|Categoria não reconhecida|Posição inválida)/.test(err.message))alert(err.message);
   else notifyError(err);
 }finally{e.target.value=""}
};
if(window.InvestmentImageImport){window.InvestmentImageImport.attach({
  db:sb,
  getUser:function(){return user;},
  getPositions:function(){return data;},
  refresh:loadPositions
});}
function authMessage(msg){el("authMessage").textContent=msg||""}
function showAuth(){el("appScreen").hidden=true;el("authScreen").hidden=false;el("authPass").value="";authMessage("");setMode("login")}
function showApp(){el("authScreen").hidden=true;el("appScreen").hidden=false;el("userEmail").textContent=user.email||"Minha conta";render()}
function setMode(mode){authMode=mode;el("nameLabel").style.display=mode==="signup"?"block":"none";el("authName").required=mode==="signup";el("emailLabel").style.display=mode==="newpassword"?"none":"block";el("authEmail").required=mode!=="newpassword";el("passLabel").style.display=mode==="reset"?"none":"block";el("authPass").required=mode!=="reset";el("authPass").autocomplete=(mode==="signup"||mode==="newpassword")?"new-password":"current-password";el("authPass").minLength=(mode==="signup"||mode==="newpassword")?10:1;el("authSubmit").textContent=mode==="signup"?"Criar minha conta":mode==="reset"?"Enviar recuperação":mode==="newpassword"?"Salvar nova senha":"Entrar";authMessage("")}
el("modeLogin").onclick=function(){setMode("login")};el("modeSignup").onclick=function(){setMode("signup")};el("modeReset").onclick=function(){setMode("reset")};
el("resendConfirmation").onclick=async function(){
 var email=el("authEmail").value.trim();
 if(!email){authMessage("Preencha seu e-mail antes de reenviar a confirmação.");el("authEmail").focus();return;}
 el("resendConfirmation").disabled=true;
 authMessage("Solicitando novo link de confirmação...");
 try{
   var r=await sb.auth.resend({type:"signup",email:email,options:{emailRedirectTo:PRODUCTION_URL}});
   if(r.error)throw r.error;
   authMessage("Se o cadastro estiver aguardando confirmação, um novo e-mail será enviado. Verifique também a caixa de spam.");
 }catch(err){authMessage(err.message||"Não foi possível reenviar a confirmação agora.");}
 finally{el("resendConfirmation").disabled=false;}
};
el("authForm").onsubmit=async function(e){e.preventDefault();var email=el("authEmail").value.trim(),password=el("authPass").value,button=el("authSubmit");button.disabled=true;authMessage("");
try{
 if(authMode==="newpassword"){if(password.length<10)throw Error("Use ao menos 10 caracteres na nova senha.");var updated=await sb.auth.updateUser({password:password});if(updated.error)throw updated.error;recoveryMode=false;await sb.auth.signOut();showAuth();authMessage("Senha atualizada. Entre com sua nova senha.");}
 else if(authMode==="signup"){if(password.length<10)throw Error("Use ao menos 10 caracteres para criar a senha.");var opts={emailRedirectTo:PRODUCTION_URL, data:{display_name:el("authName").value.trim()}};var r=await sb.auth.signUp({email,password,options:opts});if(r.error)throw r.error;authMessage(r.data.session?"Conta criada!":"Cadastro recebido. Verifique seu e-mail para confirmar a conta. Se o link anterior falhou, corrija os redirecionamentos no Supabase e clique em Reenviar confirmação.");}
 else if(authMode==="reset"){var r=await sb.auth.resetPasswordForEmail(email,{redirectTo:PRODUCTION_URL});if(r.error)throw r.error;authMessage("Se o e-mail estiver cadastrado, você receberá instruções para recuperar a senha.");}
 else{var r=await sb.auth.signInWithPassword({email,password});if(r.error)throw r.error;}
}catch(err){authMessage((err&&/Use ao menos 10 caracteres/.test(err.message||""))?err.message:(authMode==="login"?"Não foi possível entrar. Confira suas credenciais ou confirme seu e-mail.":"Não foi possível concluir esta solicitação agora. Confira os dados e tente novamente."))}finally{button.disabled=false}};
async function sessionUpdate(nextUser){if(recoveryMode)return;if((user&&nextUser&&user.id===nextUser.id)||(!user&&!nextUser))return;user=nextUser;data=[];if(!user){showAuth();return}showApp();try{var profile=await sb.from("investment_profiles").upsert({user_id:user.id,display_name:String(user.user_metadata&&user.user_metadata.display_name||"").slice(0,120)},{onConflict:"user_id",ignoreDuplicates:true});if(profile.error)throw profile.error;await loadPositions()}catch(err){notifyError(err)}}
sb.auth.onAuthStateChange(function(event,session){if(event==="PASSWORD_RECOVERY"){recoveryMode=true;user=null;data=[];el("appScreen").hidden=true;el("authScreen").hidden=false;setMode("newpassword");authMessage("Escolha sua nova senha para concluir a recuperação.");return}setTimeout(function(){sessionUpdate(session&&session.user||null)},0)});
(async function(){try{var r=await sb.auth.getUser();if(r.error&&r.error.name!=="AuthSessionMissingError")throw r.error;await sessionUpdate(r.data.user||null)}catch(err){showAuth();authMessage(err.message||"Falha ao carregar sessão.")}})();

})();
