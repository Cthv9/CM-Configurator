
let catalog=null, engine=null;
let skuMap=new Map();

const state={
  base:null,
  cable:null,
  male:null,
  female:null,
  hawse:null,
  container:null,
  trace:[]
};

function $(id){return document.getElementById(id);}

function setStatus(msg, kind="info"){
  const el=$("status");
  el.textContent=msg||"";
  el.style.color = (kind==="ok") ? "var(--ok)" : (kind==="warn") ? "var(--warn)" : (kind==="bad") ? "var(--bad)" : "var(--muted)";
}

async function loadData(){
  const [cat, eng] = await Promise.all([
    fetch("./data/catalog.json").then(r=>r.json()),
    fetch("./data/engine.json").then(r=>r.json())
  ]);
  catalog=cat; engine=eng;
  skuMap=new Map((catalog.items||[]).map(it=>[it.sku, it]));
}

function goStep(n){
  document.querySelectorAll(".step").forEach(b=>b.classList.toggle("active", b.dataset.step===String(n)));
  document.querySelectorAll(".pane").forEach(p=>p.classList.toggle("active", p.dataset.pane===String(n)));
}

function card(item, selectedSku, onClick, extraMeta=""){
  const div=document.createElement("div");
  div.className="cardpick" + (selectedSku===item.sku ? " selected":"");
  div.addEventListener("click", ()=>onClick(item));
  const title=document.createElement("div");
  title.className="title";
  title.textContent=item.sku;
  const badge=document.createElement("span");
  badge.className="badge primary";
  badge.textContent="PRIMARY";
  title.appendChild(badge);
  const meta=document.createElement("div");
  meta.className="meta";
  meta.textContent=(item.name||item.description||"") + (extraMeta?(" • "+extraMeta):"");
  div.appendChild(title);
  div.appendChild(meta);
  return div;
}

function filterBase(){
  // show unique families as choice (CRM, CM4, CM7, CM8, CM9)
  const families=["CRM","CM4","CM7","CM8","CM9"];
  const out=[];
  for(const f of families){
    // pick one representative base item sku from catalog or create virtual
    let rep=(catalog.items||[]).find(it=>it.category==="base" && it.family===f);
    if(!rep){
      rep={sku:f, name:`Famiglia ${f}`, family:f, category:"base", virtual:true};
    }
    out.push(rep);
  }
  return out;
}

function allowedCableForFamily(fam, cable){
  const cfg=engine.families[fam];
  if(!cfg) return true;
  if(cable.amps && cfg.amps_max && cable.amps>cfg.amps_max) return false;
  // If family CM4, avoid >32A; etc already.
  return cable.category==="cable";
}

function filterCables(){
  const fam=state.base?.family || state.base?.sku;
  const q=($("cableSearch").value||"").toLowerCase();
  const len=Number($("cableLen").value||0);
  let list=(catalog.items||[]).filter(it=>it.category==="cable");
  list=list.filter(c=>allowedCableForFamily(fam,c));
  if(len) list=list.filter(c=>Number(c.length_m||0)===len);
  if(q) list=list.filter(c=>(c.name||"").toLowerCase().includes(q) || (c.sku||"").toLowerCase().includes(q));
  // Sort by amps then length
  list.sort((a,b)=> (a.amps||0)-(b.amps||0) || (a.length_m||0)-(b.length_m||0) || a.sku.localeCompare(b.sku));
  return list.slice(0,120);
}

function cableKey(c){
  // derive desired connector poles from conductors if present
  const cond=c.conductors;
  if(cond===3) return {poles:"2P+T"};
  if(cond===4) return {poles:"3P+T"};
  if(cond===5) return {poles:"3P+T+N"};
  return {poles:null};
}

