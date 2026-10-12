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
   Database-id er de 32 tegnene i URL-en. Arrangementer: `306fc4bc274d803fbcaac5b17542df12`.
   Appen finner feltene på type, ikke navn: tittel, dato, select (Type), tekst (Beskrivelse), filer (Bilde), tall (Pub-nr). Legg til et filfelt «Bilde» og et tekstfelt «Beskrivelse» hvis de mangler.
2. **DeepL.** Gratis API-nøkkel på deepl.com/pro-api (500 000 tegn per måned). Nøkler som slutter på `:fx` er gratis-nøkler.
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

## På iPhone

Åpne adressen i Safari → Del → «Legg til på Hjem-skjerm» → åpne fra Hjem-skjerm → trykk bjella → «Varsler på».
Push på iPhone virker bare fra Hjem-skjerm (iOS 16.4 eller nyere). «Send testvarsel nå» viser om det virker.

## Hvordan varslene sendes

Cron kjører hver hele time. Worker-en regner ut Oslo-tid, går gjennom alle abonnenter og sender til de som har valgt akkurat denne timen og dagen relativt til et arrangement (samme dag kl 16, dagen før kl 12, osv.). Torsdager uten arrangement teller som «Rolig pub» hvis abonnenten har det på.

## Overlevering til styret

Alt ligger i én Cloudflare-konto og én Notion-integrasjon. Legg til et styremedlem i Cloudflare-kontoen, eller overfør Worker-en. Notion-integrasjonen kan eies av pubens Notion-arbeidsområde.
