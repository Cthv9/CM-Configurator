
let catalog=null, engine=null;
let skuMap=new Map();

const state={ baseFamily:null, motorV:"24", baseSku:null, baseItem:null,
  cable:null, male:null, female:null, hawse:null, container:null, trace:[] };

function $(id){return document.getElementById(id);}
function setStatus(msg, kind="info"){
  const el=$("status"); el.textContent=msg||"";
  el.style.color = (kind==="ok") ? "var(--ok)" : (kind==="warn") ? "var(--warn)" : (kind==="bad") ? "var(--bad)" : "var(--muted)";
}
async function loadData(){
  const [cat, eng]=await Promise.all([fetch("./data/catalog.json").then(r=>r.json()), fetch("./data/engine.json").then(r=>r.json())]);
  catalog=cat; engine=eng; skuMap=new Map((catalog.items||[]).map(it=>[it.sku,it]));
}
function goStep(n){
  document.querySelectorAll(".step").forEach(b=>b.classList.toggle("active", b.dataset.step===String(n)));
  document.querySelectorAll(".pane").forEach(p=>p.classList.toggle("active", p.dataset.pane===String(n)));
}
function card(title, subtitle, selected, onClick, skuSmall=""){
  const div=document.createElement("div");
  div.className="cardpick"+(selected?" selected":"");
  div.addEventListener("click", onClick);
  const t=document.createElement("div"); t.className="title"; t.textContent=title;
  const badge=document.createElement("span"); badge.className="badge primary"; badge.textContent="PRIMARY"; t.appendChild(badge);
  div.appendChild(t);
  const m=document.createElement("div"); m.className="meta";
  m.textContent = subtitle + (skuSmall?` • SKU: ${skuSmall}`:"");
  div.appendChild(m);
  return div;
}

function baseSkuFor(family, motorV){
  const idx = engine.base_index || {};
  const famMap = idx[family] || {};
  return famMap[String(motorV)] || famMap["24"] || famMap["12"] || null;
}

function renderBase(){
  const families=["CRMA","CM4","CM7","CM8","CM9"];
  const el=$("baseList"); el.innerHTML="";
  families.forEach(f=>{
    const sku=baseSkuFor(f, state.motorV);
    const selected = state.baseFamily===f;
    const subtitle = engine.families[f]?.label || f;
    el.appendChild(card(f, subtitle, selected, ()=>{
      state.baseFamily=f;
      state.baseSku=sku;
      state.baseItem = sku ? skuMap.get(sku) : null;
      $("to2").disabled=false;
      renderBase();
      setStatus(`Base selezionata: ${f} (${state.motorV}V).`, "ok");
    }, sku||"—"));
  });
}

function allowedCableForFamily(fam, cable){
  // Use amps max per family (simple). CRM/CRMA hide high amps.
  const caps={"CRMA":63,"CM4":32,"CM7":63,"CM8":125,"CM9":250};
  const max=caps[fam]||999;
  if(cable.amps && cable.amps>max) return false;
  return true;
}

function filterCables(){
  const fam=state.baseFamily;
  const q=($("cableSearch").value||"").toLowerCase();
  const len=Number($("cableLen").value||0);
  let list=(catalog.items||[]).filter(it=>it.category==="cable");
  list=list.filter(c=>allowedCableForFamily(fam,c));
  if(len) list=list.filter(c=>Number(c.length_m||0)===len);
  if(q) list=list.filter(c=>(c.name||"").toLowerCase().includes(q) || (c.sku||"").toLowerCase().includes(q));
  list.sort((a,b)=>(a.amps||0)-(b.amps||0) || (a.length_m||0)-(b.length_m||0) || a.sku.localeCompare(b.sku));
  return list.slice(0,160);
}
function cableKey(c){
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

  // amps must match exactly when cable amps is known
  if(c?.amps){
    list=list.filter(x=>(x.amps||0)===c.amps);
  }

  // poles must match when cable conductors imply poles
  const k=c?cableKey(c):{poles:null};
  if(k.poles){
    list=list.filter(x=>x.poles===k.poles);
  }

  if(q) list=list.filter(x=>(x.name||"").toLowerCase().includes(q) || x.sku.toLowerCase().includes(q));
  list.sort((a,b)=>(a.amps||0)-(b.amps||0) || a.sku.localeCompare(b.sku));
  return list.slice(0,160);
}
function filterHawse(){
  const fam=state.baseFamily;
  const amps=state.cable?.amps;
  let list=(catalog.items||[]).filter(it=>it.category==="hawse_pipe");
  if(fam) list=list.filter(h=>!h.family || h.family===fam || h.family===fam.replace("CRMA","CRM"));
  if(amps) list=list.filter(h=>!h.amps_max || h.amps_max>=amps);
  list.sort((a,b)=>(a.amps_max||999)-(b.amps_max||999) || a.sku.localeCompare(b.sku));
  return list.slice(0,80);
}
function filterContainers(){
  const fam=state.baseFamily;
  let list=(catalog.items||[]).filter(it=>it.category==="container");
  if(fam) list=list.filter(x=>!x.family || x.family===fam || x.family===fam.replace("CRMA","CRM"));
  list.sort((a,b)=>a.sku.localeCompare(b.sku));
  return list.slice(0,80);
}

