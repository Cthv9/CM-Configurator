// ═══════════════════════════════════════════════
// GLENDINNING CABLEMASTER™ CONFIGURATOR — APP
// ═══════════════════════════════════════════════

const D = CONFIG; // alias

// ── STATE ──────────────────────────────────────
const state = {
  step: 1,
  market: 'USA',   // 'USA' | 'EU'
  model: null,     // e.g. 'CM4'
  cable: null,     // e.g. '30A_10-3_Y'
  cableLength_m: 15,
  plug: null,      // e.g. '30A_125V'
  hawse: null,     // e.g. '04050' | 'none' | 'optional_ss'
  container: null  // e.g. '85424'
};

const STEPS = [
  { num:1, label:'Motore' },
  { num:2, label:'Cavo' },
  { num:3, label:'Spina' },
  { num:4, label:'Hawse Pipe' },
  { num:5, label:'Contenitore' },
  { num:6, label:'Riepilogo' }
];

// ── HELPERS ────────────────────────────────────
const $ = id => document.getElementById(id);
const mToFt = m => (m * 3.28084).toFixed(0);
const mmToIn = mm => (mm / 25.4).toFixed(2);
const icon = svg => svg;

function infoBox(html) {
  return `<div class="info-box">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
    <span>${html}</span>
  </div>`;
}

function compatNote(type, text) {
  return `<div class="compat-note"><div class="compat-dot ${type}"></div>${text}</div>`;
}

function getModel() { return D.MODELS.find(m => m.id === state.model); }

function getCablesForModel() {
  const m = getModel(); if (!m) return [];
  return m.cables.filter(cid => {
    const c = D.CABLES[cid];
    if (!c) return false;
    return state.market === 'USA' ? c.market === 'USA' : c.market === 'EU';
  });
}

function getHawseForModel() {
  const m = getModel(); if (!m) return [];
  if (m.hawse_optional) return [];
  return m.hawse
    .map(hid => D.HAWSE[hid])
    .filter(h => {
      if (!h) return false;
      const cable = D.CABLES[state.cable];
      if (!cable) return true;
      return cable.od_mm <= h.fits_od_max_mm;
    });
}

function getContainersForConfig() {
  const m = getModel(); if (!m) return [];
  return m.containers
    .map(cid => ({ id: cid, ...D.CONTAINERS[cid] }))
    .filter(c => c.max_length_m >= state.cableLength_m);
}

function getExcludedContainers() {
  const m = getModel(); if (!m) return [];
  return m.containers
    .map(cid => ({ id: cid, ...D.CONTAINERS[cid] }))
    .filter(c => c.max_length_m < state.cableLength_m);
}

function getPlugsForCable() {
  const c = D.CABLES[state.cable]; if (!c) return [];
  return c.plug_ids.map(pid => ({ id: pid, ...D.PLUGS[pid] }));
}

