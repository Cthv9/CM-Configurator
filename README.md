# Cablemaster Configuratore (v2)

## Cosa cambia rispetto all’MVP
- Niente campo “fornitore”: Glendinning è sempre primario.
- Preset importati dagli esempi `Righe*.xlsx` (prezzi ignorati).
- Wizard a step (Elettrico → Meccanico → Routing → BOM).
- Routing migliorato: lunghezza PVC, numero curve, angolo massimo → accessori/quantità indicative.
- BOM editabile: cambia quantità, sostituisci con equivalenti (Secondary), elimina righe.
- “Impara” sostituzioni: puoi memorizzare un override per casi simili (localStorage).

## Deploy su GitHub Pages
Copia questa cartella nella root del repo e abilita Pages su branch `main`.

## Dati
- `data/catalog.json` (da Articoli.xlsx)
- `data/rules.json` (regole base)
- `data/templates.json` (preset)
