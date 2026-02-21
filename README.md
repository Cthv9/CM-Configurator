# CM Configurator (Rev. 6)

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

## Deploy

Pubblicazione statica (es. GitHub Pages) puntando alla root del repository.

## Note operative

- Non esistono più cartelle `css/`, `js/`, `data/`, `icons/` in questa versione.
- Se cambi nome o path dei file, aggiorna anche `manifest.json` e `sw.js`.
