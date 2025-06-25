# Engichain Client

Un'applicazione React moderna per la gestione di entità e relazioni con certificazione blockchain.

## Caratteristiche

- 🔐 **Autenticazione AWS Cognito** - Sistema di autenticazione sicuro
- 📊 **Dashboard Interattiva** - Panoramica completa del sistema
- 🏷️ **Gestione Categorie** - Organizzazione strutturata dei dati
- 📝 **CRUD Entità** - Creazione, lettura, aggiornamento ed eliminazione di entità
- 🔗 **Gestione Relazioni** - Collegamento tra entità con etichette personalizzate
- 📈 **Visualizzazione Grafo** - Rappresentazione interattiva delle relazioni
- ⛓️ **Certificazione Blockchain** - Certificazione sicura su blockchain
- 📱 **Design Responsivo** - Interfaccia ottimizzata per tutti i dispositivi
- 🎨 **Material-UI** - Design moderno e consistente

## Tecnologie Utilizzate

- **React 18** - Framework frontend
- **React Router DOM** - Routing dell'applicazione
- **Material-UI (MUI)** - Libreria di componenti UI
- **Axios** - Client HTTP per API REST
- **AWS Amplify** - Autenticazione e servizi cloud
- **React Force Graph 2D** - Visualizzazione interattiva dei grafi
- **React Hook Form** - Gestione form con validazione
- **Yup** - Schema di validazione
- **React Toastify** - Notifiche utente

## Prerequisiti

- Node.js (versione 16 o superiore)
- npm o yarn
- Account AWS con Cognito configurato
- Backend Engichain in esecuzione

## Installazione

1. **Clona il repository**
   ```bash
   git clone <repository-url>
   cd engichain-client
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Configura l'ambiente**
   
   ⚠️ **IMPORTANTE**: Prima di utilizzare l'applicazione, devi configurare AWS Cognito.
   
   Modifica il file `src/config/environment.js` con le tue configurazioni:
   
   ```javascript
   const environment = {
     development: {
       BASE_URL: 'http://localhost:8080', // URL del tuo backend
       AWS_CONFIG: {
         region: 'us-east-1', // La tua regione AWS
         userPoolId: 'us-east-1_XXXXXXXXX', // Il tuo User Pool ID
         userPoolWebClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX' // Il tuo App Client ID
       },
       BLOCKCHAIN_TYPES: ['ETHEREUM', 'POLYGON']
     },
     production: {
       BASE_URL: 'https://your-production-api.com/api',
       AWS_CONFIG: {
         region: 'us-east-1', // La tua regione AWS
         userPoolId: 'us-east-1_XXXXXXXXX', // Il tuo User Pool ID
         userPoolWebClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX' // Il tuo App Client ID
       },
       BLOCKCHAIN_TYPES: ['ETHEREUM', 'POLYGON']
     }
   };
   ```
   
   📖 **Guida completa**: Vedi [AWS_SETUP.md](./AWS_SETUP.md) per istruzioni dettagliate sulla configurazione di AWS Cognito.

4. **Avvia l'applicazione**
   ```bash
   npm start
   ```

   L'applicazione sarà disponibile su `http://localhost:3000`

## Struttura del Progetto

