# 🍺 Beer Pong Bets

App di scommesse per un torneo di beer pong. Le partite si creano al momento, le quote si aggiornano
dopo ogni risultato e tutti i dispositivi vedono scommesse e classifica in tempo reale.

Pagina statica (HTML, CSS, JavaScript) con database Firebase Firestore. Nessun build, nessuna dipendenza da installare.

## Come funziona

- **Partite:** scegli due squadre, crea la partita, tocca la quota per scommettere. "Ha vinto" chiude la partita e paga.
- **Vincitore:** quote sul vincitore del torneo. Chi perde una partita è fuori. "Campioni" chiude le scommesse finali.
- **Classifica:** saldo di ogni scommettitore e storico delle schedine.
- **Setup:** aggiungi gli scommettitori (partono con 100 gettoni) e azzera tutto.
- **Quote:** calcolate con un punteggio Elo per squadra (parte da 1000, cambia a ogni partita), con un margine del 7%.
- **Saldi:** calcolati dalle scommesse registrate, così più persone possono scommettere insieme senza sovrascriversi.

## Installazione

### 1. Crea il database Firebase
1. Vai su [console.firebase.google.com](https://console.firebase.google.com) e crea un progetto (Analytics non serve).
2. Build > Firestore Database > Crea database, sede in Europa, modalità test.
3. Scheda Regole: incolla il contenuto di `firestore.rules` e pubblica.
4. Impostazioni progetto > Le tue app > `</>` (Web): registra l'app e copia `firebaseConfig`.

### 2. Configura l'app
Incolla i valori in `firebase-config.js` al posto di `INCOLLA_QUI`.

### 3. Pubblica con GitHub Pages
1. Carica il progetto su un repository GitHub.
2. Settings > Pages > Source: **Deploy from a branch**, branch `main`, cartella `/ (root)`.
3. Dopo un minuto il sito è su `https://<tuo-utente>.github.io/<nome-repo>/`. Condividi quel link.

Per provarlo in locale: `python3 -m http.server` e apri `http://localhost:8000`.

## Squadre

Le 19 squadre sono nell'array `NAMES` all'inizio di `app.js`. Modificalo per cambiare i partecipanti.
Il saldo iniziale è la costante `START`.

## Sicurezza

Le regole in `firestore.rules` permettono a chiunque abbia il link di leggere e scrivere: va bene per una serata tra amici.
A fine torneo elimina il progetto Firebase.

## Struttura

```
index.html          pagina
style.css           stile (chiaro e scuro)
app.js              logica, quote e sincronizzazione
firebase-config.js  dati del tuo progetto Firebase
firestore.rules     regole del database
```