function filterConnectors(gender){
  const c=state.cable;
  const q=((gender==="male"?$("maleSearch").value:$("femaleSearch").value)||"").toLowerCase();
  let list=(catalog.items||[]).filter(it=>it.category==="connector" && it.connector_gender===gender);
  if(c?.amps) list=list.filter(x=>(x.amps||0)===c.amps || (x.amps||0)>=c.amps); // allow same or higher
  const k=c?cableKey(c):{poles:null};
  if(k.poles) list=list.filter(x=>!x.poles || x.poles===k.poles);
  if(q) list=list.filter(x=>(x.name||"").toLowerCase().includes(q) || x.sku.toLowerCase().includes(q));
  list.sort((a,b)=>(a.amps||0)-(b.amps||0) || a.sku.localeCompare(b.sku));
  return list.slice(0,120);
}

function filterHawse(){
  const fam=state.base?.family || state.base?.sku;
  const amps=state.cable?.amps;
  let list=(catalog.items||[]).filter(it=>it.category==="hawse_pipe");
  if(fam && fam!=="CRM") list=list.filter(h=>!h.family || h.family===fam || h.family==="CM"+fam.replace("CM",""));
  if(fam==="CRM") list=list.filter(h=>!h.family || h.family==="CRM");
  if(amps) list=list.filter(h=>!h.amps_max || h.amps_max>=amps);
  // add defaults if missing
  list.sort((a,b)=>(a.amps_max||999)-(b.amps_max||999) || a.sku.localeCompare(b.sku));
  return list.slice(0,80);
}

function filterContainers(){
  const fam=state.base?.family || state.base?.sku;
  const L=state.cable?.length_m || 0;
  let list=(catalog.items||[]).filter(it=>it.category==="container");
  if(fam && fam.startsWith("CM")) list=list.filter(x=>!x.family || x.family===fam);
  // simple heuristic: for longer cables, allow larger containers too
  if(L>=30){
    // keep all compatible and also CM9 container
    list=list.filter(x=>true);
  }
  list.sort((a,b)=>a.sku.localeCompare(b.sku));
  return list.slice(0,80);
}

function renderPicklist(elId, items, selectedSku, onPick, metaFn){
  const el=$(elId);
  el.innerHTML="";
  if(!items.length){
    el.innerHTML = `<div class="muted">Nessuna opzione trovata.</div>`;
    return;
  }
  for(const it of items){
    const extra = metaFn ? metaFn(it) : "";
    el.appendChild(card(it, selectedSku, onPick, extra));
  }
}

function addTrace(msg){ state.trace.push(msg); }

function renderTrace(){
  const ul=$("trace"); ul.innerHTML="";
  state.trace.forEach(t=>{ const li=document.createElement("li"); li.textContent=t; ul.appendChild(li); });
}

function buildBOM(){
  const lines=[];
  state.trace=[];
  // base item: if virtual, try pick a default sku matching family and 24V maybe?
  if(state.base){
    if(!state.base.virtual){
      lines.push({sku:state.base.sku, desc:state.base.name, qty:1, source:"PRIMARY"});
      addTrace(`Base: selezionato ${state.base.family||state.base.sku} (${state.base.sku}).`);
    }else{
      addTrace(`Base: selezionata famiglia ${state.base.sku} (nessun SKU specifico in anagrafica).`);
    }
  }
  if(state.cable){
    let note = state.cable.length_m ? `${state.cable.length_m}m` : "";
    lines.push({sku:state.cable.sku, desc:state.cable.name, qty:1, source:"PRIMARY", note});
    addTrace(`Cavo: ${state.cable.amps||"?"}A, conduttori ${state.cable.conductors||"?"}, lunghezza ${state.cable.length_m||"?"}m.`);
  }
  if(state.male){
    lines.push({sku:state.male.sku, desc:state.male.name, qty:1, source:"PRIMARY"});
    addTrace(`Spina (maschio): filtrata su cavo → scelta ${state.male.sku}.`);
  }else{
    addTrace("Spina (maschio): non selezionata (se necessaria, scegliere un'opzione).");
  }
  if(state.female){
    lines.push({sku:state.female.sku, desc:state.female.name, qty:1, source:"PRIMARY"});
    addTrace(`Presa (femmina): scelta ${state.female.sku}.`);
  }
  if(state.hawse){
    lines.push({sku:state.hawse.sku, desc:state.hawse.name, qty:1, source:"PRIMARY"});
    addTrace(`Hawse pipe: proposto/filtrato su base+cavo → scelto ${state.hawse.sku}.`);
  }
  if(state.container){
    lines.push({sku:state.container.sku, desc:state.container.name, qty:1, source:"PRIMARY"});
    addTrace(`Container: filtrato su famiglia ${state.base?.family||state.base?.sku} e lunghezza cavo → scelto ${state.container.sku}.`);
  }

  return lines;
}

