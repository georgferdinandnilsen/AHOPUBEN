# Prompt til en AI-assistent

Kopier alt under streken og lim inn i ChatGPT, Claude, Gemini eller lignende. Legg ved filene i mappen `app/` og dokumentet `OVERLEVERING.md`. Bytt ut det som står i klammer. Fyll inn hva du vil ha gjort under «Det jeg vil».

---

Du skal hjelpe meg, som ikke er utvikler, med en liten nettside-app for studentpuben AHO Puben i Oslo. Appen ligger allerede ute på https://ahopuben.no og kjører på pubens egen Cloudflare-konto. Gå sakte fram, ett steg om gangen, og vent på at jeg bekrefter før du går videre. Forklar hva hvert steg gjør i vanlig språk. Be meg aldri lime inn nøkler, tokens eller passord i denne samtalen. Si i stedet nøyaktig hvor de skal limes inn.

**Det jeg vil**
[Skriv hva du vil ha endret eller fikset, for eksempel «teksten på knappen skal være …», «varselet kommer ikke», «legg til et felt fra Notion».]

**Slik er appen satt opp i dag (ikke endre dette uten at jeg ber om det)**
- Cloudflare-kontoen er Puben@aho.no. `wrangler.toml` har `account_id = "77f20e19b9bd7a3edce234492a671146"`, KV-lageret `dca6ff3b0c344bac9e0a011740273863` og Custom Domains for ahopuben.no og www.ahopuben.no. Reserveadresse: aho-puben.aho-puben-app.workers.dev.
- Domenet ahopuben.no er registrert hos Domeneshop. Navnetjenerne peker til Cloudflare (isabel.ns.cloudflare.com og jeremy.ns.cloudflare.com).
- Alle hemmeligheter ligger allerede i Cloudflare: NOTION_TOKEN, NOTION_DB_ID, NOTION_SUGGEST_DB_ID, DEEPL_KEY, VAPID_PUBLIC, VAPID_PRIVATE. De skal ikke lages på nytt. Bytt aldri VAPID-nøklene, da slutter alle varsler å virke.
- Lag aldri et nytt KV-lager og endre aldri `account_id` eller KV-id. Da mister appen abonnementer, meldinger og styrekoder.

**Om koden**
- Én HTML-fil (`public/index.html`) og en Cloudflare Worker (`src/index.js` og `src/*.js`) i samme prosjekt. Worker-en serverer nettsiden og API-et med Workers Static Assets (`[assets]` i `wrangler.toml`).
- Innholdet kommer fra Notion via Notion API (en intern integrasjon). Databaser: Arrangementer (id 306fc4bc274d803fbcaac5b17542df12, flere datakilder), MEDLEMMER, Styremedlemmer og VAKTPLAN, pluss en infoside med manualer. Datakilde-id-ene står i `wrangler.toml` under `[vars]`. Notion-feltene for arrangementer: «Når», «Type arrangement», «Info til APP», «Bilde til APP», «Artist link APP».
- Engelsk oversetting via DeepL API. Push-varsler via Web Push med `@block65/webcrypto-web-push`. En cron (`0 * * * *`) sender varsler hver hele time; varselvalgene er `same` (samme dag kl 16) og `day` (dagen før kl 12), se `src/notify.js`.
- Samme `index.html` virker på telefon og PC (CSS fra 900 px bredde). Styret kan skjule «Bli medlem» (`POST /api/board/join`), se tall (`GET /api/board/stats`) og sende meldinger. Musikklenker tolkes i `src/music.js`.
- Uten NOTION_TOKEN kjører appen i eksempelmodus med tre oppdiktede arrangementer. Lokalt (`npx wrangler dev`) er det slik.

**Slik gjør vi en endring**
1. I app-mappen: `npm install` (første gang).
2. `npx wrangler login`, og logg inn med puben@aho.no. Sjekk med `npx wrangler whoami` at det står puben@aho.no før vi publiserer noe.
3. Gjør endringen i filene. Test lokalt med `npx wrangler dev` og åpne http://localhost:8787. Kjør testene: `node test/members.test.mjs`, `node test/notify.test.mjs`, `node test/notion.test.mjs` og `node test/music.test.mjs`.
4. Publiser med `npm run deploy`. Endringen er da ute på ahopuben.no med en gang (en hard oppdatering i nettleseren kan trengs).
5. Ved feil: se loggen med `npx wrangler tail`.

**Min situasjon**
- Operativsystem: [Mac / Windows]
- Har jeg installert Node.js: [ja / nei / vet ikke]
- Har jeg tilgang til Cloudflare-kontoen puben@aho.no: [ja / nei]

Start med å spørre meg hva jeg har gjort til nå, og gi meg så første steg.
