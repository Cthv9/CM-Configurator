# Cablemaster™ Configurator — PWA

Configuratore prodotti Glendinning Cablemaster™. Sviluppato come Progressive Web App installabile su dispositivi mobili e desktop.

## Struttura file

```
cablemaster-pwa/
├── index.html          ← Entry point
├── manifest.json       ← PWA manifest
├── sw.js               ← Service Worker (offline support)
├── css/
│   └── style.css       ← Tutti gli stili
├── js/
│   └── app.js          ← Logica applicazione
├── data/
│   └── config.js       ← Dati: modelli, cavi, spine, hawse pipe, contenitori
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

## Deploy su GitHub Pages

1. Crea un repository su GitHub (es. `cablemaster-configurator`)
2. Carica tutti i file mantenendo la struttura delle cartelle
3. Vai su **Settings → Pages**
4. Seleziona **Branch: main** → **Root (/)** → Save
5. Dopo ~60 secondi la PWA è disponibile su:
   `https://tuousername.github.io/cablemaster-configurator/`

## Installazione come App

- **iOS**: Safari → Condividi → "Aggiungi alla schermata Home"
- **Android/Chrome**: banner automatico oppure Menu → "Installa app"
- **Desktop Chrome/Edge**: icona di installazione nella barra degli indirizzi

## Aggiornamento dati

Tutti i dati (modelli, cavi, part number) sono in **`data/config.js`**.
Per aggiornare prezzi, part number o aggiungere nuovi prodotti, modificare solo quel file.

## Versione

Rev 2 — Febbraio 2025  
Unità di misura: **metri** (conversione ft automatica)  
Cavi EU UFLEX inclusi con part number propri  