// ── RENDER ENGINE ──────────────────────────────
function render() {
  renderProgress();
  const main = $('mainContent');
  main.innerHTML = '';
  const fns = [null, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6];
  const binds = [null, bindStep1, bindStep2, bindStep3, bindStep4, bindStep5, bindStep6];
  main.innerHTML = fns[state.step]();
  binds[state.step]();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderProgress() {
  const bar = $('progressBar');
  let html = '';
  STEPS.forEach((s, i) => {
    const done   = s.num < state.step;
    const active = s.num === state.step;
    const cc = done ? 'done' : active ? 'active' : '';
    const icon = done ? '✓' : s.num;
    if (i > 0) {
      const lineDone = s.num - 1 < state.step;
      html += `<div class="step-line ${lineDone ? 'done' : ''}"></div>`;
    }
    html += `<div class="step-node ${cc}" onclick="goToStep(${s.num})">
      <div class="step-circle ${cc}">${icon}</div>
      <div class="step-label">${s.label}</div>
    </div>`;
  });
  bar.innerHTML = html;
}

function goToStep(n) {
  if (n < state.step) { state.step = n; render(); }
}
function nextStep() { if (state.step < 6) { state.step++; render(); } }
function prevStep() { if (state.step > 1) { state.step--; render(); } }
function restart() {
  Object.assign(state, { step:1, model:null, cable:null, cableLength_m:15, plug:null, hawse:null, container:null });
  render();
}

// ── STEP 1: MOTORE ─────────────────────────────
function renderStep1() {
  const marketToggle = `<div class="market-toggle">
    <button class="market-btn ${state.market==='USA'?'active':''}" onclick="setMarket('USA')">🇺🇸 USA</button>
    <button class="market-btn ${state.market==='EU'?'active':''}" onclick="setMarket('EU')">🇪🇺 EU</button>
  </div>`;

  const cards = D.MODELS.map(m => {
    const ampLabel = state.market === 'USA' ? m.amp_us : m.amp_eu;
    return `<div class="card ${state.model===m.id?'selected':''}" data-id="${m.id}">
      <div class="card-check">${state.model===m.id?'✓':''}</div>
      <div class="card-model">${m.label}</div>
      <div class="card-amp">${ampLabel} · ${m.voltage}</div>
      <div class="card-desc">${m.desc}</div>
      <div class="card-od">OD ${m.od_min_mm}–${m.od_max_mm}mm</div>
    </div>`;
  }).join('');

  return `
  <div class="section-head">
    <div class="section-tag">Step 01 / 05</div>
    <div class="section-title">Scegli il motore</div>
    <div class="section-sub">Il modello determina la corrente gestibile e le dimensioni del cavo compatibile. Seleziona prima il mercato di destinazione.</div>
  </div>
  ${marketToggle}
  <div class="cards-grid">${cards}</div>
  <div class="nav-row">
    <button class="btn btn-primary" id="s1next" ${!state.model?'disabled':''} onclick="nextStep()">Avanti — Scegli il cavo →</button>
  </div>`;
}
function bindStep1() {
  document.querySelectorAll('.card[data-id]').forEach(el => {
    el.addEventListener('click', () => {
      state.model = el.dataset.id;
      state.cable = null; state.plug = null; state.hawse = null; state.container = null;
      render();
    });
  });
}
window.setMarket = (m) => {
  state.market = m;
  state.cable = null; state.plug = null; state.hawse = null; state.container = null;
  render();
};

// ── STEP 2: CAVO ───────────────────────────────
function renderStep2() {
  const available = getCablesForModel();
  const selectedCable = D.CABLES[state.cable];
  const isUflex = selectedCable?.brand === 'UFLEX';
  const model = getModel();

  // Max length for slider (in meters)
  const maxLen = state.market === 'EU' ? 60 : 30;
  const minLen = 5;
  const pct = ((state.cableLength_m - minLen) / (maxLen - minLen)) * 100;

  const cableCards = available.map(cid => {
    const c = D.CABLES[cid];
    if (!c) return '';
    const brandBadge = c.brand !== 'Glendinning'
      ? `<div class="card-brand">${c.brand}</div>` : '';
    return `<div class="card wide ${state.cable===cid?'selected':''}" data-cable="${cid}">
      <div class="card-check">${state.cable===cid?'✓':''}</div>
      <div class="card-model" style="font-size:1.15rem;line-height:1.2">${c.label}</div>
      <div class="card-amp">${c.market} · ${c.volt}V</div>
      ${brandBadge}
      <div class="card-desc">${c.desc}</div>
      <div class="card-od">OD ≈ ${c.od_mm}mm (${mmToIn(c.od_mm)}")</div>
    </div>`;
  }).join('');

  // Length selector: UFLEX = fixed buttons, Glendinning = slider
  let lengthBlock = '';
  if (state.cable) {
    if (isUflex && selectedCable.uflex_table) {
      const btns = Object.keys(selectedCable.uflex_table).map(l => {
        const lm = parseInt(l);
        return `<button class="len-btn ${state.cableLength_m===lm?'active':''}" onclick="setLen(${lm})">${lm}m <span style="opacity:.6;font-size:.75em">(${mToFt(lm)}ft)</span></button>`;
      }).join('');
      const partForLen = selectedCable.uflex_table[state.cableLength_m] || Object.values(selectedCable.uflex_table)[0];
      lengthBlock = `<div class="length-block">
        <div class="length-label">Lunghezza cavo — Lunghezze disponibili UFLEX</div>
        <div class="length-options">${btns}</div>
        <div class="compat-note" style="margin-top:12px">
          <div class="compat-dot"></div> Part number selezionato: <strong style="color:var(--blue-bright);margin-left:4px">${partForLen}</strong>
        </div>
      </div>`;
    } else if (selectedCable) {
      const fixedLengths = selectedCable.lengths_m;
      let sliderHtml = '';
      if (fixedLengths && fixedLengths.length > 0) {
        const btns = fixedLengths.map(l =>
          `<button class="len-btn ${state.cableLength_m===l?'active':''}" onclick="setLen(${l})">${l}m <span style="opacity:.6;font-size:.75em">(${mToFt(l)}ft)</span></button>`
        ).join('');
        sliderHtml = `<div class="length-options">${btns}</div>`;
        if (selectedCable.length_custom) {
          sliderHtml += `<div class="compat-note" style="margin-top:10px"><div class="compat-dot warn"></div>Lunghezze personalizzate disponibili su richiesta</div>`;
        }
      }
      const mouldedNote = selectedCable.molded_parts && selectedCable.molded_parts[state.cableLength_m]
        ? infoBox(`Disponibile con <strong>spina preformata integrata</strong>: Part <strong>${selectedCable.molded_parts[state.cableLength_m]}</strong>`)
        : '';
      lengthBlock = `<div class="length-block">
        <div class="length-label">Lunghezza cavo richiesta</div>
        <div class="length-display">${state.cableLength_m}m<sup>(${mToFt(state.cableLength_m)}ft)</sup></div>
        ${sliderHtml}
        ${mouldedNote}
      </div>`;
    }
  }

  return `
  <div class="section-head">
    <div class="section-tag">Step 02 / 05 — ${state.model} · ${state.market}</div>
    <div class="section-title">Tipo e lunghezza cavo</div>
    <div class="section-sub">Visualizzi solo i cavi compatibili con ${state.model} per mercato ${state.market}.</div>
  </div>
  <div class="cards-grid wide">${cableCards}</div>
  ${state.cable ? lengthBlock : ''}
  <div class="nav-row">
    <button class="btn btn-ghost" onclick="prevStep()">← Indietro</button>
    <button class="btn btn-primary" ${!state.cable?'disabled':''} onclick="nextStep()">Avanti — Spina →</button>
  </div>`;
}
function bindStep2() {
  document.querySelectorAll('.card[data-cable]').forEach(el => {
    el.addEventListener('click', () => {
      state.cable = el.dataset.cable;
      const c = D.CABLES[state.cable];
      // auto-set first available length
      if (c?.uflex_table) {
        state.cableLength_m = parseInt(Object.keys(c.uflex_table)[0]);
      } else if (c?.lengths_m?.length) {
        state.cableLength_m = c.lengths_m[0];
      }
      state.plug = null; state.hawse = null; state.container = null;
      render();
    });
  });
}
window.setLen = (l) => {
  state.cableLength_m = l;
  state.container = null;
  render();
};

// ── STEP 3: SPINA ──────────────────────────────
function renderStep3() {
  const plugs = getPlugsForCable();
  const cable = D.CABLES[state.cable];

  const plugCards = plugs.map(p => {
    const coverNote = p.cover ? compatNote('warn', `Copri-spina disponibile: <strong>${p.cover.part}</strong> — ${p.cover.label}`) : '';
    const coverWNote = p.cover_w ? compatNote('warn', `Copri-spina bianco: <strong>${p.cover_w.part}</strong> — ${p.cover_w.label}`) : '';
    const altNote = p.alt ? compatNote('', `Alternativa: <strong>${p.alt.part}</strong> — ${p.alt.label}`) : '';
    return `<div class="card wide ${state.plug===p.id?'selected':''}" data-plug="${p.id}">
      <div class="card-check">${state.plug===p.id?'✓':''}</div>
      <div class="card-model" style="font-size:1.05rem;line-height:1.25">${p.label}</div>
      <div class="card-amp">${p.part}</div>
      <div class="card-desc">${p.desc}</div>
      ${coverNote}${coverWNote}${altNote}
    </div>`;
  }).join('');

  const mouldedNote = cable?.molded_parts
    ? infoBox(`Disponibile anche come <strong>cavo con spina preformata</strong> (es. ${Object.values(cable.molded_parts)[0]}). Già incluso nel riepilogo se selezionato al passo precedente.`)
    : '';

  return `
  <div class="section-head">
    <div class="section-tag">Step 03 / 05 — ${state.model} · ${cable?.label}</div>
    <div class="section-title">Spina &amp; accessori</div>
    <div class="section-sub">Spine compatibili con il cavo selezionato. I copri-spina saranno inclusi nel riepilogo finale.</div>
  </div>
  ${mouldedNote}
  <div class="cards-grid wide">${plugCards}</div>
  <div class="nav-row">
    <button class="btn btn-ghost" onclick="prevStep()">← Indietro</button>
    <button class="btn btn-primary" ${!state.plug?'disabled':''} onclick="nextStep()">Avanti — Hawse Pipe →</button>
  </div>`;
}
function bindStep3() {
  document.querySelectorAll('.card[data-plug]').forEach(el => {
    el.addEventListener('click', () => {
      state.plug = el.dataset.plug;
      state.hawse = null; state.container = null;
      render();
    });
  });
}

// ── STEP 4: HAWSE PIPE ─────────────────────────
function renderStep4() {
  const model = getModel();
  const hawseList = getHawseForModel();
  const isOptional = !!model?.hawse_optional;
  const cable = D.CABLES[state.cable];

  let cards = '';
  if (isOptional) {
    cards = `
    <div class="card wide ${state.hawse==='none'?'selected':''}" data-hawse="none">
      <div class="card-check">${state.hawse==='none'?'✓':''}</div>
      <div class="card-model" style="font-size:1.1rem">Senza Hawse Pipe</div>
      <div class="card-amp">Standard CM9</div>
      <div class="card-desc">Installazione senza hawse pipe. Protezione ingresso acqua da valutare in fase di installazione.</div>
    </div>
    <div class="card wide ${state.hawse==='04097-6'?'selected':''}" data-hawse="04097-6">
      <div class="card-check">${state.hawse==='04097-6'?'✓':''}</div>
      <div class="card-model" style="font-size:1.1rem">Hawse Pipe CM9 — Alluminio</div>
      <div class="card-amp">04097-6 — Opzionale</div>
      <div class="card-desc">Hawse Pipe in alluminio anodizzato per CM9. Ø est. 215mm, ID Ø190mm, lunghezza 328mm.</div>
      ${compatNote('warn', 'Disponibile su richiesta — contattare Glendinning')}
    </div>`;
  } else {
    if (hawseList.length === 0) {
      cards = infoBox(`Nessun Hawse Pipe standard compatibile con cavo OD ${cable?.od_mm}mm. Contattare Glendinning.`);
    } else {
      cards = hawseList.map(h => {
        return `<div class="card wide ${state.hawse===h.part?'selected':''}" data-hawse="${h.part}">
          <div class="card-check">${state.hawse===h.part?'✓':''}</div>
          <div class="card-model" style="font-size:1rem;line-height:1.3">${h.label}</div>
          <div class="card-amp">${h.part}</div>
          <div class="card-desc">${h.desc}</div>
          ${compatNote('', h.note)}
        </div>`;
      }).join('');
    }
  }

  const cm8note = model?.optional_kit
    ? infoBox(`<strong>Optional CM8:</strong> ${model.optional_kit.label} (${model.optional_kit.part}) — ${model.optional_kit.desc}`)
    : '';

  return `
  <div class="section-head">
    <div class="section-tag">Step 04 / 05 — ${state.model}</div>
    <div class="section-title">Hawse Pipe</div>
    <div class="section-sub">Alloggiamento stagna IP67 che ospita la spina quando il cavo è completamente retratto.${isOptional?' Per CM9 è opzionale.':''}</div>
  </div>
  ${cm8note}
  <div class="cards-grid wide">${cards}</div>
  <div class="nav-row">
    <button class="btn btn-ghost" onclick="prevStep()">← Indietro</button>
    <button class="btn btn-primary" ${!state.hawse?'disabled':''} onclick="nextStep()">Avanti — Contenitore →</button>
  </div>`;
}
function bindStep4() {
  document.querySelectorAll('.card[data-hawse]').forEach(el => {
    el.addEventListener('click', () => {
      state.hawse = el.dataset.hawse;
      state.container = null;
      render();
    });
  });
}

// ── STEP 5: CONTENITORE ────────────────────────
function renderStep5() {
  const available = getContainersForConfig();
  const excluded = getExcludedContainers();
  const cable = D.CABLES[state.cable];

  const avCards = available.map(c => {
    return `<div class="card ${state.container===c.id?'selected':''}" data-container="${c.id}">
      <div class="card-check">${state.container===c.id?'✓':''}</div>
      <div class="card-model" style="font-size:1.5rem">${c.label}</div>
      <div class="card-amp">${c.part}</div>
      <div class="card-desc">${c.dim_mm}</div>
      <div class="card-od">${c.cap_label}</div>
      ${c.note ? compatNote('warn', c.note) : ''}
    </div>`;
  }).join('');

  const exCards = excluded.map(c => {
    return `<div class="card disabled">
      <div class="card-model" style="font-size:1.5rem;opacity:.5">${c.label}</div>
      <div class="card-amp">${c.part}</div>
      <div class="card-desc">${c.dim_mm}</div>
      <div class="card-od" style="color:var(--danger)">Max ${c.max_length_m}m — insufficiente per ${state.cableLength_m}m</div>
    </div>`;
  }).join('');

  const noItems = available.length === 0
    ? infoBox(`Nessun contenitore standard compatibile con ${state.cableLength_m}m per ${state.model}. Ridurre la lunghezza o contattare Glendinning.`)
    : '';

  return `
  <div class="section-head">
    <div class="section-tag">Step 05 / 05 — ${state.model} · ${state.cableLength_m}m (${mToFt(state.cableLength_m)}ft)</div>
    <div class="section-title">Contenitore di stoccaggio</div>
    <div class="section-sub">Contenitori Styrene compatibili con la lunghezza cavo di <strong>${state.cableLength_m}m</strong> selezionata. I contenitori in grigio hanno capacità insufficiente.</div>
  </div>
  ${noItems}
  <div class="cards-grid">${avCards}${exCards}</div>
  <div class="nav-row">
    <button class="btn btn-ghost" onclick="prevStep()">← Indietro</button>
    <button class="btn btn-gold" ${!state.container?'disabled':''} onclick="nextStep()">Visualizza Riepilogo →</button>
  </div>`;
}
function bindStep5() {
  document.querySelectorAll('.card[data-container]').forEach(el => {
    el.addEventListener('click', () => {
      state.container = el.dataset.container;
      render();
    });
  });
}

// ── STEP 6: RIEPILOGO ──────────────────────────
function buildPartsList() {
  const parts = [];
  const m = getModel();
  const c = D.CABLES[state.cable];
  const p = D.PLUGS[state.plug];
  const h = D.HAWSE[state.hawse];
  const cont = D.CONTAINERS[state.container];

  // Motore
  parts.push({
    cat: 'Motore',
    code: state.model,
    name: `Cablemaster™ ${state.model} — ${state.market==='USA'?m.amp_us:m.amp_eu} · ${m.voltage}`
  });

  // Cavo
  if (c) {
    let codeDisplay = c.part;
    if (c.uflex_table && c.uflex_table[state.cableLength_m]) {
      codeDisplay = c.uflex_table[state.cableLength_m];
    }
    // Molded plug override
    if (c.molded_parts && c.molded_parts[state.cableLength_m]) {
      parts.push({
        cat: 'Cavo + Spina',
        code: c.molded_parts[state.cableLength_m],
        name: `${c.label} ${state.cableLength_m}m (${mToFt(state.cableLength_m)}ft) — con spina preformata integrata`
      });
    } else {
      parts.push({
        cat: 'Cavo',
        code: codeDisplay,
        name: `${c.label} — ${state.cableLength_m}m (${mToFt(state.cableLength_m)}ft)`
      });
      // Spina
      if (p) {
        if (p.part && p.part !== 'Contattare Glendinning') {
          parts.push({ cat: 'Spina', code: p.part, name: p.desc });
          if (p.cover) parts.push({ cat: 'Accessorio', code: p.cover.part, name: p.cover.label });
        } else {
          parts.push({ cat: 'Spina', code: '—', name: p.desc });
        }
      }
    }
  }

  // Hawse
  if (h) {
    parts.push({ cat: 'Hawse Pipe', code: h.part, name: h.label });
  } else if (state.hawse === '04097-6') {
    parts.push({ cat: 'Hawse Pipe', code: '04097-6', name: 'Hawse Pipe CM9 Alluminio — su richiesta' });
  } else if (state.hawse === 'none') {
    parts.push({ cat: 'Hawse Pipe', code: '—', name: 'Non incluso (standard CM9)' });
  }

  // Contenitore
  if (cont) {
    parts.push({ cat: 'Contenitore', code: cont.part, name: `Contenitore Styrene ${cont.label} — ${cont.dim_mm}` });
  }

  return parts;
}

function renderStep6() {
  const m = getModel();
  const c = D.CABLES[state.cable];
  const cont = D.CONTAINERS[state.container];
  const parts = buildPartsList();

  const sumItems = [
    { label: 'Motore', value: state.model, sub: state.market==='USA'?m.amp_us:m.amp_eu },
    { label: 'Cavo', value: (c?.amp||'—')+'A', sub: `${state.cableLength_m}m` },
    { label: 'Spina', value: D.PLUGS[state.plug]?.part||'—', sub: '' },
    { label: 'Hawse Pipe', value: D.HAWSE[state.hawse]?.part || (state.hawse==='none'?'—':'04097-6'), sub: state.hawse==='none'?'Non incluso':'' },
    { label: 'Contenitore', value: cont?.part||'—', sub: cont?.label||'' }
  ];

  const pipelineHtml = sumItems.map((s,i) => `
    <div class="sum-item">
      ${i < sumItems.length-1 ? '<span class="sum-arrow">›</span>' : ''}
      <div class="sum-label">${s.label}</div>
      <div class="sum-value">${s.value}</div>
      <div class="sum-sub">${s.sub}</div>
    </div>`).join('');

  const tableRows = parts.map(p => `
    <tr>
      <td><span class="part-cat">${p.cat}</span></td>
      <td><span class="part-code">${p.code}</span></td>
      <td style="color:var(--white)">${p.name}</td>
    </tr>`).join('');

  return `
  <div class="section-head">
    <div class="section-tag">Configurazione completata — ${state.market}</div>
    <div class="section-title">Riepilogo</div>
    <div class="section-sub">La tua configurazione Cablemaster™. Copia la tabella per inviarla al tuo rivenditore.</div>
  </div>

  <div class="summary-pipeline">${pipelineHtml}</div>

  <div class="parts-section-title">Lista componenti con codici articolo</div>
  <table class="parts-table">
    <thead><tr><th>Categoria</th><th>Part No.</th><th>Descrizione</th></tr></thead>
    <tbody>${tableRows}</tbody>
  </table>

  <div class="copy-row">
    <button class="copy-btn" id="copyFull" onclick="copyTable()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      Copia tabella completa
    </button>
    <button class="copy-btn" id="copyPN" onclick="copyPartNumbers()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h3M4 17v3h3M20 7V4h-3M20 17v3h-3"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>
      Solo Part No.
    </button>
  </div>

  <button class="restart-btn" onclick="restart()">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
    Nuova configurazione
  </button>`;
}
function bindStep6() {}

// ── COPY ───────────────────────────────────────
window.copyTable = () => {
  const parts = buildPartsList();
  const m = getModel();
  const header = `Categoria\tPart No.\tDescrizione`;
  const rows = parts.map(p => `${p.cat}\t${p.code}\t${p.name}`).join('\n');
  const text = `Cablemaster™ Configurazione — ${state.model} · ${state.cableLength_m}m · ${state.market}\n\n${header}\n${rows}`;
  navigator.clipboard.writeText(text).then(() => {
    const btn = $('copyFull'); if (!btn) return;
    btn.textContent = '✓ Copiato!'; btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copia tabella completa'; btn.classList.remove('copied'); }, 2200);
  });
};
window.copyPartNumbers = () => {
  const parts = buildPartsList();
  navigator.clipboard.writeText(parts.map(p => `${p.code} — ${p.name}`).join('\n'));
  const btn = $('copyPN'); if (!btn) return;
  btn.textContent = '✓'; btn.classList.add('copied');
  setTimeout(() => { btn.textContent = 'Solo Part No.'; btn.classList.remove('copied'); }, 2000);
};

// ── INIT ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => render());
