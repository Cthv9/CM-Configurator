// Cablemaster Configuratore (MVP) — vanilla JS, GitHub Pages friendly

let catalog = null;
let ruleset = null;
let skuMap = new Map();
let deferredPrompt = null;
let lastBOM = null;

function $(id){ return document.getElementById(id); }

function setStatus(msg, kind="info"){
  const el = $("status");
  el.textContent = msg || "";
  el.style.color = (kind==="ok") ? "var(--ok)"
                : (kind==="warn") ? "var(--warn)"
                : (kind==="bad") ? "var(--bad)"
                : "var(--muted)";
}

async function loadData(){
  const [cat, rules] = await Promise.all([
    fetch("./data/catalog.glendinning.core.json").then(r=>r.json()),
    fetch("./data/rules.glendinning.v0.json").then(r=>r.json())
  ]);
  catalog = cat;
  ruleset = rules;
  skuMap = new Map((catalog.items || []).map(it => [it.sku, it]));
}

function getInput(){
  return {
    region: $("region").value,
    amps: Number($("amps").value || 0),
    hz: Number($("hz").value),
    phase: $("phase").value,
    pins: Number($("pins").value),
    motor_voltage_vdc: Number($("motor_voltage_vdc").value),
    need_hawse_pipe: $("need_hawse_pipe").checked,
    routing_mode: $("routing_mode").value,
    has_bend_over_45: $("has_bend_over_45").checked,
    cable_length_m: Number($("cable_length_m").value),
    allow_fallback: $("allow_fallback").checked,
    connector_male: ($("connector_male").value || "").trim(),
    connector_female: ($("connector_female").value || "").trim(),
    cover: ($("cover").value || "").trim()
  };
}

function conditionMatch(when, input){
  // Supported conditions: field equality, *_in arrays, amps_gte, amps_lte
  for(const [k,v] of Object.entries(when || {})){
    if(k === "amps_gte"){
      if(!(input.amps >= v)) return false;
      continue;
    }
    if(k === "amps_lte"){
      if(!(input.amps <= v)) return false;
      continue;
    }
    if(k.endsWith("_in")){
      const field = k.slice(0, -3);
      if(!Array.isArray(v)) return false;
      if(!v.includes(input[field])) return false;
      continue;
    }
    // direct equality
    if(input[k] !== v) return false;
  }
  return true;
}

function addLine(lines, {sku, qty=1, note="", source="Glendinning", meta={}}){
  const item = skuMap.get(sku);
  const desc = item?.name || item?.description_search || item?.description || "(SKU non trovato in catalogo)";
  lines.push({
    sku,
    description: desc,
    qty,
    note,
    source,
    meta
  });
}

function buildBOM(input){
  const lines = [];
  const notes = [];

  // Apply rules in order
  for(const rule of (ruleset.rules || [])){
    if(!conditionMatch(rule.when, input)) continue;

    const then = rule.then || {};
    for(const it of (then.add_items || [])){
      addLine(lines, {sku: it.sku, qty: it.qty ?? 1, note: it.note || ""});
    }

    for(const cb of (then.add_cable || [])){
      const len = cb.length_m?.from_input ? input[cb.length_m.from_input] : null;
      const note = (cb.note || "") + (len ? ` | Lunghezza: ${len} m` : "");
      addLine(lines, {sku: cb.sku, qty: cb.qty ?? 1, note, meta: {length_m: len}});
    }

    for(const ph of (then.add_placeholders || [])){
      addLine(lines, {
        sku: ph.key.toUpperCase(),
        qty: 1,
        note: ph.label || "Da definire",
        source: "Da definire",
        meta: {placeholder: true, key: ph.key}
      });
    }

    for(const n of (then.notes || [])){
      notes.push(n);
    }
  }

  // Optional: user manually entered connectors (fallback or manual fill)
  // If user filled any of these, replace placeholder rows (if exist) with actual SKU lines.
  const manual = [
    {key:"connector_male", label:"Spina maschio", value: input.connector_male},
    {key:"connector_female", label:"Presa femmina", value: input.connector_female},
    {key:"cover", label:"Cover/ghiera", value: input.cover}
  ];
  for(const m of manual){
    if(!m.value) continue;

    // Remove placeholder line matching key if present
    const idx = lines.findIndex(l => l.meta?.placeholder && l.meta?.key === m.key);
    if(idx >= 0) lines.splice(idx, 1);

    // Add actual line
    const source = input.allow_fallback ? "Manuale (fallback ammesso)" : "Manuale";
    addLine(lines, {sku: m.value, qty: 1, note: `${m.label} inserita manualmente`, source});
  }

  // Dedupe by sku + note (simple merge)
  const merged = new Map();
  for(const ln of lines){
    const key = `${ln.sku}|||${ln.note}|||${ln.source}`;
    if(!merged.has(key)){
      merged.set(key, {...ln});
    }else{
      merged.get(key).qty += ln.qty;
    }
  }

  // Sort: Glendinning first, placeholders last
  const out = Array.from(merged.values()).sort((a,b)=>{
    const aP = a.source === "Da definire";
    const bP = b.source === "Da definire";
    if(aP !== bP) return aP ? 1 : -1;
    return a.sku.localeCompare(b.sku);
  });

  // Automatic sanity notes for the known dataset gaps
  if(out.some(x => x.source === "Da definire")){
    notes.push("Alcuni componenti (es. spina/presa 125A 5P) non risultano nel catalogo Glendinning caricato: definire lo standard e/o abilitare fallback.");
  }

  return {lines: out, notes};
}