function renderPicklist(elId, items, selectedSku, onPick, metaFn){
  const el=$(elId); el.innerHTML="";
  if(!items.length){ el.innerHTML=`<div class="muted">Nessuna opzione trovata.</div>`; return; }
  items.forEach(it=>{
    const selected = selectedSku===it.sku;
    const div=document.createElement("div");
    div.className="cardpick"+(selected?" selected":"");
    div.addEventListener("click", ()=>onPick(it));
    const t=document.createElement("div"); t.className="title"; t.textContent=it.sku;
    const badge=document.createElement("span"); badge.className="badge primary"; badge.textContent="PRIMARY"; t.appendChild(badge);
    const m=document.createElement("div"); m.className="meta";
    m.textContent=(it.name||"") + (metaFn?(" • "+metaFn(it)):"");
    div.appendChild(t); div.appendChild(m);
    el.appendChild(div);
  });
}

function addTrace(msg){ state.trace.push(msg); }
function renderTrace(){
  const ul=$("trace"); ul.innerHTML="";
  state.trace.forEach(t=>{ const li=document.createElement("li"); li.textContent=t; ul.appendChild(li); });
}

function buildBOM(){
  state.trace=[];
  const lines=[];
  // Base
  if(state.baseFamily){
    addTrace(`Base: ${state.baseFamily} • motore ${state.motorV}V → SKU ${state.baseSku||"non trovato"}.`);
    if(state.baseSku){
      const it=skuMap.get(state.baseSku);
      lines.push({role:"Base", sku:state.baseSku, desc:it?.name||"", qty:1, source:"PRIMARY"});
    }else{
      lines.push({role:"Base", sku:"—", desc:`Famiglia ${state.baseFamily} (SKU non trovato)`, qty:1, source:"PRIMARY"});
    }
  }
  if(state.cable){
    lines.push({role:"Cavo", sku:state.cable.sku, desc:state.cable.name, qty:1, source:"PRIMARY"});
    addTrace(`Cavo: ${state.cable.amps||"?"}A • ${state.cable.conductors||"?"} cond. • ${state.cable.length_m||"?"}m.`);
  }
  if(state.male){
    lines.push({role:"Spina", sku:state.male.sku, desc:state.male.name, qty:1, source:"PRIMARY"});
    addTrace(`Spina filtrata dal cavo → ${state.male.sku}.`);
  }else{
    addTrace("Spina: non selezionata (di solito necessaria).");
  }
  if(state.female){
    lines.push({role:"Presa", sku:state.female.sku, desc:state.female.name, qty:1, source:"PRIMARY"});
  }
  if(state.hawse){
    lines.push({role:"Hawse Pipe", sku:state.hawse.sku, desc:state.hawse.name, qty:1, source:"PRIMARY"});
  }
  if(state.container){
    lines.push({role:"Container", sku:state.container.sku, desc:state.container.name, qty:1, source:"PRIMARY"});
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
  lines.forEach(ln=>{
    const tr=document.createElement("tr");
    tr.innerHTML = `<td>${ln.role}</td><td>${ln.sku}</td><td>${ln.desc||""}</td><td>${ln.qty}</td><td>${ln.source}</td>`;
    tbody.appendChild(tr);
  });
  $("btnExportCsv").disabled=false;
  renderTrace();
}

function csvFrom(lines){
  const esc=s=>`"${String(s||"").replaceAll('"','""')}"`;
  const header=["Ruolo","SKU","Descrizione","Quantità","Fonte"].map(esc).join(",");
  const rows=lines.map(l=>[l.role,l.sku,l.desc,l.qty,l.source].map(esc).join(","));
  return [header,...rows].join("\\n");
}

function resetAll(){
  state.baseFamily=null; state.baseSku=null; state.baseItem=null;
  state.cable=state.male=state.female=state.hawse=state.container=null;
  state.trace=[];
  $("to2").disabled=true; $("to3").disabled=true; $("to4").disabled=true; $("to5").disabled=true; $("to6").disabled=true;
  $("cableSearch").value=""; $("cableLen").value=""; $("maleSearch").value=""; $("femaleSearch").value="";
  $("cableList").innerHTML=""; $("maleList").innerHTML=""; $("femaleList").innerHTML=""; $("hpList").innerHTML=""; $("containerList").innerHTML="";
  $("bomTable").querySelector("tbody").innerHTML=`<tr><td colspan="5" class="muted">Completa i passi.</td></tr>`;
  $("trace").innerHTML="";
  renderBase();
  goStep(1);
  setStatus("Reset eseguito.", "ok");
}

async function initPWA(){
  if("serviceWorker" in navigator){
    try{ await navigator.serviceWorker.register("./sw.js"); }catch(e){}
  }
  let deferredPrompt=null;
  window.addEventListener("beforeinstallprompt",(e)=>{e.preventDefault();deferredPrompt=e;$("btnInstall").hidden=false;});
  $("btnInstall").addEventListener("click", async ()=>{ if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; $("btnInstall").hidden=true; });
}

async function main(){
  setStatus("Caricamento…");
  await loadData();

  $("motorV").addEventListener("change", ()=>{
    state.motorV = $("motorV").value;
    // recompute sku for selected family
    if(state.baseFamily){
      state.baseSku = baseSkuFor(state.baseFamily, state.motorV);
    }
    renderBase();
  });

  document.querySelectorAll(".step").forEach(b=>b.addEventListener("click",()=>goStep(Number(b.dataset.step))));
  document.querySelectorAll("[data-prev]").forEach(b=>b.addEventListener("click",()=>goStep(Number(b.dataset.prev))));
  $("btnReset").addEventListener("click", resetAll);

  renderBase();

  // step navigation
  $("to2").addEventListener("click", ()=>{
    goStep(2);
    renderPicklist("cableList", filterCables(), state.cable?.sku, (it)=>{
      state.cable=it;
      $("to3").disabled=false;
      renderPicklist("cableList", filterCables(), state.cable.sku, arguments.callee, x=>`${x.amps||"?"}A • ${x.conductors||"?"}c • ${x.length_m||""}m`);
      setStatus(`Cavo selezionato: ${it.sku}.`, "ok");
    }, x=>`${x.amps||"?"}A • ${x.conductors||"?"}c • ${x.length_m||""}m`);
  });

  $("cableSearch").addEventListener("input", ()=>{ if(state.baseFamily) renderPicklist("cableList", filterCables(), state.cable?.sku, pickCable, x=>`${x.amps||"?"}A • ${x.conductors||"?"}c • ${x.length_m||""}m`); });
  $("cableLen").addEventListener("change", ()=>{ if(state.baseFamily) renderPicklist("cableList", filterCables(), state.cable?.sku, pickCable, x=>`${x.amps||"?"}A • ${x.conductors||"?"}c • ${x.length_m||""}m`); });

  function pickCable(it){
    state.cable=it;
    $("to3").disabled=false;
    renderPicklist("cableList", filterCables(), state.cable?.sku, pickCable, x=>`${x.amps||"?"}A • ${x.conductors||"?"}c • ${x.length_m||""}m`);
    setStatus(`Cavo selezionato: ${it.sku}.`, "ok");
  }

  $("to3").addEventListener("click", ()=>{
    goStep(3);
    renderPicklist("maleList", filterConnectors("male"), state.male?.sku, pickMale, x=>`${x.amps||""}A • ${x.poles||""}`);
    renderPicklist("femaleList", filterConnectors("female"), state.female?.sku, pickFemale, x=>`${x.amps||""}A • ${x.poles||""}`);
  });

  function pickMale(it){ state.male=it; $("to4").disabled=false; renderPicklist("maleList", filterConnectors("male"), state.male?.sku, pickMale, x=>`${x.amps||""}A • ${x.poles||""}`); setStatus(`Spina: ${it.sku}.`, "ok"); }
  function pickFemale(it){ state.female=it; renderPicklist("femaleList", filterConnectors("female"), state.female?.sku, pickFemale, x=>`${x.amps||""}A • ${x.poles||""}`); setStatus(`Presa: ${it.sku}.`, "ok"); }

  $("maleSearch").addEventListener("input", ()=>renderPicklist("maleList", filterConnectors("male"), state.male?.sku, pickMale, x=>`${x.amps||""}A • ${x.poles||""}`));
  $("femaleSearch").addEventListener("input", ()=>renderPicklist("femaleList", filterConnectors("female"), state.female?.sku, pickFemale, x=>`${x.amps||""}A • ${x.poles||""}`));

  $("to4").addEventListener("click", ()=>{
    goStep(4);
    renderPicklist("hpList", filterHawse(), state.hawse?.sku, (it)=>{ state.hawse=it; $("to5").disabled=false; renderPicklist("hpList", filterHawse(), state.hawse?.sku, arguments.callee, x=>x.family||""); setStatus(`Hawse pipe: ${it.sku}.`, "ok"); }, x=>x.family||"");
  });

  $("to5").addEventListener("click", ()=>{
    goStep(5);
    renderPicklist("containerList", filterContainers(), state.container?.sku, (it)=>{ state.container=it; $("to6").disabled=false; renderPicklist("containerList", filterContainers(), state.container?.sku, arguments.callee, x=>x.family||""); setStatus(`Container: ${it.sku}.`, "ok"); }, x=>x.family||"");
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
