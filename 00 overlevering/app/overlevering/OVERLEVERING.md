# AHO Puben-appen: overlevering til styret

Skrevet 14. oktober 2026 av Georg Ferdinand Nilsen (med hjelp av Claude). Denne pakken inneholder alt som trengs for å forstå, drifte og flytte appen til styrets egne kontoer. Les dette dokumentet først. Det er skrevet for folk som ikke har bygget nettsider før.

Adressen til appen i dag: https://aho-puben.georgferdinandnilsen.workers.dev

---

## 1. Hva appen er

AHO Puben-appen er en nettside som folk legger på Hjem-skjermen på telefonen. Den viser hva som skjer på puben, og sender push-varsler før hvert arrangement. Styret trenger aldri å røre koden: alt innhold skrives i Notion, og appen henter det derfra.

Den har tre lag:

- **For alle:** neste arrangement øverst, en kalender, forslagsskjema til styret, varsler man styrer selv, norsk og engelsk, lyst og mørkt tema.
- **For medlemmer (bartendere):** logg inn med telefonnummer og få egne vakter, kolleger man kan ringe med ett trykk, manualene fra Notion, kalenderabonnement og varsel før vakt.
- **For styret:** send melding til alle medlemmer eller dem på vakt, se hvor mange som har lest, og en logg over alt som er sendt.

![Forsiden](skjermbilder/01-forside.jpg) ![Kalender og kommende](skjermbilder/02-kalender-og-kommende.jpg)

![Varselmenyen](skjermbilder/03-varselmeny.jpg) ![Forslag](skjermbilder/04-forslag.jpg)

![Mine vakter](skjermbilder/05-medlem-vakter.jpg) ![Vaktdetalj med ring-knapper](skjermbilder/06-medlem-vaktdetalj.jpg)

![Manualer](skjermbilder/07-medlem-manualer.jpg) ![Send melding, for styret](skjermbilder/08-styre-send-melding.jpg)

---

## 2. Slik henger det sammen

![Oversikt](oversikt.svg)

Tre deler snakker sammen:

1. **Notion** er der styret jobber. Databasene Arrangementer, MEDLEMMER, Styremedlemmer og VAKTPLAN, pluss infosiden med manualene. Appen leser dem gjennom en «integrasjon», som er en nøkkel Notion deler ut. Ingen Notion-sider trenger å være publisert på nett.
2. **Cloudflare Worker** er hjernen. Et lite program som kjører gratis i skyen. Det serverer selve nettsiden, henter fra Notion hvert 10. minutt, oversetter til engelsk, sender push-varsler hver hele time, håndterer innlogging og lagrer småting (abonnementer, meldinger, styrekoder) i et lager som heter KV. Alle nøkler ligger her, aldri i koden.
3. **Telefonene** viser appen. Push-varslene går gjennom Apple og Google sine tjenester, helt automatisk.

I tillegg ligger **koden på GitHub** som sikkerhetskopi med historikk, og **designet i Figma**.

---

## 3. Hvem eier hva i dag

| Hva | Hvor | Eies av | Hva det brukes til |
|---|---|---|---|
| Cloudflare-konto | dash.cloudflare.com | Georg (georgferdinandnilsen@gmail.com) | Kjører Worker-en «aho-puben», lagret KV, alle hemmeligheter |
| Adressen | aho-puben.georgferdinandnilsen.workers.dev | Følger Cloudflare-kontoen | Det folk har lagt på Hjem-skjerm |
| GitHub-repo | github.com/georgferdinandnilsen/AHOPUBEN | Georg | Koden, med historikk |
| Notion-integrasjon «AHO PUBEN APP» | notion.so/profile/integrations | Opprettet av Ferdinand i AHO PUB-arbeidsområdet | Nøkkelen appen bruker mot Notion |
| DeepL Developer | deepl.com | Georg | Engelsk oversetting, gratis |
| Push-nøkler (VAPID) | Lagret i Cloudflare | Laget av Georg | Gjør at akkurat denne appen får sende push |
| Figma-fil «FERDINAND» | figma.com | Georg | Designet, tre utkast og den valgte versjonen |