function renderBOM(bom, input){
  const tbody = $("bomTable").querySelector("tbody");
  tbody.innerHTML = "";

  if(!bom.lines.length){
    tbody.innerHTML = `<tr><td colspan="5" class="muted">Nessuna regola applicata con questi input. Prova a cambiare corrente/fasi/pin o aggiungi dati.</td></tr>`;
    $("btnExportCsv").disabled = true;
    $("btnCopy").disabled = true;
    return;
  }

  for(const ln of bom.lines){
    const tr = document.createElement("tr");
    const tdSku = document.createElement("td");
    tdSku.textContent = ln.sku;

    const tdDesc = document.createElement("td");
    tdDesc.textContent = ln.description;

    const tdQty = document.createElement("td");
    tdQty.textContent = String(ln.qty);

    const tdNote = document.createElement("td");
    tdNote.textContent = ln.note || "";

    const tdSrc = document.createElement("td");
    tdSrc.textContent = ln.source || "Glendinning";

    tr.append(tdSku, tdDesc, tdQty, tdNote, tdSrc);
    tbody.appendChild(tr);
  }

  const meta = `Input: ${input.amps}A • ${input.hz}Hz • ${input.phase} • ${input.pins} pin • ${input.motor_voltage_vdc}VDC • Cavo ${input.cable_length_m}m`;
  $("bomMeta").textContent = meta;

  const notesList = $("notesList");
  notesList.innerHTML = "";
  (bom.notes || []).forEach(n=>{
    const li = document.createElement("li");
    li.textContent = n;
    notesList.appendChild(li);
  });

  $("btnExportCsv").disabled = false;
  $("btnCopy").disabled = false;
}

function bomToCSV(bom){
  const esc = (s) => `"${String(s ?? "").replaceAll('"','""')}"`;
  const header = ["SKU","Descrizione","Quantità","Note","Fonte"].map(esc).join(",");
  const rows = bom.lines.map(l => [
    l.sku, l.description, l.qty, l.note, l.source
  ].map(esc).join(","));
  return [header, ...rows].join("\n");
}

async function copyBOM(bom){
  const lines = bom.lines.map(l => `${l.qty}x\t${l.sku}\t${l.description}\t${l.note ? "— "+l.note : ""}`.trim());
  const text = lines.join("\n");
  await navigator.clipboard.writeText(text);
}

function toggleBendCheckbox(){
  const mode = $("routing_mode").value;
  const bend = $("has_bend_over_45");
  bend.disabled = (mode !== "pvc_with_bends");
  if(bend.disabled) bend.checked = false;
}

function resetForm(){
  $("region").value = "EU";
  $("amps").value = 125;
  $("hz").value = 50;
  $("phase").value = "3PH";
  $("pins").value = 5;
  $("motor_voltage_vdc").value = 24;
  $("need_hawse_pipe").checked = true;
  $("allow_fallback").checked = false;
  $("routing_mode").value = "direct";
  $("has_bend_over_45").checked = false;
  $("cable_length_m").value = 20;
  $("connector_male").value = "";
  $("connector_female").value = "";
  $("cover").value = "";
  toggleBendCheckbox();

  $("bomMeta").textContent = "";
  $("notesList").innerHTML = "";
  const tbody = $("bomTable").querySelector("tbody");
  tbody.innerHTML = `<tr><td colspan="5" class="muted">Compila i dati e premi “Genera BOM”.</td></tr>`;
  $("btnExportCsv").disabled = true;
  $("btnCopy").disabled = true;
  setStatus("Reset eseguito.", "ok");
}

async function initPWA(){
  // service worker
  if("serviceWorker" in navigator){
    try{
      await navigator.serviceWorker.register("./sw.js");
    }catch(e){
      console.warn("SW registration failed", e);
    }
  }

  // install prompt
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = $("btnInstall");
    btn.hidden = false;
  });

  $("btnInstall").addEventListener("click", async () => {
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    $("btnInstall").hidden = true;
  });
}

async function main(){
  setStatus("Caricamento dati…");
  await loadData();
  setStatus("Pronto. Inserisci i dati e genera la BOM.", "ok");

  toggleBendCheckbox();
  $("routing_mode").addEventListener("change", toggleBendCheckbox);
  $("btnReset").addEventListener("click", resetForm);

  $("baseForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = getInput();

    if(!catalog || !ruleset){
      setStatus("Dati non caricati. Ricarica la pagina.", "bad");
      return;
    }

    // Run BOM generation
    const bom = buildBOM(input);
    lastBOM = bom;
    renderBOM(bom, input);

    // Status
    const hasPlaceholder = bom.lines.some(l => l.source === "Da definire");
    if(hasPlaceholder && !input.allow_fallback){
      setStatus("BOM generata. Alcune righe sono 'da definire' (mancano codici primari).", "warn");
    }else{
      setStatus("BOM generata.", "ok");
    }
  });

  $("btnExportCsv").addEventListener("click", () => {
    if(!lastBOM) return;
    const csv = bomToCSV(lastBOM);
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ts = new Date().toISOString().slice(0,19).replaceAll(":","").replace("T","_");
    a.download = `BOM_Cablemaster_${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  $("btnCopy").addEventListener("click", async () => {
    if(!lastBOM) return;
    try{
      await copyBOM(lastBOM);
      setStatus("BOM copiata negli appunti.", "ok");
    }catch(e){
      setStatus("Impossibile copiare (permessi browser). Usa Export CSV.", "warn");
    }
  });

  await initPWA();
}

main().catch(err => {
  console.error(err);
  setStatus("Errore nel caricamento. Controlla console.", "bad");
});
