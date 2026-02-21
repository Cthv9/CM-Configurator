let catalog=null, ruleset=null, templates=null;
let skuMap=new Map();
let lastBOM=null;

const OVERRIDE_KEY="cm_overrides_v1";

function $(id){return document.getElementById(id);}

function setStatus(msg, kind="info"){
  const el=$("status"); if(!el) return;
  el.textContent=msg||"";
  el.style.color = (kind==="ok") ? "var(--ok)"
               : (kind==="warn") ? "var(--warn)"
               : (kind==="bad") ? "var(--bad)"
               : "var(--muted)";
}

async function loadData(){
  const [cat, rules, tpls] = await Promise.all([
    fetch("./data/catalog.json").then(r=>r.json()),
    fetch("./data/rules.json").then(r=>r.json()),
    fetch("./data/templates.json").then(r=>r.json())
  ]);
  catalog=cat; ruleset=rules; templates=tpls;
  skuMap = new Map((catalog.items||[]).map(it=>[it.sku, it]));
}

function getInput(){
  return {
    region: $("region").value,
    amps: Number($("amps").value||0),
    hz: Number($("hz").value),
    phase: $("phase").value,
    pins: Number($("pins").value),
    motor_voltage_vdc: Number($("motor_voltage_vdc").value),
    cable_length_m: Number($("cable_length_m").value),
    need_hawse_pipe: $("need_hawse_pipe").checked,
    need_remote_control: $("need_remote_control").checked,
    space_class: $("space_class").value,
    routing_layout: $("routing_layout").value,
    pvc_length_m: Number($("pvc_length_m").value||0),
    bend_count: Number($("bend_count").value||0),
    max_bend_deg: Number($("max_bend_deg").value||45),
    low_profile: $("low_profile").value
  };
}

function conditionMatch(when, input){
  for(const [k,v] of Object.entries(when||{})){
    if(k==="amps_gte"){ if(!(input.amps>=v)) return false; continue; }
    if(k==="amps_lte"){ if(!(input.amps<=v)) return false; continue; }
    if(k.endsWith("_in")){
      const field=k.slice(0,-3);
      if(!Array.isArray(v) || !v.includes(input[field])) return false;
      continue;
    }
    if(input[k]!==v) return false;
  }
  return true;
}

function getDesc(sku, fallbackDesc=""){
  const it = skuMap.get(sku);
  return it?.name || it?.description_search || fallbackDesc || "(SKU non trovato in catalogo)";
}

function signature(input){
  // Used for learning overrides for similar applications
  return [
    input.region, input.amps, input.hz, input.phase, input.pins, input.motor_voltage_vdc
  ].join("|");
}

function readOverrides(){
  try{
    return JSON.parse(localStorage.getItem(OVERRIDE_KEY) || "{}");
  }catch(e){ return {}; }
}
function writeOverrides(obj){
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(obj));
}

function addLine(lines, {sku, qty=1, source="Primary", note="", placeholderKey=null, descFallback=""}){
  lines.push({
    sku,
    description: getDesc(sku, descFallback),
    qty,
    source,
    note,
    placeholderKey
  });
}

function mergeLines(lines){
  const m=new Map();
  for(const ln of lines){
    const key = `${ln.sku}|||${ln.source}|||${ln.note}`;
    if(!m.has(key)) m.set(key, {...ln});
    else m.get(key).qty += ln.qty;
  }
  return Array.from(m.values());
}