**Hva skjer når Georg slutter?** Alt fortsetter å virke så lenge kontoene hans finnes. Men ingen i styret kan rette feil, bytte nøkler eller endre noe. Derfor må appen flyttes, eller styret må få tilgang. Begge veier står under.

---

## 4. Overføring til styret

Først ett råd: **lag en felles styre-e-post** (for eksempel en Gmail som heter noe med ahopuben) og en passordhåndterer styret deler. Opprett alle kontoene under på den e-posten, ikke på en privat. Da overlever de neste styreskifte.

Det finnes to veier. Vei B er den rene løsningen og anbefales.

### Vei A: Gi styret tilgang til dagens kontoer (rask, men midlertidig)

Alt blir liggende på Georgs kontoer, men styret kan styre.

1. **Cloudflare:** Georg går til dash.cloudflare.com → Manage Account → Members → Invite. Skriv styre-e-posten, velg rollen Super Administrator. Styret godtar invitasjonen i e-posten.
2. **GitHub:** Georg går til github.com/georgferdinandnilsen/AHOPUBEN → Settings → Collaborators → Add people. Eller bedre: Settings → Danger Zone → Transfer ownership, til styrets GitHub-konto.
3. **Notion-integrasjonen:** Georg går til notion.so/profile/integrations → AHO PUBEN APP → fanen «Eiere av tilkoblinger» → legg til et styremedlem. Da kan styret hente og bytte nøkkelen selv.
4. **DeepL:** Styret lager egen gratis Developer-konto på deepl.com/pro-api, henter en API-nøkkel, og legger den inn i Cloudflare (se «Legge inn hemmeligheter» under).

Ulempen: kontoene heter fortsatt Georg. Mister han tilgang, eller sletter kontoen, forsvinner alt.

### Vei B: Sett opp alt på nytt på styrets egne kontoer (anbefalt)

Det høres mye ut, men det er en kveld med en PC og denne listen. Alt er gratis. Gjør punktene i rekkefølge.

**Steg 0. Forberedelser**
- En Mac eller PC. Alt under gjøres i programmet Terminal (Mac) eller PowerShell (Windows).
- Styre-e-posten og passordhåndtereren fra rådet over.
- Hent mappen `app` fra denne pakken, eller last ned koden fra GitHub (grønn «Code»-knapp → Download ZIP). Legg mappen et sted med en enkel sti, for eksempel `Dokumenter/aho-puben`. Ikke bruk mellomrom i mappenavnet.

**Steg 1. Installer Node.js**
- Gå til nodejs.org og installer «LTS»-versjonen. Det er programmet som kjører verktøyene.
- Åpne Terminal, gå til mappen og installer avhengighetene:

```
cd Dokumenter/aho-puben
npm install
```

**Steg 2. Lag Notion-integrasjonen (nøkkelen mot Notion)**
- Gå til notion.so/profile/integrations, logget inn som en som er administrator i arbeidsområdet AHO PUB.
- Trykk «Ny forbindelse». Navn: AHO PUBEN APP. Arbeidsområde: AHO PUB. Type: intern.
- Under Capabilities/Funksjoner: huk av Les innhold, Oppdater innhold, Sett inn innhold, og velg «Les brukerinformasjon uten e-postadresser». Uten den siste vises styremedlemmer som rollen sin i stedet for navn.
- Kopier «Internal Integration Secret». Det er nøkkelen. Lim den aldri i en chat eller e-post. Legg den i passordhåndtereren.
- Koble integrasjonen til sidene. Åpne hver av disse i Notion, trykk `…` øverst til høyre → Tilkoblinger → velg AHO PUBEN APP:
  - Arrangementer (siden som inneholder databasen)
  - MEDLEMMER
  - Styremedlemmer
  - VAKTPLAN
  - AHO PUB - INFOSIDE MEDLEMMER
