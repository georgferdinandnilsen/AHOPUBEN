# Sjekkliste: flytte AHO Puben-appen til styrets kontoer

Kryss av etter hvert. Rekkefølgen er viktig. Alt er gratis.

## Før dere starter
- [ ] Felles styre-e-post opprettet (ikke en privat adresse)
- [ ] Passordhåndterer delt i styret
- [ ] En PC eller Mac, og mappen `app` fra pakken (eller ZIP fra GitHub) lagt i `Dokumenter/aho-puben`
- [ ] Node.js (LTS) installert fra nodejs.org
- [ ] Kjørt `npm install` i mappen

## Notion
- [ ] Integrasjon «AHO PUBEN APP» laget på notion.so/profile/integrations, i arbeidsområdet AHO PUB
- [ ] Funksjoner: Les innhold, Oppdater innhold, Sett inn innhold, Les brukerinformasjon uten e-postadresser
- [ ] Nøkkelen (Internal Integration Secret) lagt i passordhåndtereren
- [ ] Koblet til: Arrangementer
- [ ] Koblet til: MEDLEMMER
- [ ] Koblet til: Styremedlemmer
- [ ] Koblet til: VAKTPLAN
- [ ] Koblet til: AHO PUB - INFOSIDE MEDLEMMER

## DeepL
- [ ] Developer-konto (gratis) på deepl.com/pro-api
- [ ] API-nøkkel lagt i passordhåndtereren

## Cloudflare
- [ ] Konto opprettet med styre-e-posten
- [ ] `npx wrangler login` kjørt og godkjent i nettleseren
- [ ] `npx wrangler kv namespace create KV` kjørt, og id-en limt inn i `wrangler.toml`
- [ ] `npm run vapid` kjørt, begge nøklene lagt i passordhåndtereren
- [ ] `npx wrangler secret put NOTION_TOKEN`
- [ ] `npx wrangler secret put NOTION_DB_ID` (306fc4bc274d803fbcaac5b17542df12)
- [ ] `npx wrangler secret put NOTION_SUGGEST_DB_ID` (samme id)
- [ ] `npx wrangler secret put DEEPL_KEY`
- [ ] `npx wrangler secret put VAPID_PUBLIC`
- [ ] `npx wrangler secret put VAPID_PRIVATE`
- [ ] `npm run deploy` kjørt, og den nye adressen notert

## Test
- [ ] Adressen åpnet på telefon: ekte arrangementer vises (ikke Halloween-eksempelet)
- [ ] Lagt på Hjem-skjerm, varsler på, «Send testvarsel nå» kom fram
- [ ] Logget inn som medlem, egne vakter vises
- [ ] Logget inn som styremedlem, valgt styrekode, sendt testmelding
- [ ] Byttet til engelsk: tekstene er oversatt

## Bytte over
- [ ] Ny adresse sendt til alle, med beskjed om å legge til på Hjem-skjerm på nytt
- [ ] Styremedlemmer har valgt styrekode på nytt
- [ ] GitHub: repoet overført til styrets konto, eller koden lastet opp til et nytt repo
- [ ] Georg har tatt ned den gamle appen (`npx wrangler delete`) og fjernet gammel Notion-integrasjon

## Senere
- [ ] Eget domene koblet i Cloudflare (valgfritt)
- [ ] Denne listen lagt i Notion, så neste styre finner den
