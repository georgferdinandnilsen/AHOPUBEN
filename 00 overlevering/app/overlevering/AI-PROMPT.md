# Prompt til en AI-assistent

Kopier alt under streken og lim inn i ChatGPT, Claude, Gemini eller lignende. Legg gjerne ved filene i mappen `app/` og dokumentet `OVERLEVERING.md`. Bytt ut det som står i klammer.

---

Du skal hjelpe meg, som ikke er utvikler, med å flytte en liten nettside-app til mine egne kontoer. Gå sakte fram, ett steg om gangen, og vent på at jeg bekrefter før du går videre. Forklar hva hvert steg gjør i vanlig språk. Be meg aldri lime inn nøkler, tokens eller passord i denne samtalen. Si i stedet nøyaktig hvor de skal limes inn.

**Om appen**
- Det er en «progressive web app» for en studentpub, AHO Puben i Oslo. Én HTML-fil (`public/index.html`) og en Cloudflare Worker (`src/index.js` og `src/*.js`) i samme prosjekt. Worker-en serverer nettsiden og API-et, og bruker Workers Static Assets (`[assets]` i `wrangler.toml`).
- Innholdet kommer fra Notion via Notion API (en intern integrasjon). Databaser: Arrangementer (id 306fc4bc274d803fbcaac5b17542df12, flere datakilder), MEDLEMMER, Styremedlemmer og VAKTPLAN, pluss en infoside med manualer. Datakilde-id-ene står i `wrangler.toml` under `[vars]`.
- Engelsk oversetting via DeepL API (gratis Developer-plan). Push-varsler via Web Push (VAPID-nøkler) med biblioteket `@block65/webcrypto-web-push`. Småting lagres i Cloudflare KV (binding `KV`). En cron (`0 * * * *`) sender varsler hver hele time.
- Hemmeligheter som må settes med `npx wrangler secret put`: NOTION_TOKEN, NOTION_DB_ID, NOTION_SUGGEST_DB_ID, DEEPL_KEY, VAPID_PUBLIC, VAPID_PRIVATE. VAPID-nøkler lages med `npm run vapid` (kjører `web-push generate-vapid-keys`).
- Kommandoer: `npm install`, `npx wrangler login`, `npx wrangler kv namespace create KV`, `npm run deploy`, `npx wrangler tail` for logg, `node test/members.test.mjs` for tester.
- Uten NOTION_TOKEN kjører appen i eksempelmodus med tre oppdiktede arrangementer. Det er slik man ser at Notion-koblingen mangler.

**Det jeg vil**
[Velg: «Sette opp alt på nytt på min egen Cloudflare-konto, med ny Notion-integrasjon og ny DeepL-nøkkel» eller «Overta tilgangen til eksisterende kontoer».]

**Min situasjon**
- Operativsystem: [Mac / Windows]
- Har jeg installert Node.js: [ja / nei / vet ikke]
- Har jeg en Cloudflare-konto: [ja / nei]
- Er jeg administrator i Notion-arbeidsområdet AHO PUB: [ja / nei]

Start med å spørre meg hva jeg har gjort til nå, og gi meg så første steg.