- Alternativ: gjør det fra integrasjonens egen side under fanen «Tilgang».

**Steg 3. Lag DeepL-nøkkel (engelsk oversetting)**
- Gå til deepl.com/pro-api og velg planen Developer (gratis, engangskreditt på 1 million tegn, holder i mange år).
- Finn API-nøkkelen under kontoen din. Legg den i passordhåndtereren.

**Steg 4. Lag Cloudflare-konto og logg inn fra Terminal**
- Opprett konto på dash.cloudflare.com med styre-e-posten. Gratisplanen holder.
- I Terminal, i app-mappen:

```
npx wrangler login
```

- En nettleser åpner seg. Trykk Allow.

**Steg 5. Lag lageret (KV)**

```
npx wrangler kv namespace create KV
```

- Terminalen skriver ut en linje med `id = "…"`. Åpne filen `wrangler.toml` i et tekstprogram og bytt ut id-en under `[[kv_namespaces]]` med den nye.

**Steg 6. Lag push-nøkler**

```
npm run vapid
```

- Du får en «Public Key» og en «Private Key». Begge skal inn som hemmeligheter i neste steg. Den private deles aldri.

**Steg 7. Legg inn hemmelighetene**

Hver kommando spør «Enter a secret value». Lim inn verdien og trykk Enter. Verdien vises ikke.

```
npx wrangler secret put NOTION_TOKEN
npx wrangler secret put NOTION_DB_ID
npx wrangler secret put NOTION_SUGGEST_DB_ID
npx wrangler secret put DEEPL_KEY
npx wrangler secret put VAPID_PUBLIC
npx wrangler secret put VAPID_PRIVATE
```

| Hemmelighet | Hva du limer inn |
|---|---|
| NOTION_TOKEN | Nøkkelen fra steg 2 |
| NOTION_DB_ID | Id-en til Arrangementer-databasen: `306fc4bc274d803fbcaac5b17542df12` |
| NOTION_SUGGEST_DB_ID | Samme id: `306fc4bc274d803fbcaac5b17542df12` (forslag lagres i samme database) |
| DEEPL_KEY | Nøkkelen fra steg 3 |
| VAPID_PUBLIC | Public key fra steg 6 |
| VAPID_PRIVATE | Private key fra steg 6 |

Database-id er de 32 tegnene i lenken til databasen i Notion. Id-ene til medlemsdatabasene står i `wrangler.toml` under `[vars]` og trenger ikke endres så lenge dere bruker de samme databasene. Lager dere nye databaser, finner dere datakilde-id slik: åpne databasen → `…` → Administrer datakilder → `…` ved kilden → Kopier datakilde-ID.

**Steg 8. Publiser**

```
npm run deploy
```

- Terminalen skriver ut adressen, for eksempel `https://aho-puben.<kontonavn>.workers.dev`. Det er den nye appen.
- Åpne adressen på en telefon. Ser du de ekte arrangementene fra Notion, virker Notion-koblingen. Ser du «Halloween, DJ: Dave Van Zon, Julepub» med eksempeltekst, mangler NOTION_TOKEN eller koblingen til sidene.

**Steg 9. Test**
- Trykk bjella, logg inn med ditt eget nummer. Står du i MEDLEMMER eller Styremedlemmer med nummeret, kommer du inn.
- Slå på varsler og trykk «Send testvarsel nå». Kommer det ikke: appen må ligge på Hjem-skjerm.
- Som styremedlem: «Send melding», velg en styrekode, send en testmelding til deg selv.

**Steg 10. Bytt over**
- Send den nye adressen til alle. Alle må legge appen på Hjem-skjerm på nytt og slå på varsler på nytt. Det gamle ikonet kan slettes.
- Styremedlemmer velger styrekode på nytt.
- Når alt virker, tar Georg ned den gamle: i hans mappe kjører han `npx wrangler delete`. GitHub-repoet overføres eller arkiveres.