function applyRouting(lines, input, notes){
  const layout = input.routing_layout;
  const amps = input.amps;

  const isPVC = (layout==="pvc_straight" || layout==="pvc_bends");
  if(isPVC){
    // Base: pipe end roller
    addLine(lines, {sku:"16-04040", qty:1, source:"Primary", note:"PVC: pipe end roller (anti-abrasione)"});

    // Couplings/rollers along PVC: rule of thumb every ~0.6m (≈ 24")
    const L = Math.max(0, input.pvc_length_m || 0);
    const pitch = 0.3; // default: 30cm
    const qty = (L>0) ? Math.max(1, Math.ceil(L / pitch)) : 1;
    addLine(lines, {sku:"16-04061", qty, source:"Primary", note:`PVC: rulli lungo tratta (~1 ogni ${pitch}m)`});
    notes.push("Routing: su PVC prevedere supporto frequente per ridurre attrito (regola indicativa).");
  }

  if(layout==="pvc_bends" && input.bend_count>0){
    const bends = input.bend_count;
    const deg = input.max_bend_deg;

    // For 50A+ use angling assemblies for significant bends
    if(amps>=50 && deg>=90){
      const angSku = (deg>=180) ? "16-04065" : "16-04066"; // 180 or 90
      addLine(lines, {sku: angSku, qty: bends, source:"Primary", note:`Curve: angling assembly ${deg}°`});
      // Plates: 2 per angling assembly in brochure
      addLine(lines, {sku:"16-50004", qty: bends*2, source:"Primary", note:"Piastre per angling assembly (2 per curva)"});
      notes.push("Routing: per applicazioni ≥50A e curve importanti usare angling assemblies (non gomiti).");
    }else{
      // Allow elbows for <=45 or small currents (still caution)
      if(deg<=45){
        addLine(lines, {sku:"16-04060", qty: bends, source:"Primary", note:"Curve: elbow con rulli 45° (uso limitato)"});
      }else{
        notes.push("Nota: per curve >45° valutare angling assemblies, specie su correnti elevate.");
      }
    }
  }

  if(layout==="remote_overhead"){
    addLine(lines, {sku:"16-50006", qty:1, source:"Primary", note:"Remoto overhead: staffa di montaggio"});
    addLine(lines, {sku:"16-04043", qty:1, source:"Primary", note:"Remoto: kit estensione orizzontale"});
  }

  if(layout==="remote_horizontal"){
    addLine(lines, {sku:"16-04043", qty:1, source:"Primary", note:"Remoto: kit estensione orizzontale"});
  }

  // low profile
  const lp = input.low_profile;
  const wantsLP = (lp==="yes") || (lp==="auto" && input.space_class==="tight");
  if(wantsLP){
    addLine(lines, {sku:"16-04070-1", qty:1, source:"Primary", note:"Low profile mount kit"});
  }
}

function applyLearnedOverrides(lines, input){
  const sig = signature(input);
  const overrides = readOverrides();
  const bucket = overrides[sig];
  if(!bucket) return lines;

  // replace placeholder rows if matching keys
  const out = [];
  for(const ln of lines){
    if(ln.source==="Da definire" && ln.placeholderKey && bucket[ln.placeholderKey]){
      const o = bucket[ln.placeholderKey];
      out.push({
        sku: o.sku,
        description: getDesc(o.sku, o.descFallback || ""),
        qty: ln.qty,
        source: "Secondary",
        note: "Sostituzione memorizzata (casi simili)",
        placeholderKey: null
      });
    }else{
      out.push(ln);
    }
  }
  return out;
}

