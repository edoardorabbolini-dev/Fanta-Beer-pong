var NAMES=[["Giovanni DS","Mattia Lauro"],["Moreno Melone","Davide Germini"],["Michele D.B","Patrizio De Remigis"],["Diego Flocco","Patrizio Celiberti"],["Aurora Marchionni","Francesca Vaccaro"],["Pietro Evangelista","Matteo Cofini"],["Enrico Iasiello","Mattia Villani"],["Alessandra de Propris","Laura Orangi"],["Edoardo Rabbolini","Gaia Denise Casilli"],["Denisa Chiriac","Francesco Griffo"],["Lorenzo Fiocchetta","Alfredo Valli"],["Davide De Tiberis","Lorenzo Corsi"],["Federico Galardini","Alessandro Petrolo"],["Gabriele Mazzetti","Sofia Balboni"],["Arianna Rojas","Anna Paola Di Simone"],["Michael Battistini","Tatiana Caruso"],["Lisa Di Gabriele","Sara Frangione"],["Luca","Cristiano"],["Silvia Broccolini","Tommaso Reale"]];
var START=100, DB=null, TEAMS=NAMES.map(function(n,i){return{id:i,a:n[0],b:n[1]}});
var B=[], M=[], BT=[], CH=null, got={b:0,m:0,t:0,c:0};
var tab="match", sheet=null, resetArm=false, msg="", fa="", fb="", status="Connessione…";

function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function T(id){return TEAMS[id]}
function tn(id){var t=T(id);return"<b>"+esc(t.a)+"</b><span class='m'>"+esc(t.b)+"</span>"}
function short(id){var t=T(id);return esc(t.a.split(" ")[0]+" & "+t.b.split(" ")[0])}
function U(id){return B.filter(function(x){return x.id===id})[0]}
function findM(id){return M.filter(function(x){return x.id===id})[0]}
function fail(e){msg="Non riesco a salvare ("+(e&&e.code?e.code:"errore")+"). Serve l’accesso come Contributor al link e la connessione attiva.";render()}
function run(p){try{return p.catch(fail)}catch(e){fail(e)}}

function ratings(){var r=TEAMS.map(function(){return 1000});M.filter(function(m){return m.w!=null}).sort(function(a,b){return(a.wts||0)-(b.wts||0)}).forEach(function(m){var w=m.w,l=w===m.a?m.b:m.a;var pw=1/(1+Math.pow(10,(r[l]-r[w])/400));r[w]+=32*(1-pw);r[l]-=32*(1-pw)});return r}
function eliminated(){var o=[];M.forEach(function(m){if(m.w!=null)o.push(m.w===m.a?m.b:m.a)});return o}
function alive(){if(CH!=null)return[CH];var el=eliminated();return TEAMS.map(function(t){return t.id}).filter(function(i){return el.indexOf(i)<0})}
function busy(id){return M.some(function(m){return m.w==null&&(m.a===id||m.b===id)})}
function odds(a,b){var R=ratings();var p=1/(1+Math.pow(10,(R[b]-R[a])/400));return Math.max(1.05,Math.round(0.93/p*100)/100)}
function outOdds(id){var al=alive();if(al.indexOf(id)<0)return null;var R=ratings();var s=al.reduce(function(x,i){return x+Math.pow(10,R[i]/400)},0);var p=Math.pow(10,R[id]/400)/s;return Math.max(1.05,Math.round(0.9/p*100)/100)}
function bst(b){if(b.type==="m"){var m=findM(b.mid);if(!m)return"void";if(m.w==null)return"open";return m.w===b.team?"won":"lost"}
 if(CH!=null)return CH===b.team?"won":"lost";return eliminated().indexOf(b.team)>=0?"lost":"open"}
function bal(uid){var t=START;BT.forEach(function(b){if(b.u!==uid)return;var s=bst(b);if(s==="won")t+=Math.round(b.stake*b.odds)-b.stake;else if(s==="open"||s==="lost")t-=b.stake});return t}

function newMatch(){if(fa===""||fb===""){msg="Scegli le due squadre.";render();return}
 var a=+fa,b=+fb;if(a===b){msg="Scegli due squadre diverse.";render();return}
 if(busy(a)||busy(b)){msg="Una delle due squadre sta già giocando una partita.";render();return}
 fa="";fb="";msg="";run(DB.collection("matches").doc().set({a:a,b:b,w:null,ts:Date.now()}))}