function renderBOM(lines){
  const tbody=$("bomTable").querySelector("tbody");
  tbody.innerHTML="";
  if(!lines.length){
    tbody.innerHTML=`<tr><td colspan="5" class="muted">Nessuna riga.</td></tr>`;
    $("btnExportCsv").disabled=true;
    return;
  }
  for(const ln of lines){
    const tr=document.createElement("tr");
    tr.innerHTML = `<td>${ln.sku}</td><td>${ln.desc||""}</td><td>1</td><td>${ln.source||"PRIMARY"}</td><td></td>`;
    tbody.appendChild(tr);
  }
  $("btnExportCsv").disabled=false;
  renderTrace();
}

function csvFrom(lines){
  const esc=s=>`"${String(s||"").replaceAll('"','""')}"`;
  const header=["SKU","Descrizione","Quantità","Fonte"].map(esc).join(",");
  const rows=lines.map(l=>[l.sku,l.desc,1,l.source].map(esc).join(","));
  return [header,...rows].join("\\n");
}

function resetAll(){
  state.base=state.cable=state.male=state.female=state.hawse=state.container=null;
  state.trace=[];
  $("to2").disabled=true; $("to3").disabled=true; $("to4").disabled=true; $("to5").disabled=true; $("to6").disabled=true;
  $("cableSearch").value=""; $("cableLen").value="";
  $("maleSearch").value=""; $("femaleSearch").value="";
  setStatus("Reset eseguito.", "ok");
  renderPicklist("baseList", filterBase(), null, pickBase, it=>it.family||it.sku);
  $("cableList").innerHTML=""; $("maleList").innerHTML=""; $("femaleList").innerHTML=""; $("hpList").innerHTML=""; $("containerList").innerHTML="";
  $("bomTable").querySelector("tbody").innerHTML = `<tr><td colspan="5" class="muted">Completa i passi per generare la BOM.</td></tr>`;
  $("trace").innerHTML="";
  goStep(1);
}

function pickBase(it){
  state.base = it.virtual ? {sku:it.sku, family:it.sku, virtual:true} : it;
  $("to2").disabled=false;
  renderPicklist("baseList", filterBase(), state.base.sku, pickBase, x=>x.family||x.sku);
  setStatus(`Base selezionata: ${state.base.family||state.base.sku}.`, "ok");
}

function pickCable(it){
  state.cable=it;
  $("to3").disabled=false;
  renderPicklist("cableList", filterCables(), state.cable.sku, pickCable, x=>`${x.amps||"?"}A • ${x.conductors||"?"}c • ${x.length_m||""}m`);
  setStatus(`Cavo selezionato: ${it.sku}.`, "ok");
}

function pickMale(it){
  state.male=it;
  // allow moving even without female
  $("to4").disabled = !state.male;
  renderPicklist("maleList", filterConnectors("male"), state.male?.sku, pickMale, x=>`${x.amps||""}A • ${x.poles||""}`);
  setStatus(`Spina selezionata: ${it.sku}.`, "ok");
}
function pickFemale(it){
  state.female=it;
  renderPicklist("femaleList", filterConnectors("female"), state.female?.sku, pickFemale, x=>`${x.amps||""}A • ${x.poles||""}`);
  setStatus(`Presa selezionata: ${it.sku}.`, "ok");
}

function pickHP(it){
  state.hawse=it;
  $("to5").disabled=false;
  renderPicklist("hpList", filterHawse(), state.hawse?.sku, pickHP, x=>x.family||"");
  setStatus(`Hawse pipe selezionato: ${it.sku}.`, "ok");
}