function buildBOMFromRules(input){
  const lines=[];
  const notes=[];

  for(const rule of (ruleset.rules||[])){
    if(!conditionMatch(rule.when, input)) continue;
    const then = rule.then || {};
    for(const it of (then.add_items||[])){
      addLine(lines, {sku: it.sku, qty: it.qty??1, source:"Primary", note: it.note||""});
    }
    for(const cb of (then.add_cable||[])){
      const len = cb.length_m?.from_input ? input[cb.length_m.from_input] : null;
      const note = (cb.note||"") + (len?` | Lunghezza: ${len} m`:"");
      addLine(lines, {sku: cb.sku, qty: cb.qty??1, source:"Primary", note});
    }
    for(const ph of (then.add_placeholders||[])){
      addLine(lines, {sku: ph.key.toUpperCase(), qty:1, source:"Da definire", note: ph.label||"Da definire", placeholderKey: ph.key, descFallback: ph.label||""});
    }
  }

  // hawse pipe optional — if present in catalog
  if(input.need_hawse_pipe){
    // pick common CM8 hawse pipe sku if exists
    if(skuMap.has("16-04093")) addLine(lines, {sku:"16-04093", qty:1, source:"Primary", note:"Hawse pipe kit"});
    else notes.push("Hawse pipe richiesto: verifica SKU (non presente nel catalogo caricato).");
  }

  // remote control optional
  if(input.need_remote_control){
    // in examples: 16-04154-1B used as remote
    const remoteSku = skuMap.has("16-04154-1B") ? "16-04154-1B" : (skuMap.has("16-04155")?"16-04155":null);
    if(remoteSku) addLine(lines, {sku: remoteSku, qty:1, source:"Primary", note:"Radiocomando"});
    else notes.push("Radiocomando richiesto: SKU non presente nel catalogo caricato.");
  }

  // routing computed
  applyRouting(lines, input, notes);

  let out = mergeLines(lines);
  out = applyLearnedOverrides(out, input);

  // sort: primary then secondary then todo
  out.sort((a,b)=>{
    const rank = (x)=> x.source==="Primary"?0:(x.source==="Secondary"?1:2);
    const ra=rank(a), rb=rank(b);
    if(ra!==rb) return ra-rb;
    return a.sku.localeCompare(b.sku);
  });

  // add sanity notes
  if(out.some(x=>x.source==="Da definire")){
    notes.push("Ci sono righe 'Da definire': usa 'Sostituisci' in BOM per inserire un equivalente (Secondary) e, se vuoi, memorizzarlo.");
  }
  return {lines: out, notes};
}

function renderBOM(bom, input){
  const tbody = $("bomTable").querySelector("tbody");
  tbody.innerHTML="";
  if(!bom.lines.length){
    tbody.innerHTML = `<tr><td colspan="5" class="muted">Nessuna riga BOM generata.</td></tr>`;
    $("btnExportCsv").disabled=true;
    return;
  }

  for(const ln of bom.lines){
    const tr=document.createElement("tr");

    const tdSku=document.createElement("td");
    tdSku.textContent=ln.sku;

    const tdDesc=document.createElement("td");
    tdDesc.textContent=ln.description;

    const tdQty=document.createElement("td");
    tdQty.textContent=String(ln.qty);

    const tdSrc=document.createElement("td");
    const chip=document.createElement("span");
    chip.className = "chip " + (ln.source==="Primary"?"primary":(ln.source==="Secondary"?"secondary":"todo"));
    chip.textContent = ln.source==="Primary" ? "PRIMARY" : (ln.source==="Secondary" ? "SECONDARY" : "DA DEFINIRE");
    tdSrc.appendChild(chip);

    const tdAct=document.createElement("td");
    const wrap=document.createElement("div");
    wrap.className="rowActions";

    const btnEditQty=document.createElement("button");
    btnEditQty.type="button";
    btnEditQty.className="rowBtn";
    btnEditQty.textContent="Q.tà";
    btnEditQty.addEventListener("click", ()=>{
      const v = prompt("Nuova quantità:", ln.qty);
      if(v===null) return;
      const n = Number(v);
      if(!isFinite(n) || n<=0){ alert("Quantità non valida."); return; }
      ln.qty = n;
      lastBOM.lines = lastBOM.lines.map(x => x===ln ? ln : x);
      renderBOM(lastBOM, input);
      setStatus("Quantità aggiornata.", "ok");
    });

    const btnReplace=document.createElement("button");
    btnReplace.type="button";
    btnReplace.className="rowBtn";
    btnReplace.textContent="Sostituisci";
    btnReplace.addEventListener("click", ()=>{
      const newSku = prompt("Inserisci SKU sostitutivo (Secondary):", "");
      if(!newSku) return;
      ln.sku = newSku.trim();
      ln.description = getDesc(ln.sku, ln.description);
      ln.source = "Secondary";
      ln.note = "Sostituzione manuale";
      ln.placeholderKey = null;
      renderBOM(lastBOM, input);

      // option to save mapping for similar applications
      if(confirm("Vuoi memorizzare questa sostituzione come proposta per casi simili?")){
        const key = ln.placeholderKey || inferPlaceholderKeyFromText(ln.description);
        const sig = signature(input);
        const o = readOverrides();
        if(!o[sig]) o[sig]={};
        // if it was a TODO line originally we can save by placeholderKey; for now ask which bucket
        const bucketKey = prompt("Chiave regola (es: connector_male / connector_female / connector_cover). Lascia vuoto per non salvare.", "connector_male");
        if(bucketKey){
          o[sig][bucketKey] = {sku: ln.sku, descFallback: ln.description};
          writeOverrides(o);
          setStatus("Sostituzione memorizzata.", "ok");
        }
      }else{
        setStatus("Riga sostituita (Secondary).", "ok");
      }
    });

    const btnDel=document.createElement("button");
    btnDel.type="button";
    btnDel.className="rowBtn";
    btnDel.textContent="Elimina";
    btnDel.addEventListener("click", ()=>{
      lastBOM.lines = lastBOM.lines.filter(x => x!==ln);
      renderBOM(lastBOM, input);
      setStatus("Riga rimossa.", "ok");
    });

    wrap.append(btnEditQty, btnReplace, btnDel);
    tdAct.appendChild(wrap);

    tr.append(tdSku, tdDesc, tdQty, tdSrc, tdAct);
    tbody.appendChild(tr);
  }

  $("btnExportCsv").disabled=false;
  $("bomMeta").textContent = `Input: ${input.amps}A • ${input.hz}Hz • ${input.phase} • ${input.pins} pin • ${input.motor_voltage_vdc}VDC • Cavo ${input.cable_length_m}m`;

  const notesList=$("notesList"); notesList.innerHTML="";
  (bom.notes||[]).forEach(n=>{ const li=document.createElement("li"); li.textContent=n; notesList.appendChild(li);});
}