function cancelMatch(mid){BT.filter(function(b){return b.type==="m"&&b.mid===mid}).forEach(function(b){run(DB.doc("bets/"+b.id).delete())});run(DB.doc("matches/"+mid).delete())}
function setWinner(mid,w){var m=findM(mid);if(!m||m.w!=null)return;run(DB.doc("matches/"+mid).update({w:w,wts:Date.now()}))}
function setChamp(id){if(CH!=null)return;run(DB.doc("meta/state").set({champ:id}))}

function openSheet(type,mid,team){if(!B.length){msg="Aggiungi prima almeno uno scommettitore in Setup.";tab="setup";render();return}
 var o;if(type==="m"){var m=findM(mid);o=odds(team,team===m.a?m.b:m.a)}else o=outOdds(team);
 sheet={type:type,mid:mid,team:team,odds:o,stake:10,u:B[0].id};drawSheet()}
function drawSheet(){var s=sheet;var el=document.getElementById("sheet"),in_=document.getElementById("sheetin");
 if(!s){el.classList.remove("open");return}
 var bl=bal(s.u);
 in_.innerHTML="<h2 style='margin:0'>"+(s.type==="o"?"Vincitore del torneo":"Vincitore partita")+"</h2><div>"+tn(s.team)+"</div>"+
 "<select id='su' onchange='sheet.u=this.value;drawSheet()'>"+B.map(function(b){return"<option value='"+b.id+"'"+(b.id===s.u?" selected":"")+">"+esc(b.name)+" — "+bal(b.id)+" gettoni</option>"}).join("")+"</select>"+
 "<input id='ss' type='number' inputmode='numeric' min='1' value='"+s.stake+"' oninput='sheet.stake=Math.floor(+this.value)||0;upd()'>"+
 "<div class='chips'>"+[10,25,50].map(function(v){return"<button onclick='sheet.stake="+v+";drawSheet()'>"+v+"</button>"}).join("")+"<button onclick='sheet.stake="+bl+";drawSheet()'>Tutto</button></div>"+
 "<div class='row'><span>Quota <b>"+s.odds.toFixed(2)+"</b></span><span class='fit big' id='pot'></span></div>"+
 "<div class='row'><button class='ghost' onclick='sheet=null;drawSheet()'>Annulla</button><button class='pri' id='go' onclick='placeBet()'>Scommetti</button></div>";
 el.classList.add("open");upd()}
function upd(){var s=sheet;var pot=document.getElementById("pot"),go=document.getElementById("go");
 pot.textContent="Vinci "+Math.round(s.stake*s.odds);go.disabled=!(s.stake>0&&s.stake<=bal(s.u))}
function placeBet(){var s=sheet;if(!(s.stake>0&&s.stake<=bal(s.u)))return;
 var d={u:s.u,type:s.type,mid:s.mid||"",team:s.team,stake:s.stake,odds:s.odds,ts:Date.now()};sheet=null;drawSheet();run(DB.collection("bets").doc().set(d))}

function addBettor(){var i=document.getElementById("nb");var n=i.value.trim();if(!n)return;i.value="";msg="";run(DB.collection("bettors").doc().set({name:n,ts:Date.now()}))}
function delBettor(id){BT.filter(function(b){return b.u===id}).forEach(function(b){run(DB.doc("bets/"+b.id).delete())});run(DB.doc("bettors/"+id).delete())}
function doReset(){if(!resetArm){resetArm=true;render();return}resetArm=false;M.forEach(function(m){run(DB.doc("matches/"+m.id).delete())});BT.forEach(function(b){run(DB.doc("bets/"+b.id).delete())});run(DB.doc("meta/state").set({champ:null}));tab="setup"}