**Dette blir ikke med over automatisk** (det ligger i det gamle KV-lageret): hvem som har varsler på, styrekoder, meldingsloggen og «sett»-tellinger. Det er greit å starte på null.

**Eget domene (valgfritt):** I Cloudflare → Workers & Pages → aho-puben → Settings → Domains & Routes kan dere koble et domene dere eier, for eksempel app.ahopuben.no. Da slipper dere det lange workers.dev-navnet.

---

## 5. Drift i hverdagen: det styret gjør i Notion

Appen følger disse reglene. Ingen kode trengs.

**Arrangementer**
- Et arrangement vises i appen når det har en dato i feltet **Når** som er i dag eller senere. Ingen dato, ingen visning.
- **Type arrangement** blir etiketten (Aktivitet, DJ og så videre). Typen «Rolig Pub» betyr vanlig pub uten program.
- **Info til APP** er teksten som vises under datoen. Oversettes automatisk til engelsk.
- **Bilde til APP** blir bildet øverst. Uten bilde vises logoen.
- Endringer vises i appen innen ti minutter.
- Torsdager uten rad i Notion vises automatisk som «Rolig pub, kl 19-01».

**Forslag fra folk**
- Forslag fra appen lander som ny rad i Arrangementer med **Bestemt** satt til Nei, og teksten inne på siden. De vises i visningen Ideer. Sett en dato i Når når et forslag blir et arrangement.

**MEDLEMMER**
- Appen bruker **Full name**, **Phone**, **E-mail** og datoen i **How long do you want to be a member?**. Er datoen passert, får personen ikke logge inn.
- Telefonnummeret må ha landskode hvis det ikke er norsk, for eksempel +46 70 123 45 67. Mellomrom spiller ingen rolle.
- Får et medlem «Fant ikke nummeret» tre ganger, kan de rette nummeret selv via e-posten sin. Appen skriver da det nye nummeret inn i Phone-feltet.

**Styremedlemmer**
- Nummeret i **Telefon** gir styrerettigheter i appen. Det må være det samme nummeret personen logger inn med.
- **Person**-feltet må være satt til personens Notion-bruker. Navnet hentes derfra.

**VAKTPLAN**
- Én rad per pubkveld: **Dato**, **Åpnevakt (medlemsliste)** (19-22), **Stengevakt (medlemsliste)** (22-01), **Ansvarlig styremedlem** og **Noe å være obs på for kvelden**.
- Medlemmer ser bare sine egne vakter, og telefonnumre bare til dem på samme kveld.
- «Obs for kvelden» vises øverst for dem på vakt fra én time før start, og sendes med i vaktvarselet.

**Infosiden (manualer)**
- Alle undersidene under overskriften **HOW-TO** vises som manualer i appen, i samme rekkefølge, gruppert av skillelinjene. Alt annet på siden hoppes over. Rett i Notion, så er appen oppdatert innen ti minutter.

**Varsler**
- Arrangementer: hver bruker velger Samme dag (3 timer før start), Dagen før kl 12 og/eller Mandag kl 12. Standard er samme dag og dagen før.
- Vakter: kl 19 dagen før, og én time før start.
- Styremeldinger: med en gang, til innloggede medlemmer som har varsler på.

**Styrekoder**
- Første gang et styremedlem åpner «Send melding», velger de en firesifret kode. Glemmer de koden, trykker de «Nullstill kode». Da legges en midlertidig kode i KV-lageret, som lederen leser i Cloudflare: Workers & Pages → KV → KV → nøkkelen som heter `reset:` og styremedlemmets id. Lederen gir koden videre, og styremedlemmet velger en ny.

---

## 6. Når noe ikke virker

