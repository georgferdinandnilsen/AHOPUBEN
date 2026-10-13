# AHO Pub Arrangementer

Nettside som lagres på Hjem-skjerm. Viser neste arrangement, kalender og sender push-varsler.
Styret skriver kun i Notion. Én Cloudflare Worker serverer appen og API-et.

```
public/        appen (index.html, sw.js, manifest, ikoner)
src/index.js   Worker: Notion → arrangementer, DeepL → engelsk, Web Push, forslag → Notion
wrangler.toml  Cloudflare-oppsett (KV, cron hver time, statiske filer)
docs/intent/   beslutninger og designprinsipper
```

## Kjør lokalt

```bash
npm install
npm run dev
```

Åpne http://localhost:8787. Uten nøkler kjører Worker-en i eksempelmodus (tre arrangementer, forslag lagres ikke, push er av).

## Oppsett i produksjon (gjøres én gang)

1. **Notion-integrasjon.** Gå til notion.so/profile/integrations, lag en intern integrasjon, kopier token.
   Åpne databasen «Arrangementer» i Notion → `…` → Connections → legg til integrasjonen. Gjør det samme med forslag-databasen.
   Database-id er de 32 tegnene i URL-en: `306fc4bc274d803fbcaac5b17542df12`. Databasen har to datakilder, og appen velger dem selv:
   - **Arrangementer** (datakilden med datofeltet «Når»). Et arrangement vises i appen hvis det har en dato i «Når» fra i dag og utover, som visningen «Kommende».
     - **Type:** feltet «Type arrangement» (Aktivitet, DJ og så videre). Typen «Rolig Pub» regnes som vanlig pub uten program.
     - **Bilde:** feltet «Bilde til APP». Uten bilde brukes et generisk bilde med logoen.
     - **Info:** feltet «Info til APP». Er feltene tomme, leses bildet og teksten fra selve siden i stedet.
   - **Forslag** fra appen opprettes i samme datakilde som arrangementene: forslaget som tittel (feltet «Kommende»), «Bestemt» satt til Nei, uten dato og uten type, og «fortell mer» og navn som tekst inne på siden. De vises dermed i visningen «Ideer» og ikke i appen, siden appen krever dato i «Når». Datakilden «New data source» (Name, beskrivelse, nummer, potensiell dato?) brukes ikke av appen.
   Notion-integrasjonen må være koblet til siden som inneholder databasen (Connections), ellers svarer Notion 404.
2. **DeepL.** Velg planen Developer (gratis) på deepl.com/pro-api. Den gir en engangskreditt på 1 million tegn, som holder i flere tiår til arrangementstekster. Appen finner selv riktig API-adresse for nøkkelen.
3. **VAPID-nøkler** for push:
   ```bash
   npm run vapid
   ```
4. **Cloudflare.**
   ```bash
   npx wrangler login
   npx wrangler kv namespace create KV
   ```
   Lim id-en inn i `wrangler.toml` under `[[kv_namespaces]]`. Legg inn hemmelighetene:
   ```bash
   npx wrangler secret put NOTION_TOKEN
   npx wrangler secret put NOTION_DB_ID
   npx wrangler secret put NOTION_SUGGEST_DB_ID
   npx wrangler secret put DEEPL_KEY
   npx wrangler secret put VAPID_PUBLIC
   npx wrangler secret put VAPID_PRIVATE
   ```
5. **Deploy.**
   ```bash
   npm run deploy
   ```
   Adressen blir `https://aho-puben.<konto>.workers.dev`. Eget domene kan legges til i Cloudflare-panelet.

## Medlemsdelen (bartendere)

Nederst i varselmenyen logger medlemmer inn med telefonnummer. Nummeret sjekkes mot MEDLEMMER i Notion, og medlemskapet må ikke være utløpt (feltet «How long do you want to be a member?»). Innloggede får en pille nederst på forsiden som åpner arket:

- **Vakter:** egne vakter fra VAKTPLAN (Åpnevakt 19-22, Stengevakt 22-01), med ansvarlig styremedlem og kolleger med ring-knapp. «Legg alle vakter i kalender» er et kalenderabonnement som følger Notion. Varsel om vakt kl 19 dagen før og én time før.
- **Manualer:** barnesidene under overskriften HOW-TO på infosiden, vist i appen og oppdatert innen ti minutter.
- **Meldinger:** meldinger fra styret. Siste melding vises øverst i Vakter-fanen i 48 timer. Under aktiv vakt vises «Obs for kvelden» i stedet.

**Feil lagret nummer:** etter tre mislykkede forsøk vises «Rett det med e-posten din» under feilmeldingen. E-posten slås opp i MEDLEMMER, og det nye nummeret skrives inn i Phone-feltet på medlemskortet og logger en inn. Et nummer som allerede tilhører et annet medlem avvises. Begrenset til ti forsøk i timen per IP.

**Styret:** nummer i STYREMEDLEMMER gir «Send melding» i varselmenyen. Første gang velger man en firesifret styrekode. Meldingen går som push til innloggede medlemmer med varsler på, og ligger i appen for alle innloggede. Loggen viser hvem som sendte hva og hvor mange som har sett.

**Glemt styrekode:** trykk «Nullstill kode» i appen. Lederen åpner KV-lageret i Cloudflare og leser nøkkelen `reset:<styre-id>`, som inneholder en midlertidig kode. Styremedlemmet skriver den inn sammen med en ny kode.
KV-lageret: https://dash.cloudflare.com/77c55d6b057cc69a033738170492d88b/workers/kv/namespaces/0bfeddb59d4e4152984b31df88491a13

Styremedlemmers navn hentes fra Person-feltet i Styremedlemmer. Det krever at integrasjonen har rettigheten «Read user information without email» (notion.so/profile/integrations → integrasjonen → Capabilities). Uten den vises rollen som navn.

Datakilde-id-ene for medlemsdelen står i `wrangler.toml` under `[vars]`. Integrasjonen må være koblet til MEDLEMMER, STYREMEDLEMMER, VAKTPLAN og infosiden.

## På iPhone

Åpne adressen i Safari → Del → «Legg til på Hjem-skjerm» → åpne fra Hjem-skjerm → trykk bjella → «Varsler på».
Push på iPhone virker bare fra Hjem-skjerm (iOS 16.4 eller nyere). «Send testvarsel nå» viser om det virker.

## Hvordan varslene sendes

Cron kjører hver hele time. Worker-en regner ut Oslo-tid, går gjennom alle abonnenter og sender til de som har valgt akkurat denne timen og dagen relativt til et arrangement (samme dag kl 16, dagen før kl 12, osv.). Torsdager uten arrangement teller som «Rolig pub» hvis abonnenten har det på.

## Overlevering til styret

Alt ligger i én Cloudflare-konto og én Notion-integrasjon. Legg til et styremedlem i Cloudflare-kontoen, eller overfør Worker-en. Notion-integrasjonen kan eies av pubens Notion-arbeidsområde.