function matchCard(m){var done=m.w!=null;
 function side(id){var sp=done?(m.w===id?" win":" out"):"";var o=odds(id,id===m.a?m.b:m.a);return"<div class='side"+sp+"'><div>"+tn(id)+"</div>"+(done?(m.w===id?"<span class='tag w'>Vince</span>":"<span class='tag'>Fuori</span>"):"<button class='bet' onclick='openSheet(\"m\",\""+m.id+"\","+id+")'>"+o.toFixed(2)+"</button><button class='win-b' onclick='setWinner(\""+m.id+"\","+id+")'>Ha vinto</button>")+"</div>"}
 return"<div class='card'><div class='match'>"+side(m.a)+"<span class='vs'>VS</span>"+side(m.b)+"</div>"+(done?"":"<button class='ghost' style='margin-top:10px;min-height:36px;padding:6px 10px;width:100%' onclick='cancelMatch(\""+m.id+"\")'>Annulla partita e rimborsa</button>")+"</div>"}

function opts(sel){return"<option value=''>Scegli squadra</option>"+alive().map(function(i){return"<option value='"+i+"'"+(String(sel)===String(i)?" selected":"")+">"+short(i)+"</option>"}).join("")}
function vMatch(){var h="";
 if(CH!=null)h+="<div class='card champ'><div>🏆 Campioni</div><div class='big' style='margin-top:6px'>"+short(CH)+"</div></div>";
 else h+="<h2>Nuova partita</h2><div class='card'><div class='row'><select onchange='fa=this.value'>"+opts(fa)+"</select><span class='fit vs'>VS</span><select onchange='fb=this.value'>"+opts(fb)+"</select></div><button class='pri' style='width:100%;margin-top:10px' onclick='newMatch()'>Crea partita</button></div>";
 var pend=M.filter(function(m){return m.w==null}).reverse(),dn=M.filter(function(m){return m.w!=null}).reverse();
 h+="<h2>In corso</h2>";if(!pend.length)h+="<div class='empty'>Nessuna partita aperta. Creane una qui sopra.</div>";pend.forEach(function(m){h+=matchCard(m)});
 if(dn.length){h+="<h2>Giocate</h2>";dn.forEach(function(m){h+=matchCard(m)})}
 return h+"<p class='sub'>Tocca la quota gialla per scommettere. “Ha vinto” chiude la partita e paga le scommesse.</p>"}

function vOut(){var h="<h2>Chi vince il torneo?</h2><p class='sub'>Quote sul vincitore finale, aggiornate dopo ogni partita. Chi perde una partita è fuori.</p>";
 if(CH!=null)h+="<div class='card champ'><div>🏆</div><div class='big'>"+short(CH)+"</div></div>";
 var ids=TEAMS.map(function(t){return t.id}).sort(function(a,b){var oa=outOdds(a),ob=outOdds(b);return(oa===null)-(ob===null)||(oa||0)-(ob||0)});
 ids.forEach(function(id){var o=outOdds(id);h+="<div class='card row"+(o===null?" out":"")+"'><div>"+tn(id)+"</div>"+(o===null?"<span class='fit tag'>"+(CH===id?"Campioni":"Fuori")+"</span>":"<div class='fit' style='display:flex;flex-direction:column;gap:6px'><button class='bet' style='min-width:74px' onclick='openSheet(\"o\",\"\","+id+")'>"+o.toFixed(2)+"</button><button class='win-b' onclick='setChamp("+id+")'>Campioni</button></div>")+"</div>"});return h}

function bLabel(b){return b.type==="o"?"Vincitore torneo: "+short(b.team):"Partita: "+short(b.team)}
function vRank(){var h="<h2>Classifica</h2>";if(!B.length)return h+"<div class='empty'>Nessuno scommettitore. Aggiungili in Setup.</div>";
 var us=B.slice().sort(function(a,b){return bal(b.id)-bal(a.id)});h+="<div class='card'>";
 us.forEach(function(u,i){h+="<div class='lb'><span>"+(i===0?"🥇 ":i===1?"🥈 ":i===2?"🥉 ":"")+esc(u.name)+"</span><span class='big'>"+bal(u.id)+"</span></div>"});h+="</div><h2>Schedine</h2>";
 if(!BT.length)return h+"<div class='empty'>Ancora nessuna scommessa.</div>";
 BT.slice().reverse().forEach(function(b){var u=U(b.u),s=bst(b);h+="<div class='card row'><div><b>"+esc(u?u.name:"?")+"</b><div class='m'>"+bLabel(b)+"<br>"+b.stake+" × "+b.odds.toFixed(2)+"</div></div><span class='fit tag "+(s==="won"?"w":s==="lost"?"l":"")+"'>"+(s==="won"?"+"+Math.round(b.stake*b.odds):s==="lost"?"Persa":s==="void"?"Rimborsata":"Aperta")+"</span></div>"});return h}