function inferPlaceholderKeyFromText(text){
  const t=(text||"").toLowerCase();
  if(t.includes("spina")||t.includes("male")) return "connector_male";
  if(t.includes("presa")||t.includes("female")) return "connector_female";
  if(t.includes("cover")||t.includes("ghiera")) return "connector_cover";
  return null;
}

function bomToCSV(bom){
  const esc = (s)=>`"${String(s??"").replaceAll('"','""')}"`;
  const header=["SKU","Descrizione","Quantità","Fonte"].map(esc).join(",");
  const rows=bom.lines.map(l=>[l.sku,l.description,l.qty,l.source].map(esc).join(","));
  return [header,...rows].join("\n");
}

function resetAll(){
  $("presetSelect").value="";
  $("region").value="EU";
  $("amps").value=125;
  $("hz").value=50;
  $("phase").value="3PH";
  $("pins").value=5;
  $("motor_voltage_vdc").value=24;
  $("cable_length_m").value=20;
  $("need_hawse_pipe").checked=true;
  $("need_remote_control").checked=false;
  $("space_class").value="unknown";
  $("routing_layout").value="direct";
  $("pvc_length_m").value=0;
  $("bend_count").value=1;
  $("max_bend_deg").value=90;
  $("low_profile").value="auto";
  updateRoutingVisibility();

  lastBOM=null;
  $("bomMeta").textContent="";
  $("notesList").innerHTML="";
  const tbody=$("bomTable").querySelector("tbody");
  tbody.innerHTML = `<tr><td colspan="5" class="muted">Seleziona un preset o genera una BOM.</td></tr>`;
  $("btnExportCsv").disabled=true;
  setStatus("Reset eseguito.", "ok");
  goStep(1);
}

function populatePresets(){ /* presets UI removed in v3 */ }

function updateRoutingVisibility(){
  const layout=$("routing_layout").value;
  const showPVC = (layout==="pvc_straight" || layout==="pvc_bends");
  document.querySelectorAll(".routingOnly").forEach(el=> el.style.display = showPVC ? "block" : "none");
  const showBends = (layout==="pvc_bends");
  document.querySelectorAll(".bendsOnly").forEach(el=> el.style.display = showBends ? "block" : "none");
  if(!showPVC){ $("pvc_length_m").value = 0; }
  if(!showBends){ $("bend_count").value = 0; }
}

