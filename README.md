# Cablemaster Configuratore (MVP)

## Deploy su GitHub Pages
1. Crea un repo (es. `cablemaster-configurator`)
2. Copia il contenuto di questa cartella nella root del repo:
   - `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest`
   - cartella `data/` con i JSON
   - cartella `assets/` con le icone
3. GitHub: Settings → Pages → Deploy from branch → `main` / root
4. Apri l'URL Pages.

## Dati
- `data/catalog.glendinning.core.json` (articoli)
- `data/rules.glendinning.v0.json` (regole + domande)

## Estendere
- Aggiungi items al catalogo
- Aggiungi regole in `rules.glendinning.v0.json`
- Il motore supporta: uguaglianze, `amps_gte`, `amps_lte`, e `<campo>_in`
