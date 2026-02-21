
let master=null;
let itemsBySku=new Map();

const state={
  family:null,
  motorV:"24",
  baseSku:null,
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
  el.style.color=(kind==="ok")?"var(--ok)":(kind==="warn")?"var(--warn)":(kind==="bad")?"var(--bad)":"var(--muted)";
}

async function loadData(){
  master = await fetch("./data/cablemaster_master.json").then(r=>r.json());
  // flatten items
  const all = [];
  for(const k of Object.keys(master.items)){
    for(const it of master.items[k]) all.push(it);
  }
  for(const it of all){
    itemsBySku.set(it.sku, it);
  }
}

function goStep(n){
  document.querySelectorAll(".step").forEach(b=>b.classList.toggle("active", b.dataset.step===String(n)));
  document.querySelectorAll(".pane").forEach(p=>p.classList.toggle("active", p.dataset.pane===String(n)));
}

function card(title, subtitle, selected, onClick, skuSmall=""){
  const div=document.createElement("div");
  div.className="cardpick"+(selected?" selected":"");
  div.addEventListener("click", onClick);
  const t=document.createElement("div");
  t.className="title"; t.textContent=title;
  const badge=document.createElement("span"); badge.className="badge primary"; badge.textContent="PRIMARY";
  t.appendChild(badge);
  const m=document.createElement("div");
  m.className="meta"; m.textContent=subtitle + (skuSmall?` • SKU: ${skuSmall}`:"");
  div.appendChild(t); div.appendChild(m);
  return div;
}

function renderPicklist(elId, list, selectedSku, onPick, metaFn){
  const el=$(elId); el.innerHTML="";
  if(!list.length){
    el.innerHTML=`<div class="muted">Nessuna opzione trovata.</div>`;
    return;
  }
  for(const it of list){
    const selected = it.sku === selectedSku;
    const div=document.createElement("div");
    div.className="cardpick"+(selected?" selected":"");
    div.addEventListener("click", ()=>onPick(it));
    const t=document.createElement("div"); t.className="title"; t.textContent=it.sku;
    const badge=document.createElement("span"); badge.className="badge primary"; badge.textContent="PRIMARY"; t.appendChild(badge);
    const m=document.createElement("div"); m.className="meta";
    const extra = metaFn?(" • "+metaFn(it)):"";
    m.textContent=(it.name||"") + extra;
    div.appendChild(t); div.appendChild(m);
    el.appendChild(div);
  }
}

function baseSkuFor(family, motorV){
  const idx = master.indices.base_index || {};
  const fam = idx[family] || {};
  return fam[String(motorV)] || fam["24"] || fam["12"] || null;
}

function renderBase(){
  const families=["CRMA","CM4","CM7","CM8","CM9"];
  const el=$("baseList"); el.innerHTML="";
  for(const f of families){
    const sku = baseSkuFor(f, state.motorV);
    const selected = state.family===f;
    el.appendChild(card(
      f,
      `Famiglia ${f}`,
      selected,
      ()=>{
        state.family=f;
        state.baseSku=sku;
        $("to2").disabled=false;
        renderBase();
        setStatus(`Base selezionata: ${f} (${state.motorV}V).`, "ok");
      },
      sku||"—"
    ));
  }
}

function capsMax(family){
  const caps = master.indices.caps_amps_max || {};
  return caps[family] ?? 999;
}

function uniqueSorted(arr){
  return Array.from(new Set(arr)).sort((a,b)=>Number(a)-Number(b));
}

function initCableFilters(){
  const cables = master.items.cable || [];
  const amps = uniqueSorted(cables.map(c=>c.amps).filter(Boolean));
  const lens = uniqueSorted(cables.map(c=>c.length_m).filter(Boolean));
  const ampsSel=$("cableAmps");
  ampsSel.innerHTML = '<option value="">Qualsiasi</option>' + amps.map(a=>`<option value="${a}">${a}</option>`).join("");
  const lenSel=$("cableLen");
  lenSel.innerHTML = '<option value="">Qualsiasi</option>' + lens.map(l=>`<option value="${l}">${l}</option>`).join("");
}