function goStep(n){
  document.querySelectorAll(".step").forEach(b=>{
    b.classList.toggle("active", b.dataset.step===String(n));
  });
  document.querySelectorAll(".stepPane").forEach(p=>{
    p.classList.toggle("active", p.dataset.pane===String(n));
  });
}

async function initPWA(){
  if("serviceWorker" in navigator){
    try{ await navigator.serviceWorker.register("./sw.js"); }catch(e){}
  }
  let deferredPrompt=null;
  window.addEventListener("beforeinstallprompt",(e)=>{
    e.preventDefault(); deferredPrompt=e; $("btnInstall").hidden=false;
  });
  $("btnInstall").addEventListener("click", async ()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt=null; $("btnInstall").hidden=true;
  });
}


function isDebug(){
  return (location.hash || "").toLowerCase().includes("debug");
}

function clearOverrides(){
  localStorage.removeItem(OVERRIDE_KEY);
}

function renderTests(rows){
  const tbody = $("testTable").querySelector("tbody");
  tbody.innerHTML = "";
  for(const r of rows){
    const tr = document.createElement("tr");
    const td1=document.createElement("td"); td1.textContent = r.name;
    const td2=document.createElement("td"); td2.textContent = r.ok ? "PASS" : "FAIL";
    td2.style.color = r.ok ? "var(--ok)" : "var(--bad)";
    const td3=document.createElement("td"); td3.textContent = r.detail || "";
    tr.append(td1,td2,td3);
    tbody.appendChild(tr);
  }
}

function runTests(){
  const rows = [];
  const tpls = (templates && templates.templates) ? templates.templates : [];
  for(const t of tpls){
    const input = getInput();
    const bom = buildBOMFromRules(input);
    const have = new Set(bom.lines.map(x=>x.sku));
    const expected = new Set((t.bom||[]).map(x=>x.sku));
    let missing = [];
    expected.forEach(sku=>{ if(!have.has(sku)) missing.push(sku); });
    rows.push({
      name: t.label || t.id,
      ok: missing.length === 0,
      detail: missing.length ? ("Mancano: " + missing.slice(0,12).join(", ") + (missing.length>12?" …":"")) : "OK"
    });
  }
  if(!rows.length){
    rows.push({name:"Nessun test disponibile", ok:true, detail:"Aggiungi templates.json come casi test (non UI)."});
  }
  renderTests(rows);
}


async function main(){
  setStatus("Caricamento dati…");
  await loadData();
  populatePresets();
  // debug mode
  if(isDebug()){
    $('debugCard').hidden = false;
    $('btnRunTests').addEventListener('click', runTests);
    $('btnClearOverrides').addEventListener('click', ()=>{clearOverrides(); setStatus('Overrides svuotati.', 'ok');});
  }
  updateRoutingVisibility();
  $("routing_layout").addEventListener("change", updateRoutingVisibility);

  // stepper clicks
  document.querySelectorAll(".step").forEach(btn=>{
    btn.addEventListener("click", ()=>goStep(Number(btn.dataset.step)));
  });
  document.querySelectorAll("[data-next]").forEach(b=>{
    b.addEventListener("click", ()=>goStep(Number(b.dataset.next)));
  });
  document.querySelectorAll("[data-prev]").forEach(b=>{
    b.addEventListener("click", ()=>goStep(Number(b.dataset.prev)));
  });

  $("btnReset").addEventListener("click", resetAll);

  $("configForm").addEventListener("submit",(e)=>{
    e.preventDefault();
    const input=getInput();
    const bom=buildBOMFromRules(input);
    lastBOM=bom;
    renderBOM(bom, input);
    setStatus("BOM aggiornata.", bom.lines.some(l=>l.source==="Da definire")?"warn":"ok");
  });

  $("btnExportCsv").addEventListener("click", ()=>{
    if(!lastBOM) return;
    const csv=bomToCSV(lastBOM);
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
  setStatus("Pronto. Seleziona un preset o completa i passi e genera la BOM.", "ok");
}

main().catch(err=>{
  console.error(err);
  setStatus("Errore: controlla console.", "bad");
});
