# CM Configurator (Rev. 2)

Configuratore Cablemaster in versione **single-file**: tutta la logica UI e i dati principali sono in `index.html`.

## File presenti

- `index.html` → applicazione completa (UI + logica + dataset)
- `manifest.json` → manifest PWA allineato alla struttura attuale
- `sw.js` → service worker per cache offline di base
- `README.md` → questa documentazione

## Avvio locale

```bash
python3 -m http.server 8000
```
Poi apri: `http://localhost:8000/`

## Avvio online

https://cthv9.github.io/CM-Configurator/