function filterCables(){
  const cables = master.items.cable || [];
  const maxA = capsMax(state.family);
  const q = ($("cableSearch").value||"").toLowerCase();
  const a = Number($("cableAmps").value||0);
  const l = Number($("cableLen").value||0);

  let list = cables.filter(c=>!c.amps || c.amps<=maxA);
  if(a) list=list.filter(c=>c.amps===a);
  if(l) list=list.filter(c=>Number(c.length_m||0)===l);
  if(q) list=list.filter(c=>(c.name||"").toLowerCase().includes(q) || (c.sku||"").toLowerCase().includes(q));
  list.sort((x,y)=>(x.amps||0)-(y.amps||0) || (x.length_m||0)-(y.length_m||0) || x.sku.localeCompare(y.sku));
  return list.slice(0,160);
}

function cablePolesFromConductors(c){
  const cond = c?.conductors;
  if(cond===3) return "2P+T";
  if(cond===4) return "3P+T";
  if(cond===5) return "3P+T+N";
  return null;
}

function filterConnectors(gender){
  const connectors = master.items.connector || [];
  const c=state.cable;
  const q=((gender==="male"?$("maleSearch").value:$("femaleSearch").value)||"").toLowerCase();
  const poles = cablePolesFromConductors(c);

  let list = connectors.filter(x=>x.gender===gender);

  // exact amps match (critical fix)
  if(c?.amps) list = list.filter(x=>x.amps===c.amps);

  // poles match when deducible
  if(poles) list = list.filter(x=>x.poles===poles);

  if(q) list=list.filter(x=>(x.name||"").toLowerCase().includes(q) || x.sku.toLowerCase().includes(q));
  list.sort((a,b)=>a.sku.localeCompare(b.sku));
  return list.slice(0,160);
}

function whitelistItems(category, family){
  const wl = (category==="hawse_pipe")
    ? (master.indices.hawse_whitelist_by_family || {})
    : (master.indices.container_whitelist_by_family || {});
  const skus = wl[family] || [];
  const items = skus.map(s=>itemsBySku.get(s)).filter(Boolean);
  items.sort((a,b)=>a.sku.localeCompare(b.sku));
  return items;
}

function addTrace(msg){ state.trace.push(msg); }
function renderTrace(){
  const ul=$("trace"); ul.innerHTML="";
  state.trace.forEach(t=>{ const li=document.createElement("li"); li.textContent=t; ul.appendChild(li); });
}

function buildBOM(){
  state.trace=[];
  const lines=[];

  addTrace(`Base: ${state.family} • motore ${state.motorV}V → SKU ${state.baseSku||"—"}.`);
  if(state.baseSku){
    const it=itemsBySku.get(state.baseSku);
    lines.push({role:"Base", sku:state.baseSku, desc:it?.name||"", qty:1, source:"PRIMARY"});
  }

  if(state.cable){
    lines.push({role:"Cavo", sku:state.cable.sku, desc:state.cable.name, qty:1, source:"PRIMARY"});
    addTrace(`Cavo: ${state.cable.amps||"?"}A • conduttori ${state.cable.conductors||"?"} • ${state.cable.length_m||"?"}m.`);
  }

  if(state.male){
    lines.push({role:"Spina", sku:state.male.sku, desc:state.male.name, qty:1, source:"PRIMARY"});
    addTrace(`Spina: ${state.male.amps||"?"}A • ${state.male.poles||"?"}.`);
  }else{
    addTrace("Spina: non selezionata.");
  }

  if(state.female){
    lines.push({role:"Presa", sku:state.female.sku, desc:state.female.name, qty:1, source:"PRIMARY"});
  }

  if(state.hawse){
    lines.push({role:"Hawse pipe", sku:state.hawse.sku, desc:state.hawse.name, qty:1, source:"PRIMARY"});
  }else{
    addTrace("Hawse pipe: non selezionato (whitelist vuota o salto).");
  }

  if(state.container){
    lines.push({role:"Container", sku:state.container.sku, desc:state.container.name, qty:1, source:"PRIMARY"});
  }else{
    addTrace("Container: non selezionato (whitelist vuota o salto).");
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
    tr.innerHTML = `<td>${ln.role}</td><td>${ln.sku}</td><td>${ln.desc||""}</td><td>${ln.qty}</td><td>${ln.source}</td>`;
    tbody.appendChild(tr);
  }
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
  state.family=null;
  state.baseSku=null;
  state.cable=null;
  state.male=null;
  state.female=null;
  state.hawse=null;
  state.container=null;
  state.trace=[];
  $("to2").disabled=true; $("to3").disabled=true; $("to4").disabled=true; $("to5").disabled=true; $("to6").disabled=true;
  $("cableSearch").value=""; $("cableAmps").value=""; $("cableLen").value="";
  $("maleSearch").value=""; $("femaleSearch").value="";
  $("cableList").innerHTML=""; $("maleList").innerHTML=""; $("femaleList").innerHTML="";
  $("hpList").innerHTML=""; $("containerList").innerHTML="";
  $("bomTable").querySelector("tbody").innerHTML = `<tr><td colspan="5" class="muted">Completa i passi.</td></tr>`;
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
  $("btnInstall").addEventListener("click", async ()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt=null; $("btnInstall").hidden=true;
  });
}

