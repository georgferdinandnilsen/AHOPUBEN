# Sjekkliste: flytte AHO Puben-appen til styrets kontoer

Kryss av etter hvert. Rekkefølgen er viktig. Alt er gratis.

## Før dere starter
- [ ] Felles styre-e-post opprettet (ikke en privat adresse)
- [ ] Passordhåndterer delt i styret
- [ ] En PC eller Mac, og mappen `app` fra pakken (eller ZIP fra GitHub) lagt i `Dokumenter/aho-puben`
- [ ] Innlogging til der ahopuben.no er registrert (Domeneshop, One.com eller lignende)
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
- [ ] `npm run deploy` kjørt, og den midlertidige workers.dev-adressen notert

## Domene ahopuben.no
- [ ] Endelig adresse er ahopuben.no (appen er forsiden, bestemt 14.10.2026)
- [ ] ahopuben.no lagt til i Cloudflare («Add a domain», gratisplan)
- [ ] Navnetjenerne byttet hos registraren til de to Cloudflare oppga
- [ ] Cloudflare har bekreftet at domenet er aktivt (e-post)
- [ ] Custom Domain lagt til på Worker-en: Workers & Pages → aho-puben → Settings → Domains & Routes, både ahopuben.no og www.ahopuben.no
- [ ] Google Sites koblet fra domenet (Innstillinger → Egendefinerte domener)
- [ ] https://ahopuben.no åpner appen på telefon og på PC

## Test
- [ ] Den endelige adressen åpnet på telefon: ekte arrangementer vises (ikke Halloween-eksempelet)
- [ ] Lagt på Hjem-skjerm, varsler på, «Send testvarsel nå» kom fram
- [ ] Logget inn som medlem, egne vakter vises
- [ ] Logget inn som styremedlem, valgt styrekode, sendt testmelding
- [ ] Byttet til engelsk: tekstene er oversatt
- [ ] På PC: topplinje med bred logo og åpningstider, kalender til venstre, kommende til høyre, kontaktinfo i bunnen
- [ ] Som styre: avkryssingen «Vis Bli medlem på nettsiden» virker begge veier, og «Se tall for appen» viser tall

## Bytte over
- [ ] Ny adresse sendt til alle, med beskjed om å legge til på Hjem-skjerm på nytt
- [ ] Styremedlemmer har valgt styrekode på nytt
- [ ] GitHub: repoet overført til styrets konto, eller koden lastet opp til et nytt repo
- [ ] Georg har tatt ned den gamle appen (`npx wrangler delete`) og fjernet gammel Notion-integrasjon

## Senere
- [ ] Denne listen lagt i Notion, så neste styre finner den