```
engichain-client/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.js
│   │   │   └── ProtectedRoute.js
│   │   ├── Categories/
│   │   │   └── Categories.js
│   │   ├── Dashboard/
│   │   │   └── Dashboard.js
│   │   ├── Data/
│   │   │   ├── DataDetail.js
│   │   │   ├── DataForm.js
│   │   │   └── DataList.js
│   │   ├── Graph/
│   │   │   └── GraphView.js
│   │   └── Layout/
│   │       └── Layout.js
│   ├── config/
│   │   └── environment.js
│   ├── services/
│   │   ├── apiService.js
│   │   ├── authService.js
│   │   ├── blockchainService.js
│   │   ├── categoryService.js
│   │   ├── dataService.js
│   │   └── relationshipService.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## Funzionalità Principali

### 🔐 Autenticazione
- Login sicuro tramite AWS Cognito
- Gestione automatica dei token JWT
- Protezione delle rotte

### 📊 Dashboard
- Statistiche in tempo reale
- Panoramica delle entità
- Indicatori di certificazione
- Navigazione rapida

### 🏷️ Gestione Categorie
- Visualizzazione categorie disponibili
- Creazione rapida di nuove entità
- Indicatori di stato di certificazione

### 📝 Gestione Entità
- **Lista Entità**: Visualizzazione paginata con filtri
- **Creazione/Modifica**: Form dinamici basati sulla categoria
- **Dettagli**: Visualizzazione completa con relazioni
- **Upload File**: Supporto per allegati

### 🔗 Gestione Relazioni
- Creazione di collegamenti tra entità
- Etichette personalizzate per le relazioni
- Visualizzazione gerarchica

### 📈 Visualizzazione Grafo
- Grafo interattivo 2D
- Filtri per categoria
- Zoom e pan
- Modalità schermo intero
- Indicatori visivi per lo stato di certificazione

### ⛓️ Certificazione Blockchain
- Certificazione di entità, categorie e aziende
- Supporto per multiple blockchain
- Tracking dello stato di certificazione

## API Endpoints

L'applicazione si interfaccia con i seguenti endpoint del backend:

### Autenticazione
- Gestita tramite AWS Cognito

### Entità (Data)
- `POST /data` - Crea nuova entità
- `GET /data/category/{categoryId}` - Entità per categoria
- `GET /data/{id}` - Dettagli entità
- `GET /data/public/{id}` - Entità pubblica
- `PUT /data/{id}` - Aggiorna entità
- `DELETE /data/{id}` - Elimina entità
- `POST /data/{id}/publish` - Pubblica entità
- `POST /data/upload` - Upload file

### Categorie
- `GET /category` - Lista categorie
- `GET /category/{id}` - Dettagli categoria

### Relazioni
- `POST /relationship` - Crea relazione
- `POST /relationships` - Crea multiple relazioni
- `PUT /relationship/{id}` - Aggiorna relazione
- `DELETE /relationship/{id}` - Elimina relazione
- `GET /relationship/owner/{ownerId}` - Relazioni per proprietario

### Blockchain
- `POST /blockchain/certify-data/{id}` - Certifica entità
- `POST /blockchain/certify-category/{id}` - Certifica categoria
- `POST /blockchain/certify-company/{id}` - Certifica azienda

## Configurazione AWS Cognito

1. **Crea un User Pool** in AWS Cognito
2. **Configura un App Client** senza client secret
3. **Abilita i flussi di autenticazione** necessari
4. **Aggiorna** `src/config/environment.js` con i tuoi parametri

## Build per Produzione

```bash
npm run build
```

I file ottimizzati saranno generati nella cartella `build/`.

## Sviluppo

### Comandi Disponibili

- `npm start` - Avvia il server di sviluppo
- `npm run build` - Build per produzione
- `npm test` - Esegue i test
- `npm run eject` - Espone la configurazione webpack

### Convenzioni di Codice

- Utilizza componenti funzionali con hooks
- Segui le convenzioni di naming di React
- Mantieni i componenti piccoli e riutilizzabili
- Utilizza Material-UI per la consistenza del design

## Troubleshooting

### Problemi Comuni

1. **Errori di CORS**
   - Verifica che il backend sia configurato per accettare richieste dal frontend
   - Controlla la configurazione del proxy in `package.json`

2. **Errori di Autenticazione AWS Cognito**
   
   **Errore**: `Amplify has not been configured correctly`
   - ✅ Verifica che `src/config/environment.js` sia configurato correttamente
   - ✅ Controlla che i valori non contengano più `XXXXXXXXX`
   - ✅ Segui la guida in [AWS_SETUP.md](./AWS_SETUP.md)
   
   **Errore**: `NoUserPoolError: Authentication Error`
   - ✅ Verifica che il User Pool ID sia corretto
   - ✅ Controlla che la regione AWS sia quella giusta
   - ✅ Assicurati che l'App Client sia configurato senza client secret
   
   **Errore**: `User does not exist`
   - ✅ Crea un utente di test nel User Pool AWS
   - ✅ Verifica che l'email sia corretta
   - ✅ Controlla che l'utente sia confermato

3. **Problemi di Connessione API**
   - Verifica che il backend sia in esecuzione
   - Controlla l'URL base in `environment.js`
   - Verifica la configurazione CORS del backend

## Contribuire

1. Fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push del branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

## Supporto

Per supporto o domande, apri un issue nel repository o contatta il team di sviluppo.

---

**Engichain Client** - Gestione moderna di entità e relazioni con certificazione blockchain.