| Symptom | Sannsynlig årsak | Fiks |
|---|---|---|
| Appen viser Halloween, DJ: Dave Van Zon og Julepub med eksempeltekst | NOTION_TOKEN mangler eller er feil | `npx wrangler secret put NOTION_TOKEN` på nytt |
| Et arrangement mangler | Ingen dato i Når, eller datoen er passert | Sett dato |
| Appen viser gamle data | Cache på ti minutter | Vent, eller slett nøkkelen `events` i KV |
| Styremedlem vises med rolle i stedet for navn | Integrasjonen mangler «Les brukerinformasjon uten e-postadresser» | Slå på i integrasjonens Capabilities. Logg ut og inn |
| «Fant ikke nummeret i medlemslisten» | Nummeret står annerledes i Notion, eller mangler landskode | Rett i Notion, eller bruk «Rett det med e-posten din» etter tre forsøk |
| Push kommer ikke på iPhone | Appen er åpnet i Safari, ikke fra Hjem-skjerm | Del → Legg til på Hjem-skjerm → åpne derfra → slå på varsler |
| Ingen engelsk tekst | DEEPL_KEY mangler eller kvoten er brukt opp | Sjekk nøkkelen på deepl.com |
| «Notion 404» i loggen | En side er ikke koblet til integrasjonen | `…` → Tilkoblinger på siden |
| Alt er borte | Worker-en er slettet eller Cloudflare-kontoen er stengt | Sett opp på nytt etter Vei B |

**Se loggen live** mens dere feilsøker. I app-mappen:

```
npx wrangler tail
```

Trykk Ctrl+C for å stoppe.

**Oppdatere koden** etter en endring i `public/index.html` eller `src/`:

```
npm run deploy
```

---

## 7. Kostnader og grenser

Alt kjører på gratisnivåene, og en studentpub kommer ikke i nærheten av grensene.

| Tjeneste | Gratisgrense | Hva appen bruker |
|---|---|---|
| Cloudflare Workers | 100 000 forespørsler per dag | Noen hundre |
| Cloudflare KV | 1 000 skrivinger per dag, 100 000 lesinger | Noen titalls skrivinger, bortsett fra når en styremelding sendes (én per medlem som leser) |
| DeepL Developer | 1 million tegn, engangs | Noen tusen tegn i året |
| Notion API | Ingen kostnad | Hvert 10. minutt |

---

## 8. Filene i pakken

```
OVERLEVERING.md / .html / .pdf   Dette dokumentet
SJEKKLISTE.md                    Punktlisten for overføring, til å krysse av
AI-PROMPT.md                     Tekst dere kan lime inn i ChatGPT, Claude eller lignende for hjelp
oversikt.svg                     Oversiktsdiagrammet
skjermbilder/                    Appen slik den ser ut i dag
design/                          Designet fra Figma: valgt versjon og alternativene som ble vurdert
app/                             Hele koden, det samme som ligger på GitHub
  public/index.html              Selve appen, én fil
  public/sw.js                   Mottar push-varsler på telefonen
  public/manifest.webmanifest    Navn og ikon på Hjem-skjerm
  src/index.js                   Worker-en: Notion, DeepL, push, forslag, cron
  src/members.js, memberRoutes.js, notify.js, notion.js   Medlemsdel, varsellogikk, Notion-tolking
  test/                          Små tester: node test/members.test.mjs
  wrangler.toml                  Cloudflare-oppsett og Notion-id-er
  README.md                      Teknisk oppsett, kortversjon
  docs/intent/aho-puben.md       Alle beslutninger og designprinsipper, kronologisk
```

Figma-filen med designet: https://www.figma.com/design/OHP7bnByAgK4NZs1s80igy/FERDINAND?node-id=478-2

---

## 9. Få hjelp av en AI

Dere trenger ikke kunne dette selv. Åpne `AI-PROMPT.md`, lim inn teksten i en AI-assistent (ChatGPT, Claude, Gemini) og legg ved filene fra `app/` hvis den kan lese filer. Så ber dere den ta ett steg om gangen. Regelen er: **lim aldri nøkler eller passord inn i chatten.** AI-en trenger ikke dem. Den trenger bare å vite hvor de skal.
