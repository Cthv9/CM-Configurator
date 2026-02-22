# Configuratore Cablemaster™

Strumento interno per comporre distinte materiali (BOM) per sistemi Cablemaster. Funziona offline come PWA.

🔗 **[Apri online](https://cthv9.github.io/CM-Configurator/)**

---

## Come si usa

**Wizard** — guida passo-passo: scegli motore, tensione, cavo, connettori, hawse e contenitore. Alla fine ottieni una BOM editabile che puoi salvare, condividere via link o esportare in CSV.

**Kit preconfigurati** — configurazioni standard pronte all'uso. Puoi anche importare kit ricevuti via link.

**Catalogo** — ricerca libera su tutti gli articoli. Aggiunge direttamente alla BOM aperta.

---

## File del progetto

| File | Cosa contiene |
|---|---|
| `index.html` | Tutta l'app — UI, logica, wizard |
| `catalog.json` | **Unica fonte di verità** per gli articoli: motori, cavi, connettori, hawse, contenitori, kit preset |
| `rules.json` | Regole del wizard: vincoli (es. kit obbligatori) e suggerimenti automatici |
| `sw.js` | Service worker per cache offline |
| `manifest.webmanifest` | Configurazione PWA (icone, nome, tema) |

---

## Aggiornare il catalogo

Il modo normale è usare il pannello admin:

1. n/a
2. Modifica articoli inline, oppure importa un CSV (colonne: `Codice, Descrizione, Categoria`)
3. Clicca **Esporta catalog.json**
4. Sostituisci il file nel repo e fai push — gli utenti online ricevono i dati aggiornati al prossimo avvio

Per modifiche strutturali (nuovi tipi di connettore, nuove regole wizard) è più comodo editare `catalog.json` e `rules.json` direttamente.

---

## Aggiungere un articolo che appare automaticamente nel wizard

I cavi, connettori e hawse vengono proposti dal wizard tramite query sugli attributi — non su liste fisse di codici. Per aggiungere un articolo:

- **Cavo nuovo** → aggiungilo in `catalog.json` nel blocco `cavi` con `attrs.od`, `attrs.amp`, `attrs.gruppo_conn` corretti. Appare nel wizard di qualsiasi motore con OD compatibile.
- **Variante connettore** → aggiungilo nel gruppo connettore corrispondente in `connettori` (es. `alt_sp2` in `CONN_63A`). Appare come opzione nello step connettori.
- **Nuovo vincolo o suggerimento** → aggiungilo in `rules.json`. Il wizard lo valuta automaticamente senza toccare `index.html`.

---

## Avvio locale

```bash
python -m http.server 8000
```

Apri `http://localhost:8000/` — serve un server HTTP perché l'app carica `catalog.json` e `rules.json` via fetch.

> **Nota:** aprire `index.html` direttamente dal filesystem (doppio click) non funziona per via delle restrizioni CORS sui file locali.

---

## Deploy

Il progetto gira su GitHub Pages dalla branch `main`. Ogni push aggiorna automaticamente l'app online.

Dopo aver aggiornato `catalog.json`, il service worker distribuisce i dati nuovi a tutti gli utenti online al successivo avvio — senza bisogno di toccare `sw.js` o incrementare la versione cache.

---

*Sviluppato da DF · IT · Rev. 2 · 2026*