function vSetup(){var h="<h2>Scommettitori</h2><p class='sub'>Ognuno parte con "+START+" gettoni. Chi aggiunge un nome lo vede comparire su tutti i dispositivi.</p><div class='row'><input id='nb' placeholder='Nome' onkeydown='if(event.key===\"Enter\")addBettor()'><button class='pri fit' onclick='addBettor()'>Aggiungi</button></div>";
 B.forEach(function(u){h+="<div class='lb'><span>"+esc(u.name)+" · "+bal(u.id)+"</span><button class='ghost fit' style='min-height:36px;padding:6px 10px' onclick='delBettor(\""+u.id+"\")'>Togli</button></div>"});
 h+="<h2>Torneo</h2><button class='ghost' style='width:100%' onclick='doReset()'>"+(resetArm?"Tocca ancora per confermare":"Azzera partite e scommesse")+"</button><p class='sub'>Cancella partite e scommesse per tutti e rimette tutti a "+START+" gettoni. Gli scommettitori restano.</p>";
 h+="<h2>Squadre ("+TEAMS.length+")</h2>";TEAMS.forEach(function(t){h+="<div class='lb'><span>"+tn(t.id)+"</span></div>"});
 return h}

var TABS=[["match","Partite"],["out","Vincitore"],["rank","Classifica"],["setup","Setup"]];
function render(){var nb=document.getElementById("nb"),keep=nb?nb.value:"";
 document.getElementById("nav").innerHTML=TABS.map(function(t){return"<button class='"+(tab===t[0]?"on":"")+"' onclick='tab=\""+t[0]+"\";msg=\"\";resetArm=false;render();window.scrollTo(0,0)'>"+t[1]+"</button>"}).join("");
 var top="";if(status)top+="<div class='sub'>"+esc(status)+"</div>";if(msg)top+="<div class='card' style='border-color:var(--cup)'>"+esc(msg)+"</div>";
 document.getElementById("main").innerHTML=top+(tab==="match"?vMatch():tab==="out"?vOut():tab==="rank"?vRank():vSetup());
 var n2=document.getElementById("nb");if(n2&&keep)n2.value=keep;
 if(sheet&&document.getElementById("sheet").classList.contains("open")&&!document.activeElement.matches("#ss"))upd()}

function docs(s){return s.docs.map(function(d){var x=d.data();x.id=d.id;return x})}
function ready(k){got[k]=1;if(got.b&&got.m&&got.t&&got.c){status="";clearTimeout(tm)}}
var tm=setTimeout(function(){if(DB&&status){status="Dati non raggiungibili per ora: potrebbero non essere aggiornati."}else if(!DB){status="Database non configurato o non raggiungibile."}render()},10000);
function onErr(e){status="Errore di sincronizzazione ("+(e&&e.code?e.code:"?")+")";render()}
render();
function initDb(){try{if(typeof firebase==="undefined"||String(FIREBASE_CONFIG.apiKey).indexOf("INCOLLA")===0)return null;firebase.initializeApp(FIREBASE_CONFIG);return firebase.firestore()}catch(e){return null}}
Promise.resolve(initDb()).then(function(db){if(!db){status="Database non configurato: incolla i dati Firebase in FIREBASE_CONFIG.";render();return}DB=db;
 db.collection("bettors").onSnapshot(function(s){B=docs(s).sort(function(a,b){return(a.ts||0)-(b.ts||0)});ready("b");render()},onErr);
 db.collection("matches").onSnapshot(function(s){M=docs(s).sort(function(a,b){return(a.ts||0)-(b.ts||0)});ready("m");render()},onErr);
 db.collection("bets").onSnapshot(function(s){BT=docs(s).sort(function(a,b){return(a.ts||0)-(b.ts||0)});ready("t");render()},onErr);
 db.doc("meta/state").onSnapshot(function(s){var d=s.exists?s.data():null;CH=d&&d.champ!=null?d.champ:null;ready("c");render()},onErr)});