function pickContainer(it){
  state.container=it;
  $("to6").disabled=false;
  renderPicklist("containerList", filterContainers(), state.container?.sku, pickContainer, x=>x.family||"");
  setStatus(`Container selezionato: ${it.sku}.`, "ok");
}

async function initPWA(){
  if("serviceWorker" in navigator){
    try{ await navigator.serviceWorker.register("./sw.js"); }catch(e){}
  }
  let deferredPrompt=null;
  window.addEventListener("beforeinstallprompt",(e)=>{e.preventDefault();deferredPrompt=e;$("btnInstall").hidden=false;});
  $("btnInstall").addEventListener("click", async ()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt=null; $("btnInstall").hidden=true;
  });
}

async function main(){
  setStatus("Caricamento catalogo…");
  await loadData();

  // Stepper click
  document.querySelectorAll(".step").forEach(b=>b.addEventListener("click",()=>goStep(Number(b.dataset.step))));
  document.querySelectorAll("[data-prev]").forEach(b=>b.addEventListener("click",()=>goStep(Number(b.dataset.prev))));
  $("btnReset").addEventListener("click", resetAll);

  // Base
  renderPicklist("baseList", filterBase(), null, pickBase, it=>it.family||it.sku);

  // Step 2 filters
  $("cableSearch").addEventListener("input", ()=>{ if(state.base) renderPicklist("cableList", filterCables(), state.cable?.sku, pickCable, x=>`${x.amps||"?"}A • ${x.conductors||"?"}c • ${x.length_m||""}m`); });
  $("cableLen").addEventListener("change", ()=>{ if(state.base) renderPicklist("cableList", filterCables(), state.cable?.sku, pickCable, x=>`${x.amps||"?"}A • ${x.conductors||"?"}c • ${x.length_m||""}m`); });

  // Navigation buttons
  $("to2").addEventListener("click", ()=>{
    goStep(2);
    renderPicklist("cableList", filterCables(), state.cable?.sku, pickCable, x=>`${x.amps||"?"}A • ${x.conductors||"?"}c • ${x.length_m||""}m`);
  });
  $("to3").addEventListener("click", ()=>{
    goStep(3);
    renderPicklist("maleList", filterConnectors("male"), state.male?.sku, pickMale, x=>`${x.amps||""}A • ${x.poles||""}`);
    renderPicklist("femaleList", filterConnectors("female"), state.female?.sku, pickFemale, x=>`${x.amps||""}A • ${x.poles||""}`);
  });

  $("maleSearch").addEventListener("input", ()=>renderPicklist("maleList", filterConnectors("male"), state.male?.sku, pickMale, x=>`${x.amps||""}A • ${x.poles||""}`));
  $("femaleSearch").addEventListener("input", ()=>renderPicklist("femaleList", filterConnectors("female"), state.female?.sku, pickFemale, x=>`${x.amps||""}A • ${x.poles||""}`));

  $("to4").addEventListener("click", ()=>{
    goStep(4);
    renderPicklist("hpList", filterHawse(), state.hawse?.sku, pickHP, x=>x.family||"");
  });
  $("to5").addEventListener("click", ()=>{
    goStep(5);
    renderPicklist("containerList", filterContainers(), state.container?.sku, pickContainer, x=>x.family||"");
  });
  $("to6").addEventListener("click", ()=>{
    goStep(6);
    const bom=buildBOM();
    renderBOM(bom);
  });

  $("btnExportCsv").addEventListener("click", ()=>{
    const bom=buildBOM();
    const csv=csvFrom(bom);
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    const ts=new Date().toISOString().slice(0,19).replaceAll(":","").replace("T","_");
    a.download=`BOM_Cablemaster_${ts}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  });

  await initPWA();
  setStatus("Pronto. Seleziona Base per iniziare.", "ok");
}

main().catch(err=>{console.error(err); setStatus("Errore: controlla console.", "bad");});
