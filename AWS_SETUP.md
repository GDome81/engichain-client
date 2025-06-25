# Configurazione AWS Cognito per Engichain Client

Questo documento ti guida nella configurazione di AWS Cognito per l'autenticazione nell'applicazione Engichain Client.

## Prerequisiti

- Account AWS attivo
- Accesso alla console AWS
- Permessi per creare e gestire risorse Cognito

## Passo 1: Creare un User Pool

1. **Accedi alla Console AWS**
   - Vai su [AWS Console](https://console.aws.amazon.com/)
   - Cerca "Cognito" nei servizi

2. **Crea un nuovo User Pool**
   - Clicca su "Create user pool"
   - Scegli "Email" come attributo di sign-in
   - Configura le password policies secondo le tue necessità

3. **Configura gli attributi**
   - Seleziona "Email" come attributo richiesto
   - Aggiungi altri attributi se necessario (nome, cognome, etc.)

4. **Configura le politiche**
   - Imposta le politiche di password
   - Configura MFA se necessario (opzionale per sviluppo)

5. **Configura i messaggi**
   - Personalizza i messaggi di verifica email
   - Configura i template se necessario

6. **Crea il User Pool**
   - Rivedi le impostazioni
   - Clicca "Create user pool"
   - **Annota il User Pool ID** (formato: `us-east-1_XXXXXXXXX`)

## Passo 2: Creare un App Client

1. **Vai al tuo User Pool**
   - Seleziona il User Pool appena creato
   - Vai alla sezione "App integration"

2. **Crea un App Client**
   - Clicca "Create app client"
   - Scegli "Public client" (per applicazioni frontend)
   - Nome: `engichain-client`

3. **Configura l'App Client**
   - **NON** generare un client secret (importante per app frontend)
   - Abilita i seguenti flussi di autenticazione:
     - `ALLOW_USER_SRP_AUTH`
     - `ALLOW_REFRESH_TOKEN_AUTH`
   - Imposta token expiration secondo le tue necessità

4. **Salva l'App Client**
   - **Annota l'App Client ID** (formato: `XXXXXXXXXXXXXXXXXXXXXXXXXX`)

## Passo 3: Configurare l'applicazione

1. **Apri il file di configurazione**
   ```
   src/config/environment.js
   ```

2. **Aggiorna i parametri AWS**
   ```javascript
   const environment = {
     development: {
       BASE_URL: 'http://localhost:8080',
       AWS_CONFIG: {
         region: 'us-east-1', // La tua regione AWS
         userPoolId: 'us-east-1_XXXXXXXXX', // Il tuo User Pool ID
         userPoolWebClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX' // Il tuo App Client ID
       },
       BLOCKCHAIN_TYPES: ['ETHEREUM', 'POLYGON']
     },
     // ... configurazione production
   };
   ```

3. **Sostituisci i valori**
   - `region`: La regione AWS dove hai creato il User Pool (es. `us-east-1`, `eu-west-1`)
   - `userPoolId`: L'ID del User Pool dal Passo 1
   - `userPoolWebClientId`: L'ID dell'App Client dal Passo 2

## Passo 4: Testare la configurazione

1. **Riavvia l'applicazione**
   ```bash
   npm start
   ```

2. **Verifica la console**
   - Non dovrebbero più apparire errori di configurazione AWS
   - Il warning "⚠️ AWS Cognito non è configurato correttamente" dovrebbe scomparire

3. **Testa il login**
   - Vai alla pagina di login
   - Prova a registrare un nuovo utente o fare login

## Passo 5: Creare un utente di test (Opzionale)

1. **Dalla Console AWS**
   - Vai al tuo User Pool
   - Sezione "Users"
   - Clicca "Create user"

2. **Configura l'utente**
   - Email: `test@example.com`
   - Password temporanea: `TempPass123!`
   - Marca "Send an invitation to this new user?"

3. **Conferma l'utente**
   - L'utente riceverà un'email di verifica
   - Oppure puoi confermarlo manualmente dalla console

## Risoluzione Problemi

### Errore: "User does not exist"
- Verifica che l'utente sia stato creato nel User Pool corretto
- Controlla che l'email sia corretta

### Errore: "Invalid user pool configuration"
- Verifica che tutti i parametri in `environment.js` siano corretti
- Controlla che la regione sia quella giusta

### Errore: "Access denied"
- Verifica che l'App Client abbia i flussi di autenticazione corretti abilitati
- Controlla che non ci sia un client secret configurato

### Errore CORS
- Aggiungi il dominio dell'applicazione (es. `http://localhost:3000`) nelle impostazioni CORS del tuo backend

## Configurazione per Produzione

1. **Crea un User Pool separato** per produzione
2. **Aggiorna la configurazione** in `environment.js` per l'ambiente production
3. **Configura un dominio personalizzato** per Cognito (opzionale)
4. **Abilita MFA** per maggiore sicurezza

## Risorse Utili

- [Documentazione AWS Cognito](https://docs.aws.amazon.com/cognito/)
- [AWS Amplify Authentication](https://docs.amplify.aws/lib/auth/getting-started/)
- [Cognito User Pool Settings](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings.html)

---

**Nota**: Mantieni sempre riservati i tuoi ID e chiavi AWS. Non condividerli mai pubblicamente o commitarli nel repository.