async function main(){
  setStatus("Caricamento dati…");
  await loadData();
  initCableFilters();

  $("motorV").addEventListener("change", ()=>{
    state.motorV = $("motorV").value;
    if(state.family){
      state.baseSku = baseSkuFor(state.family, state.motorV);
    }
    renderBase();
  });

  // stepper
  document.querySelectorAll(".step").forEach(b=>b.addEventListener("click",()=>goStep(Number(b.dataset.step))));
  document.querySelectorAll("[data-prev]").forEach(b=>b.addEventListener("click",()=>goStep(Number(b.dataset.prev))));
  $("btnReset").addEventListener("click", resetAll);

  renderBase();

  // Step 2
  const refreshCables = ()=> renderPicklist("cableList", filterCables(), state.cable?.sku, pickCable, x=>`${x.amps||"?"}A • ${x.conductors||"?"}c • ${x.length_m||""}m`);
  $("cableSearch").addEventListener("input", refreshCables);
  $("cableAmps").addEventListener("change", refreshCables);
  $("cableLen").addEventListener("change", refreshCables);

  function pickCable(it){
    state.cable=it;
    $("to3").disabled=false;
    refreshCables();
    setStatus(`Cavo selezionato: ${it.sku}.`, "ok");
  }

  $("to2").addEventListener("click", ()=>{
    goStep(2);
    refreshCables();
  });

  // Step 3
  const refreshMale = ()=>renderPicklist("maleList", filterConnectors("male"), state.male?.sku, pickMale, x=>`${x.amps||""}A • ${x.poles||""}`);
  const refreshFemale = ()=>renderPicklist("femaleList", filterConnectors("female"), state.female?.sku, pickFemale, x=>`${x.amps||""}A • ${x.poles||""}`);

  function pickMale(it){
    state.male=it;
    $("to4").disabled=false;
    refreshMale();
    setStatus(`Spina selezionata: ${it.sku}.`, "ok");
  }
  function pickFemale(it){
    state.female=it;
    refreshFemale();
    setStatus(`Presa selezionata: ${it.sku}.`, "ok");
  }

  $("to3").addEventListener("click", ()=>{
    goStep(3);
    refreshMale();
    refreshFemale();
  });

  $("maleSearch").addEventListener("input", refreshMale);
  $("femaleSearch").addEventListener("input", refreshFemale);

  // Step 4 (whitelist)
  function pickHP(it){
    state.hawse=it;
    $("to5").disabled=false;
    renderPicklist("hpList", whitelistItems("hawse_pipe", state.family), state.hawse?.sku, pickHP, x=>x.family||"");
    setStatus(`Hawse pipe: ${it.sku}.`, "ok");
  }

  $("to4").addEventListener("click", ()=>{
    goStep(4);
    const list = whitelistItems("hawse_pipe", state.family);
    renderPicklist("hpList", list, state.hawse?.sku, pickHP, x=>x.family||"");
    if(list.length){
      // preselect first if none
      if(!state.hawse){ state.hawse=list[0]; $("to5").disabled=false; }
    }else{
      $("to5").disabled=false; // allow skip
      setStatus("Nessun hawse pipe in whitelist per questa famiglia.", "warn");
    }
  });

  // Step 5 (whitelist)
  function pickContainer(it){
    state.container=it;
    $("to6").disabled=false;
    renderPicklist("containerList", whitelistItems("container", state.family), state.container?.sku, pickContainer, x=>x.family||"");
    setStatus(`Container: ${it.sku}.`, "ok");
  }

  $("to5").addEventListener("click", ()=>{
    goStep(5);
    const list = whitelistItems("container", state.family);
    renderPicklist("containerList", list, state.container?.sku, pickContainer, x=>x.family||"");
    if(list.length){
      if(!state.container){ state.container=list[0]; $("to6").disabled=false; }
    }else{
      $("to6").disabled=false; // allow skip
      setStatus("Nessun container in whitelist per questa famiglia.", "warn");
    }
  });

  // Step 6
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
