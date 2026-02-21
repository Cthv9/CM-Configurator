// ═══════════════════════════════════════════════
// GLENDINNING CABLEMASTER™ CONFIGURATOR DATA
// All dimensions in mm, lengths in meters
// ═══════════════════════════════════════════════

const CONFIG = {

  MODELS: [
    {
      id: 'CM4',
      label: 'CM4',
      amp_us: '30A', amp_eu: '32A',
      voltage: '12V / 24V DC',
      od_min_mm: 12, od_max_mm: 21,
      desc: 'Applicazioni 30A (USA) o 32A (EU). Compatto e versatile.',
      cables: ['30A_10-3_Y','30A_10-3_Y100E','30A_10-4_W','32A_EU_UFLEX'],
      hawse: ['04050','04055'],
      containers: ['85424','85420','85421'],
      current_check: { '12v': '4–6A', '24v': '3–4A' },
      part_complete_us: '05010', part_complete_eu: '05013'
    },
    {
      id: 'CM7',
      label: 'CM7',
      amp_us: '50A / 63A', amp_eu: '63A',
      voltage: '12V / 24V DC',
      od_min_mm: 21, od_max_mm: 29,
      desc: 'Applicazioni 50A o 63A (USA) / 63A (EU). Con hawse 04093 accetta cavi fino a OD 42mm.',
      cables: ['50A_6-3_Y','50A_6-3_W','50A_6-4_Y','50A_6-4_W','63A_4-3_Y','63A_EU_UFLEX_3','63A_EU_UFLEX_4'],
      hawse: ['04050','04055','04093'],
      containers: ['85420','85421','85425_std'],
      current_check: { '12v': '8–10A', '24v': '5–6A' },
      part_complete_us: '04020', part_complete_eu: '04022'
    },
    {
      id: 'CM8',
      label: 'CM8',
      amp_us: '100A', amp_eu: '125A',
      voltage: '24V DC',
      od_min_mm: 29, od_max_mm: 42,
      desc: 'Applicazioni 100A (USA) o 125A (EU). Solo 24V DC. Accetta cavi fino a OD 42mm.',
      cables: ['100A_2-4_Y','100A_2-4_W','100A_2-3_Y','100A_2-5_Y','100A_2-5_W','100A_1-0_4_Y','125A_EU_UFLEX'],
      hawse: ['04093'],
      containers: ['85425_std','85426','85480'],
      current_check: { '24v': '5–7A' },
      part_complete_us: '04091', part_complete_eu: '04094',
      optional_kit: { part: '04070-1', label: 'Low Profile Mount Kit', desc: 'Riduce altezza di 89mm (da 457mm a 366mm). Staffa superiore: 50006-1.' }
    },
    {
      id: 'CM9',
      label: 'CM9',
      amp_us: '150A+', amp_eu: '200A+',
      voltage: '24V DC',
      od_min_mm: 36, od_max_mm: 58,
      desc: 'Applicazioni 150A+ (USA) / 200A+ (EU). Cavi di grande sezione. Solo 24V DC.',
      cables: ['150A_TypeW_2-4','177A_TypeW_1-0_4','200A_EU_custom'],
      hawse: [],
      hawse_optional: true,
      hawse_opt_part: '04097-6',
      containers: ['85426','85480'],
      current_check: { '24v': '5–7A' },
      part_complete_us: '04097'
    }
  ],

  CABLES: {
    // ══════════════════════════════════════════
    // CM4 — 30A USA / 32A EU
    // OD massimo Hawse 04050/04055: 29mm
    // ══════════════════════════════════════════
    '30A_10-3_Y': {
      label: '30A 600V #10/3 STOW — Giallo',
      amp: 30, volt: 600, gauge: '10/3 (5.26mm²)', market: 'USA',
      brand: 'Glendinning',
      part: '94006',
      od_mm: 16.9,  // 0.665" ±.010"
      colors: ['Giallo'],
      desc: 'Shore power 30A, 3 cond., guaina gialla PVC. UL/CSA STOW.',
      plug_ids: ['30A_125V'],
      lengths_m: [15, 20, 25, 30],
      length_custom: true
    },
    '30A_10-3_Y100E': {
      label: '30A 600V #10/3 Superflex 100E — Giallo',
      amp: 30, volt: 600, gauge: '10/3 (5.26mm²)', market: 'USA',
      brand: 'Glendinning',
      part: '94006-Y100E',
      od_mm: 13.1,  // 0.515" ±.015"
      colors: ['Giallo'],
      desc: 'Shore power 30A, 3 cond., guaina gialla PVC Superflex 105°C. Diametro ridotto.',
      plug_ids: ['30A_125V'],
      lengths_m: [15, 20, 25, 30],
      length_custom: true
    },
    '30A_10-4_W': {
      label: '30A 600V #10/4 STOW — Bianco',
      amp: 30, volt: 600, gauge: '10/4 (5.26mm²)', market: 'USA',
      brand: 'Glendinning',
      part: '94010',
      od_mm: 16.9,
      colors: ['Bianco'],
      desc: 'Shore power 30A 4 conduttori (Nero/Bianco/Verde/Rosso), guaina bianca PVC. UL/CSA.',
      plug_ids: ['30A_125V'],
      lengths_m: [15, 20, 25, 30],
      length_custom: true
    },
    '32A_EU_UFLEX': {
      label: '32A 250V 3×4mm² EU — UFLEX',
      amp: 32, volt: 250, gauge: '3×4mm²', market: 'EU',
      brand: 'UFLEX',
      part: '69847B',
      od_mm: 17,
      colors: ['Nero'],
      desc: 'Cavo shore power 32A EU, 3×4mm², guaina nera — UFLEX. Disponibile 20/30/60m.',
      plug_ids: ['32A_EU'],
      lengths_m: [20, 30, 60],
      length_custom: false,
      uflex_table: { 20: '69847B', 30: '67311W', 60: '69848D' }
    },

    // ══════════════════════════════════════════
    // CM7 — 50A USA / 63A EU
    // OD max Hawse 04050/04055: 29mm
    // OD max Hawse 04093 (CM8 HP): 42mm
    // ══════════════════════════════════════════
    '50A_6-3_Y': {
      label: '50A 600V #6/3 STOW — Giallo',
      amp: 50, volt: 600, gauge: '6/3 (13.3mm²)', market: 'USA',
      brand: 'Glendinning',
      part: '94004',
      od_mm: 25.4,  // 1.000" ±.012"
      colors: ['Giallo'],
      desc: 'Shore power 50A 3 conduttori (no neutro), guaina gialla PVC. UL/CSA.',
      plug_ids: ['50A_125V'],
      lengths_m: [15, 20, 25, 60],
      length_custom: true
    },
    '50A_6-3_W': {
      label: '50A 600V #6/3 STOW — Bianco',
      amp: 50, volt: 600, gauge: '6/3 (13.3mm²)', market: 'USA',
      brand: 'Glendinning',
      part: '94008',
      od_mm: 25.4,  // 1.000" ±.012"
      colors: ['Bianco'],
      desc: 'Shore power 50A 3 conduttori, guaina bianca PVC. UL/CSA.',
      plug_ids: ['50A_125V'],
      lengths_m: [15, 20, 25],
      length_custom: true
    },
    '50A_6-4_Y': {
      label: '50A 600V #6/4 STOW — Giallo',
      amp: 50, volt: 600, gauge: '6/4 (13.3mm²)', market: 'USA',
      brand: 'Glendinning',
      part: '94005',
      od_mm: 28.4,  // 1.120" ±.014"
      colors: ['Giallo'],
      desc: 'Shore power 50A 4 conduttori (con neutro), guaina gialla PVC. UL/CSA.',
      plug_ids: ['50A_125-250V'],
      lengths_m: [20, 60],
      length_custom: true,
      molded_parts: { '15': '04420-Y-50', '23': '04420-Y-75', '30': '04420-Y-100' }
    },
    '50A_6-4_W': {
      label: '50A 600V #6/4 STOW — Bianco',
      amp: 50, volt: 600, gauge: '6/4 (13.3mm²)', market: 'USA',
      brand: 'Glendinning',
      part: '94007',
      od_mm: 28.4,  // 1.120" ±.014"
      colors: ['Bianco'],
      desc: 'Shore power 50A 4 conduttori, guaina bianca PVC. UL/CSA.',
      plug_ids: ['50A_125-250V'],
      lengths_m: [20],
      length_custom: true,
      molded_parts: { '15': '04420-W-50', '23': '04420-W-75', '30': '04420-W-100' }
    },
    '63A_4-3_Y': {
      label: '63A 600V #4/3 SEOOW — Giallo',
      amp: 63, volt: 600, gauge: '4/3 (21mm²)', market: 'USA',
      brand: 'Glendinning',
      part: '94031-Y',
      od_mm: 22.4,  // 0.88" dia.
      colors: ['Giallo'],
      desc: 'Shore power 63A, 3 cond., SEOOW RoHS, −50°C a 105°C. Blu/Marrone/Verde-giallo.',
      plug_ids: ['63A_125-250V'],
      lengths_m: [15, 20, 25, 30],
      length_custom: true
    },
    '63A_EU_UFLEX_3': {
      label: '63A 250V 3×16mm² EU — UFLEX',
      amp: 63, volt: 250, gauge: '3×16mm²', market: 'EU',
      brand: 'UFLEX',
      part: '68911C',
      od_mm: 27,
      colors: ['Giallo'],
      desc: 'Cavo shore power 63A EU, 3×16mm², guaina gialla — UFLEX. Disponibile 20/60m.',
      plug_ids: ['63A_EU'],
      lengths_m: [20, 60],
      length_custom: false,
      uflex_table: { 20: '68911C', 60: '69600P' }
    },
    '63A_EU_UFLEX_4': {
      label: '63A 250V 4×16mm² EU — UFLEX',
      amp: 63, volt: 250, gauge: '4×16mm²', market: 'EU',
      brand: 'UFLEX',
      part: '69599J',
      od_mm: 28,
      colors: ['Giallo'],
      desc: 'Cavo shore power 63A EU, 4×16mm², guaina gialla — UFLEX. Disponibile 20/60m.',
      plug_ids: ['63A_EU'],
      lengths_m: [20, 60],
      length_custom: false,
      uflex_table: { 20: '69599J', 60: '69598G' }
    },

    // ══════════════════════════════════════════
    // CM8 — 100A USA / 125A EU
    // OD max Hawse 04093: 42mm
    // ══════════════════════════════════════════
    '100A_2-4_Y': {
      label: '100A 600V #2/4 STOW — Giallo',
      amp: 100, volt: 600, gauge: '2/4 (33.62mm²)', market: 'USA',
      brand: 'Glendinning',
      part: '94014-Y',
      od_mm: 35.3,  // 1.390" Nom.
      colors: ['Giallo'],
      desc: 'Shore power 100A 4 conduttori (Rosso/Verde/Bianco/Nero), guaina gialla. UL/CSA.',
      plug_ids: ['100A_1PH'],
      lengths_m: [20, 25, 30, 35],
      length_custom: true
    },
    '100A_2-4_W': {
      label: '100A 600V #2/4 STOW — Bianco',
      amp: 100, volt: 600, gauge: '2/4 (33.62mm²)', market: 'USA',
      brand: 'Glendinning',
      part: '94014-W',
      od_mm: 35.3,  // 1.390" Nom.
      colors: ['Bianco'],
      desc: 'Shore power 100A 4 conduttori (Rosso/Verde/Bianco/Nero), guaina bianca. UL/CSA/FT2.',
      plug_ids: ['100A_1PH'],
      lengths_m: [20, 25, 30, 35],
      length_custom: true
    },
    '100A_2-3_Y': {
      label: '100A 600V #2/3 STOW IsoTrans — Giallo',
      amp: 100, volt: 600, gauge: '2/3 (33.62mm²)', market: 'USA',
      brand: 'Glendinning',
      part: '94013-Y',
      od_mm: 31.8,  // 1.250" Nom.
      colors: ['Giallo'],
      desc: 'Shore power 100A 3 cond. per trasformatore di isolamento (NO NEUTRO). UL/CSA.',
      plug_ids: ['100A_1PH'],
      lengths_m: [20, 25, 30],
      length_custom: true
    },
    '100A_2-5_Y': {
      label: '100A 600V #2/5 STOW 3-fase — Giallo',
      amp: 100, volt: '600 3Ph', gauge: '2/5 (33.62mm²)', market: 'USA',
      brand: 'Glendinning',
      part: '94017-Y',
      od_mm: 38.1,  // circa, 5 cond.
      colors: ['Giallo'],
      desc: 'Shore power 100A 5 conduttori trifase (Nero/Rosso/Blu/Bianco/Verde). UL/CSA.',
      plug_ids: ['100A_3PH'],
      lengths_m: [20, 25, 30],
      length_custom: true
    },
    '100A_1-0_4_Y': {
      label: '200A 600V 1/0 AWG #4 — Giallo',
      amp: 200, volt: 600, gauge: '1/0 × 4 (53.5mm²)', market: 'USA',
      brand: 'Coleman Cable',
      part: '30256',
      od_mm: 45.2,  // 1.780" Nom.
      colors: ['Giallo'],
      desc: 'Shore power 1/0 AWG 4 cond., guaina gialla TPE, 205A nominale. UL/CSA. Coleman Cable 30256.',
      plug_ids: ['100A_3PH'],
      lengths_m: [20, 25, 30],
      length_custom: true
    },
    '100A_2-5_W': {
      label: '100A 600V #2/5 STOW 3-fase — Bianco',
      amp: 100, volt: '600 3Ph', gauge: '2/5 (33.62mm²)', market: 'USA',
      brand: 'Glendinning',
      part: 'SC37110',
      od_mm: 40.5,
      colors: ['Bianco'],
      desc: 'Shore power 100A 5 conduttori trifase, guaina bianca. Listino: 17-SC37110.',
      plug_ids: ['100A_3PH'],
      lengths_m: [20, 25, 30],
      length_custom: true
    },
    '125A_EU_UFLEX': {
      label: '100A 250V 4×25mm² EU — UFLEX',
      amp: 100, volt: 250, gauge: '4×25mm²', market: 'EU',
      brand: 'UFLEX',
      part: '20920J',
      od_mm: 42,
      colors: ['Nero'],
      desc: 'Cavo shore power 100A EU, 4×25mm², guaina nera — UFLEX. Disponibile 20/60m.',
      plug_ids: ['100A_EU'],
      lengths_m: [20, 60],
      length_custom: false,
      uflex_table: { 20: '20920J', 60: '20921L' }
    },

    // ══════════════════════════════════════════
    // CM9 — 150A+ / 200A+
    // ══════════════════════════════════════════
    '150A_TypeW_2-4': {
      label: '150A Type W Super Vu-Tron® #2/4 — Nero',
      amp: 152, volt: 600, gauge: '2 AWG × 4 (33.62mm²)', market: 'USA',
      brand: 'General Cable Carol',
      part: '81664',
      od_mm: 36.5,  // Type W #2/4 ~1.435"
      colors: ['Nero'],
      desc: 'Super Vu-Tron® Type W, 4 cond. 2 AWG, −40°C a 90°C. Disponibile 25/30/60m.',
      plug_ids: ['150A_CUSTOM'],
      lengths_m: [25, 30, 60],
      length_custom: true,
      // Listino codes: 17-81664-25, 17-81664-30, 17-81664-60
      listino_table: { 25: '17-81664-25', 30: '17-81664-30', 60: '17-81664-60' }
    },
    '177A_TypeW_1-0_4': {
      label: '177A Type W Super Vu-Tron® #1/0 — Nero',
      amp: 177, volt: 600, gauge: '1/0 AWG × 4 (53.5mm²)', market: 'USA',
      brand: 'General Cable Carol',
      part: '81384',
      od_mm: 43.3,  // 1.705" Nom.
      colors: ['Nero'],
      desc: 'Super Vu-Tron® Type W, 4 cond. 1/0 AWG, −40°C a 90°C. Disponibile 20/30m.',
      plug_ids: ['150A_CUSTOM'],
      lengths_m: [20, 30],
      length_custom: true,
      listino_table: { 20: '17-81384-20', 30: '17-SC81374-30' }
    },
    '150A_SOOW_4-3': {
      label: '63A SOOW #4/3 3 cond. — Nero',
      amp: 70, volt: 600, gauge: '4 AWG × 3 (21mm²)', market: 'USA',
      brand: 'SOOW',
      part: 'SOOW-4/3',
      od_mm: 23.2,  // 0.915" OD
      colors: ['Nero'],
      desc: 'SOOW 600V 4 AWG 3 conduttori (Nero/Bianco/Verde). Cavo per CRM63 reel. −40°C a 90°C.',
      plug_ids: ['63A_125-250V'],
      lengths_m: [15, 20, 25, 30],
      length_custom: true
    },
    '200A_EU_custom': {
      label: '200A+ EU — su richiesta',
      amp: 200, volt: 250, gauge: '—', market: 'EU',
      brand: 'Su richiesta',
      part: 'Custom',
      od_mm: 55,
      colors: ['—'],
      desc: 'Cavo alta corrente EU per applicazioni speciali. Contattare Glendinning.',
      plug_ids: ['200A_EU_CUSTOM'],
      lengths_m: [],
      length_custom: true
    }
  },

  PLUGS: {
    '30A_125V': {
      label: 'Spina 30A 125V — USA',
      part: '99411',
      desc: 'Plug 30A 125V 2P+T maschio. Ex 17-66817A.',
      cover: { part: '99412', label: 'Cappuccio protezione 30A' }
    },
    '32A_EU': {
      label: 'Spina 32A 250V 2P+T — EU',
      part: '99437',
      desc: 'Spina europea 32A 250V 2P+T maschio IP44.',
      alt: { part: '99437-B', label: 'Alternativa: 32A 250V 2P+T IP65 (versione large)' },
      cover: null
    },
    '50A_125V': {
      label: 'Spina 50A 125V 2P+T — USA',
      part: '99409',
      desc: 'Spina 50A 125V 2P+T maschio. Ex 17-66778T.',
      cover: { part: '99415', label: 'Cappuccio protezione 50A' }
    },
    '50A_125-250V': {
      label: 'Spina 50A 125/250V 3P+T — USA',
      part: '99408',
      desc: 'Spina 50A 125/250V 3P+T maschio. Ex 16-99408.',
      cover: { part: '99410', label: 'Cappuccio protezione 50A 3P+T' },
      cover_w: { part: '99423', label: 'Cappuccio protezione 50A — Bianco' }
    },
    '63A_125-250V': {
      label: 'Spina 63A 1PH 2P+T — USA',
      part: '66787U',
      desc: 'Spina 63A 115/230V 1PH 2P+T maschio. Ex 17-66787U.',
      alt: { part: '66790G', label: 'Alternativa: 63A 1PH/3PH 3P+T (ex 17-66790G)' },
      cover: { part: '66771C', label: 'Cappuccio protezione 63A' }
    },
    '63A_EU': {
      label: 'Spina 63A 2P+T IP67 — EU',
      part: '99461-P',
      desc: 'Spina europea 63A 2 Pole+T IP67 maschio.',
      alt: { part: '99439-P', label: 'Alternativa: 63A IP65 Twistlock' },
      cover: null
    },
    '100A_1PH': {
      label: 'Spina 100A 120/240V 3P+T — USA',
      part: '99423',
      desc: 'Spina 100A 120/240V 3P+T maschio. Ex 16-99423.',
      cover: null,
      alt: { part: '1442A', label: 'EU: 100A 230V 3P+T MKN (ex 17-1442A)' }
    },
    '100A_3PH': {
      label: 'Spina 100A 208/230V 3PH 3P+T+N — USA',
      part: '99424P',
      desc: 'Spina 100A 208/230V trifase 3P+T+N maschio. Ex 16-99424P.',
      cover: null,
      alt: { part: '3374', label: 'EU: 100A 400V 3PH 3P+T MKN (ex 17-3374)' }
    },
    '100A_EU': {
      label: 'Spina 100A EU — contattare',
      part: 'Contattare Glendinning',
      desc: 'Spina 100A EU per applicazioni speciali. Disponibili varianti 230V e 400V.',
      cover: null
    },
    '150A_CUSTOM': {
      label: 'Spina 150A DS9 — custom',
      part: 'MCH3998013',
      desc: 'Spina mobile DS9 metallo 150A 380V 3PH 3P+T. Impugnatura neoprenex: MCH319A013.',
      cover: null,
      alt: { part: 'MEMR3928013', label: 'Alternativa: DS2 250A 400V 3P+T (MCH/MEMR)' }
    },
    '200A_EU_CUSTOM': {
      label: 'Spina 250A DS2 — custom',
      part: 'MEMR3928013',
      desc: 'Spina DS2 metallo 250A 400V 3PH 3P+T + impugnatura passacavo MEMR392A913.',
      cover: null
    }
  },

  HAWSE: {
    '04050': {
      label: 'Hawse Pipe Assembly — Standard',
      part: '04050',
      desc: 'Acciaio inox. IP67 con cavo retratto. Include push-button in-limit switch.',
      fits_od_max_mm: 21,
      models: ['CM4','CM7'],
      note: 'Standard per CM4 / CM7 fino a cavi 50A'
    },
    '04055': {
      label: 'Hawse Pipe + Guide Roller In-Limit',
      part: '04055',
      desc: 'Hawse Pipe con Guide Roller In-Limit Switch Assembly. Per cavi con spine preformate.',
      fits_od_max_mm: 21,
      models: ['CM4','CM7'],
      note: 'Consigliato con cavi a spina preformata 30/50A'
    },
    '04093': {
      label: 'Hawse Pipe — CM8',
      part: '04093',
      desc: 'Hawse Pipe CM8. Dim: 203mm × 377mm. ID adatto a cavi fino a OD 42mm.',
      fits_od_max_mm: 42,
      models: ['CM7','CM8'],
      note: 'Per CM7 con spine 50A di grandi dimensioni e per tutti i CM8'
    },
    '04097-6': {
      label: 'Hawse Pipe — CM9 Alluminio',
      part: '04097-6',
      desc: 'Hawse Pipe in alluminio anodizzato per CM9. Ø ext 215mm, ID Ø190mm, L328mm.',
      fits_od_max_mm: 60,
      models: ['CM9'],
      note: 'Opzionale per CM9 — su richiesta'
    }
  },

  CONTAINERS: {
    '85424': {
      part: '85424',
      label: '18"×18"',
      dim_mm: '457 Ø × 457 H',
      cap_label: 'Fino a 18m di cavo #6/4',
      max_length_m: 18,
      models: ['CM4','CM7']
    },
    '85420': {
      part: '85420',
      label: '20"×18"',
      dim_mm: '508 Ø × 457 H',
      cap_label: 'Fino a 23m di cavo #6/4',
      max_length_m: 23,
      models: ['CM4','CM7']
    },
    '85421': {
      part: '85421',
      label: '22"×15"',
      dim_mm: '559 Ø × 381 H',
      cap_label: 'Fino a 23m di cavo #6/4 (profilo basso)',
      max_length_m: 23,
      models: ['CM4','CM7']
    },
    '85425_std': {
      part: '85425',
      label: '22"×22"',
      dim_mm: '559 Ø × 559 H',
      cap_label: 'Fino a 33m di cavo #6/4',
      max_length_m: 33,
      models: ['CM7']
    },
    '85426': {
      part: '85426',
      label: '26"×34"',
      dim_mm: '660 Ø × 864 H',
      cap_label: 'Fino a 30m di cavo #2/4 (grande formato)',
      max_length_m: 30,
      models: ['CM8','CM9']
    },
    '85480': {
      part: '85480',
      label: '25"×35" — 100A',
      dim_mm: '660 Ø × 890 H',
      cap_label: 'Fino a 25m di cavo #2/4. Può essere tagliato a 610mm H (25m)',
      max_length_m: 30,
      models: ['CM8','CM9'],
      note: 'Tagliabile a H 610mm per installazioni low profile — 82ft (25m) #2/4'
    }
  }
};

// Export for module environments, or expose globally
if (typeof module !== 'undefined') module.exports = CONFIG;
