# AHO Puben – app på Hjem-skjerm

Bekreftet intensjon, 12. oktober 2026. Intervju gjennomført med Georg, bekreftet eksplisitt.

## Intensjon

- **Utfall:** Nettside lagret på Hjem-skjerm (PWA) for AHO Puben der push-varselet før torsdag er selve produktet. Styret skriver bare i Notion; appen henter, oversetter og viser.
- **Bruker:** AHO-studenter, inkludert internasjonale (derfor engelsk). Styret er redaktør, kun i Notion.
- **Hvorfor nå:** Instagram-poster drukner og folk glemmer torsdagen. Styret byttes årlig og vil ha én kanal uten vedlikehold.
- **Suksess:** Folk har appen på Hjem-skjerm og får varsel torsdag kl 16 pluss onsdag kl 12 som standard. Styret rører aldri kode.
- **Rammer:** Gratis og null vedlikehold. Én HTML-fil på GitHub Pages (eller Cloudflare Pages) pluss én gratis Cloudflare Worker. Push på iPhone krever «Legg til på Hjem-skjerm», appen må forklare dette.
- **Utenfor scope:** Innlogging, stemming på forslag, App Store-app, automatisk henting fra Instagram (bilder legges i Notion), admin-flate utenom Notion.

Prioritet (fra intervjuet, synkende): 1) folk glemmer / ser ikke posten, 2) oversikt fremover, 3) enkel publiseringskanal for styret, 4) forslag fra studentene.

## Beslutninger

| Tema | Valg |
|---|---|
| Hosting | Cloudflare (Pages for appen, Worker for backend) |
| Oversetting | Automatisk maskinoversetting (DeepL gratis-nivå) i Worker, lagret per arrangement. Styret skriver kun norsk. |
| Forslag | Kun innsendingsskjema i appen → ny rad i Notion-database. Ingen offentlig liste. |
| Kalender | Tre utkast viser tre løsninger: månedsrutenett, scrollbar torsdagsliste, hybrid (ukestripe + kort). |
| Tomme torsdager | Ja, kort varsel: «Puben er åpen 19–01 i kveld». |
| Varsel-valg | Standard: torsdag kl 16 + onsdag kl 12. Alternativer: kun torsdag kl 16; torsdag kl 16 + tirsdag kl 12. Av/på via bjella. |
| Språk | NO/EN-bryter øverst. UI-tekster i appen, innhold oversettes i Worker. |
| Kontoer | Cloudflare, Notion-integrasjon og DeepL opprettes på Georg nå, overføres til styret senere. |

## Hvorfor server (Cloudflare Worker)

| Funksjon | Server? | Hvorfor |
|---|---|---|
| App, kalender, språkbytte, bjelle-meny | Nei | Statisk HTML/CSS/JS. Språkvalg i localStorage. |
| Push-varsler | Ja | Varsel sendes fra server til Apples push-tjeneste. Lukket nettside kan ikke «våkne» selv. Server lagrer abonnement + preferanse og kjører cron tirsdag/onsdag/torsdag. |
| Lese Notion | Ja | Notion-API krever hemmelig nøkkel; nettleser blokkerer direkte kall (CORS). Worker holder nøkkel, cacher og serverer ren JSON. |
| Oversetting | Ja | DeepL-nøkkel med månedskvote. Worker oversetter én gang per arrangement og lagrer. |
| Forslag → Notion | Ja | Opprette rad krever samme nøkkel. Worker kan stoppe spam. |

## Kilder

- Kommende eventer (Notion, offentlig): https://ahopub.notion.site/306fc4bc274d803fbcaac5b17542df12?v=306fc4bc274d8009a810000ce875801e
- Forslag-skjema (Notion): https://ahopub.notion.site/3f7fc4bc274d80ceaee5e0b72a412798
- Instagram: https://www.instagram.com/ahopuben/
- Figma, grafisk profil (side «AHO pub», logo-frame «Logo» id 471:150): https://www.figma.com/design/OHP7bnByAgK4NZs1s80igy/FERDINAND?node-id=470-4

## Grafisk profil (lest fra Figma 12.10.2026)

- Logo: svart kvadrat, seks hvite bokstavfliser «AHO / PUB» i 3×2-rutenett. Egner seg som app-ikon.
- Farger: #000000, #ffffff, oransje #fe7525, gul #ffd33d, lys gul #fee37a, blå #082394, brun-oransje #e68d4b. Referanse-skjermbilde: #1d1d1d + #0000ff.
- Uttrykk (Instagram): plakat-aktig, tung grotesk/condensed typografi, høy kontrast, elektrisk blå, limegrønn, rå bilder.

## Notion-struktur (lest fra den offentlige siden 12.10.2026)

Database «Arrangementer» med visningene Kommende, Arkivert og Ideer.
Felter som vises: Navn, Type (Aktivitet / DJ), Dato, relasjon «PUB: nr» (pubkveld-nummer).
Rader nå: Rolig Pub (uten dato, "torsdag"), Halloween 29.10.2026 (Aktivitet, PUB 11), DJ - Dave Van Zon 5.11.2026 (DJ), Julepub 26.11.2026 (Aktivitet, PUB 15).
Forslagsskjemaet «Ønsker til arrangementer» har ett felt: «Hva arrangementer burde vi ha?». Svar er synlige på nettet.

Merk: Georgs Notion-integrasjon i Claude har ikke tilgang til ahopub-arbeidsområdet. Worker-en må bruke en egen integrasjon opprettet av styret (eller Georg med tilgang).

Feltene appen trenger i Notion (foreslått, må avtales med styret): Navn, Dato, Type, Bilde (filfelt), Beskrivelse (tekst), Status (Kommende/Arkivert/Idé). Oversatte felter lagres i Worker-ens KV, ikke i Notion.

## Figma-utkast (levert 12.10.2026)

Side «AHO pub – app utkast» i FERDINAND-fila: https://www.figma.com/design/OHP7bnByAgK4NZs1s80igy/FERDINAND?node-id=478-2

- Utkast A: PLAKAT. Svart, elektrisk blå, Archivo Black + Space Grotesk. Månedsrutenett.
- Utkast B: FEED. Hvit, svart, gul. Bricolage Grotesque + Schibsted Grotesk. Torsdagsliste gruppert på måned.
- Utkast C: TAVLE. Dyp blå (#082394) og gul (#fee37a). Bebas Neue + Space Mono. Stripe med torsdager + kort for valgt dag.

Hvert utkast: push-varsel-banner, Hjem (full scroll), Varsler (sidemeny), Forslag, pluss notater om bevegelse og materiale.

## Designprinsipper som gjelder videre (fra apple-design og design-taste-frontend)

- Topplinje som gjennomskinnelig materiale (backdrop-filter), innholdet scroller under.
- Sidemeny: scrim bak, inn fra høyre der bjella sitter, ut samme vei, fjær uten sprett (demping 1,0, respons 0,3 s), kan dras igjen og avbrytes.
- Trykk-respons på pointer-down (skala 0,97), ikke på slipp.
- Stripe/kalender: nettleserens egen momentum-scroll og scroll-snap, ingen scroll-hijack.
- prefers-reduced-motion: krysstoning i stedet for gli.
- Ingen tankestreker i tekst, ett skilletegn per linje, én aksentfarge per utkast, ett hjørneradius-system per utkast.

## Valgt retning (12.10.2026, kveld)

Utkast A: PLAKAT er valgt. Bygget i to varianter på Figma-siden: «Utkast A: PLAKAT (mørk)» og «Utkast A: PLAKAT (lys)».

Endringer fra Georg:
- Overskriften «Kommende torsdager» er byttet til «Kommende». Det hender arrangementer ligger på andre dager, for eksempel foreningsdag på dagtid. Appen må derfor ikke anta at alt er på torsdag: kalenderen viser alle datoer fra Notion, og varselet gjelder neste arrangement uansett ukedag, med torsdag som standard pubkveld.
- Ved siden av logoen i topplinjen står «ARRANGEMENTER», slik at det leses som AHO PUB ARRANGEMENTER.
- Utseende velges i sidemenyen under varsler: Mørk, Lys, System, eller Dag og natt. Dag og natt regner ut solnedgang for Oslo lokalt i appen (ingen API) og bytter tema automatisk. Temabytte tones over ca. 300 ms.
- Lys variant: hvitt, svart og elektrisk blå. Hero-bildet toner over i hvitt nederst med svart tittel. Primærknapp svart med hvit tekst.

B og C beholdes på siden som referanse, flyttet til høyre.

## Varselvalg (besluttet 12.10.2026, forslag 1)

Erstatter de tre radiovalgene i sidemenyen, i både mørk og lys variant.

- Spørsmål: «Hvor tidlig vil du ha beskjed?» med chips som kan kombineres: Samme dag kl 16, Dagen før kl 12, To dager før kl 12, En uke før. Standard: Samme dag + Dagen før.
- Tidene regnes fra arrangementets dato, ikke fra torsdag. Virker for arrangementer på andre ukedager.
- Bryter «Også når det bare er vanlig pub», standard på. Av betyr varsel kun når det ligger et arrangement i Notion for den dagen.
- Kort «Neste varsel» viser konkret neste dato og klokkeslett, og hva det gjelder.
- Knapp «Send testvarsel nå». Avslører om push virker (app på Hjem-skjerm, tillatelse gitt).
- Infokort heter «Kom ikke testvarselet?» og forklarer Hjem-skjerm-steget.

Konsekvens for Worker-en: hvert push-abonnement lagrer offsets (liste av {dagerFør, klokkeslett}), flagget vanligPub, språk og tema-uavhengig. En cron hver time finner arrangementer der nå = dato minus offset, og sender til abonnentene som matcher. Testvarsel er et eget endepunkt som sender umiddelbart til det ene abonnementet.

Figma: seksjonen «Varselvalg: 3 forslag» (node 495:2) viser alternativene som ble vurdert.

## Bygget (12.10.2026, natt)

Kode ligger i prosjektmappen. Én Cloudflare Worker serverer appen og API-et (Workers Static Assets), så alt er samme opprinnelse.

- `public/index.html`: hele appen i én fil. Hero med neste pubkveld og «neste arrangement»-linje når torsdagen er rolig pub, månedskalender med sveip, Kommende-liste, CTA til forslag. Sidemeny: varsler på/av, chips for hvor tidlig, vanlig pub-bryter, neste varsel, testvarsel, Lys/Mørk/Dag og natt, infokort, signatur. Forslag-skjema på `#forslag`. NO/EN i appen, tema med solnedgang regnet lokalt.
- `public/sw.js`: bare push og klikk på varsel. Ingen offline-cache.
- `src/index.js`: `/api/events` (Notion, cache 10 min i KV, DeepL-oversetting cachet per tekst), `/api/subscribe` (POST/DELETE), `/api/test`, `/api/suggest` (Notion-side, 5 per time per IP), `/api/ics/:id`, `/api/vapid`. Cron hver time sender varsler ut fra abonnentens valg og Oslo-tid. Uten nøkler: eksempelmodus.
- Web push via `@block65/webcrypto-web-push` (RFC 8291/8292, fungerer med Apple).
- Lokalt testet: alle endepunkter, cron-handler, NO/EN, lys/mørk, sidemeny, forslag-visning.

Gjenstår for Georg/styret: Notion-integrasjon og deling av databasene, DeepL-nøkkel, VAPID-nøkler, KV-id, deploy. Se README.md.

Mappenavnet «AHO PUBEN APP » har et mellomrom på slutten. `npm --prefix` fjerner det. Kjør kommandoer fra inne i mappen, eller gi mappen nytt navn uten mellomrom.

## Deployet (12.10.2026, kveld)

Live på https://aho-puben.georgferdinandnilsen.workers.dev (Cloudflare-konto georgferdinandnilsen@gmail.com, Worker «aho-puben»). Kjører i eksempelmodus til Notion-token er lagt inn.

Gjort: KV-lager opprettet (id i wrangler.toml), VAPID-nøkler generert og lagret som hemmeligheter (VAPID_PUBLIC, VAPID_PRIVATE), NOTION_DB_ID satt. Cron hver time er aktiv.

Gjenstår: NOTION_TOKEN (Notion-integrasjon, begge databaser delt med den), DEEPL_KEY, NOTION_SUGGEST_DB_ID (id til databasen bak forslagsskjemaet, helst privat), feltene Bilde og Beskrivelse i Arrangementer. Så test på iPhone: Hjem-skjerm, varsler på, send testvarsel.

GitHub Pages på repoet viser bare README og kan skrus av.

## Notion i drift (13.10.2026)

- Datakilder i databasen 306fc4bc…: «ARRANGEMENTER» (felt: Kommende = tittel, Når, Type arrangement, Info til APP, Bilde til APP, Svar, Bestemt, Det skjer!, Innsendt fra app) og en ubrukt datakilde «New data source» (Name, beskrivelse, nummer, potensiell dato?). Visningene Ønsker, Ideer og Ønsker skjema ligger på ARRANGEMENTER; Ideer filtrerer på Bestemt: Nei.
- Regel for hva som vises i appen: har dato i «Når» fra i dag og utover (som visningen «Kommende»). Rolig Pub-rader er vanlig pub.
- Forslag fra appen havner i datakilden ARRANGEMENTER (samme som arrangementene): tittel, Bestemt = Nei, ingen dato. Styret lager selv en visning som filtrerer på forslag. Notion API-versjon 2025-09-03 (kreves for flere datakilder).
- DeepL Developer-nøkkel er lagt inn. Engelsk oversettelse fungerer.
- Ikke brukt ennå: «Bestemt», «Det skjer!», «Svar», pub-nummer (kobling), «Ansvarlig», «Vakt».

## Justeringer etter første test på iPhone (14.10.2026)

- **Varselvalg** (erstatter de fire forrige): «Samme dag» (3 timer før start, kl 16 når puben åpner 19, eller 3 timer før klokkeslettet i «Når» hvis det er satt), «Dagen før kl 12» og «Mandag kl 12» (starten av arrangementets uke). Standard: Samme dag og Dagen før. Gamle lagrede valg oversettes automatisk. Faller to varsler på samme tidspunkt, sendes det ett.
- «Neste varsel»-boksen er fjernet. «Kom ikke testvarselet?» ligger rett under testknappen. Forklaringen under Dag og natt er «Solnedgangen i Oslo bytter tema for deg.»
- **Forslag:** etter innsending går appen rett tilbake til forsiden og viser «Takk!» som forsvinner av seg selv.
- **Kommende-listen:** pilen er byttet med «+» som legger arrangementet i kalenderen (.ics). Gjelder også vanlige pub-torsdager.
- **Hvit topplinje i Safari:** temaet settes nå før første tegning og html-bakgrunnen følger temaet, ellers farger Safari statuslinjen hvit mens siden lastes.
- Ikke oppdatert i Figma-utkastene.

## Medlemsside «Mine vakter» (ønsket 14.10.2026, ikke bygget)

- For bartenderne: innlogging med telefonnummer, liste over egne kommende vakter, «legg alle vakter i kalender», varsel kl 19 dagen før og 1 time før vakt.
- Notion: VAKTPLAN (306fc4bc274d80629bb9e4bf753fc7d8) har én rad per pubkveld med Dato, PUB NR, Arrangement, Ansvarlig styremedlem, «Åpnevakt (medlemsliste)» (19-21) og «Stengevakt (medlemsliste)» (21-01). MEDLEMMER (306fc4bc274d80b385edd3b81e8f35a0) har Full name, School, Course, Phone, E-mail.
- Tre alternativer for plassering ligger i Figma, seksjonen «Mine vakter: 3 alternativer» (node 508:2): flytende pille med ark, fane i sidemenyen, stripe øverst med egen side.
- Åpent: valg av alternativ, og hvor sterk innloggingen skal være. Medlemslisten ligger åpent på ahopub.notion.site med navn, telefon og e-post. Da er telefonnummer alene ikke en hemmelighet. Appen bruker integrasjonen og trenger ikke at noe er offentlig.
- Integrasjonen må kobles til både MEDLEMMER og VAKTPLAN før dette kan bygges.

## Småendringer 14.10.2026

- Logo + «ARRANGEMENTER» i topplinjen laster siden på nytt.
- Appen heter nå AHO PUBEN (manifest og Hjem-skjerm-tittel). Varselets tittel er selve beskjeden («Halloween i kveld»), teksten under er klokkeslett og første setning. iOS legger selv til «from <appnavn>».
- Topplinjen: «ARRANGEMENTER» er byttet med knappen «BLI MEDLEM» (engelsk: JOIN), som åpner innmeldingsskjemaet i Notion (JOIN_URL i index.html). Logoen alene laster siden på nytt. Skjemaet må være delt offentlig for at knappen skal virke.

## Medlemsdelen: bekreftet intensjon (14.10.2026, intervju)

- **Utfall:** «Bartendermodus» i appen, pluss en kanal fra styret til medlemmene.
- **Bruker:** Medlemmene i baren, styret som sender beskjeder, lederen som håndterer glemte koder.
- **Hvorfor nå:** Infosiden i Notion er tungvint på mobil, og styret mangler én kanal til alle medlemmer.
- **Suksess:** En bartender finner neste vakt og låserutinen på under ti sekunder. Styret ser hvor mange som har sett en beskjed.
- **Rammer:** Samme Worker, ingen nye tjenester. Integrasjonen kobles til MEDLEMMER (306fc4bc274d80b385edd3b81e8f35a0), STYREMEDLEMMER (306fc4bc274d80df82ddea8c853c4b65), VAKTPLAN (306fc4bc274d80629bb9e4bf753fc7d8) og infosiden (306fc4bc274d800493aaf22d1526a320). Telefonnumre forlater aldri Worker-en. Medlemslisten tas av nett.
- **Utenfor scope:** Vaktbytte i appen, hele vaktplanen for alle, SMS, e-post, redigering av Notion fra appen.

Funksjoner:
1. Innlogging med telefonnummer mot MEDLEMMER. Aktiv = medlemsdatoen («How long do you want to be a member?») ikke passert. Forblir innlogget, med «Logg ut».
2. Mine vakter fra VAKTPLAN: Åpnevakt 19-22 og Stengevakt 22-01 (kolonnene «Åpnevakt (medlemsliste)» og «Stengevakt (medlemsliste)»), med arrangement, kolleger, ansvarlig styremedlem og «Noe å være obs på for kvelden».
3. Alle vakter i kalender (én .ics), pluss «+» per vakt.
4. Varsel om vakt kl 19 dagen før og én time før (kl 18 / kl 21). Egen bryter.
5. Manualene (ti how-to-sider), engelsk del og «Siste nytt» fra infosiden, hentet via API og vist i appen, oppdatert innen ti minutter.
6. Styremelding: styremedlem (nummer i STYREMEDLEMMER) setter egen firesifret kode ved første innlogging. Mottakere: alle aktive medlemmer, eller de med kommende/pågående vakt. Push + melding øverst på medlemssiden. Avsender ser «X av Y har sett» (sett = åpnet i appen). Glemt kode: nullstill, lederen henter ny midlertidig kode i Cloudflare.
7. Plassering: flytende pille med ark (Figma alt 1), bare for innloggede. Andre ser «Bartender? Logg inn» nederst.

Neste: tre forslag til selve medlemsmenyen i Figma før koding.

## Medlemsdelen: valgt design (14.10.2026)

Figma: seksjonen «Medlemsdel: valgt» (node 518:2). De to andre forslagssettene er flyttet til arkiv lengst til høyre på siden, ikke slettet.

- Innlogging ligger nederst i varselmenyen (telefonnummer, «Logg inn»). Innlogget viser navn, «Logg ut», og for styremedlemmer «Send melding».
- Pillen på forsiden vises bare etter innlogging. Den viser neste vakt og åpner arket.
- Arket har faner: Vakter (siste styremelding øverst, neste vakt, kommende vakter, «Legg alle vakter i kalender», varsel om vakt, Logg ut), Manualer (ti how-to fra Notion + engelsk), Meldinger (alle styremeldinger, nyeste øverst; åpning teller som «sett»).
- Kalender: «Legg alle vakter i kalender» er et kalenderabonnement (webcal) som følger Notion. Ingen duplikater, og endringer i vaktplanen slår inn i kalenderen. Derfor ingen «+» per vakt.
- «Send melding» og styrekode som godkjent.
- Figma-utkastene viser fortsatt «ARRANGEMENTER» i topplinjen; appen har «BLI MEDLEM».
- Når medlemsdelen er bygget: Georg skal ha lenke til stedet i Cloudflare der nullstilte styrekoder ligger.

### Tillegg 14.10.2026 (Figma-rammer 9, 10, 11 i «Medlemsdel: valgt»)

- **Vaktdetalj.** Trykk på en vakt åpner detaljer: ansvarlig styremedlem, dem du jobber med, og stengevakten samme kveld (for overlevering). Hver person har en ring-knapp (tel:-lenke). Appen gir bare ut numre til personer på samme pubkveld og til ansvarlig styremedlem, aldri hele medlemslisten.
- **Obs for kvelden trumfer styremelding.** Aktiv vakt = fra én time før start til vakten er over. Da vises «Obs for kvelden» øverst i Vakter-fanen i stedet for styremeldingen, og vakten merkes «Pågående vakt».
- **48-timers regel.** En styremelding vises øverst i Vakter-fanen i 48 timer etter sending. Etter det finnes den bare i Meldinger-fanen.
- **Meldingslogg for styret.** «Se logg» under «Send melding». Viser tidspunkt, avsender, mottakergruppe, tekst og «sett». Kan ikke slettes fra appen. Lagres i KV sammen med meldingene.
- **Sprett på obs.** Hver gang arket («min side») åpnes og det finnes en obs-melding for kvelden, spretter obs-kortet i 1-2 sekunder og ligger så stille: fjær med sprett, demping ca. 0,6, to svingninger. Spiller én gang per åpning. Med prefers-reduced-motion: ett kort blink i stedet.
- Designet for medlemsdelen er godkjent av Georg 14.10.2026. Bygging kan starte når integrasjonen er koblet til MEDLEMMER, STYREMEDLEMMER, VAKTPLAN og infosiden.

## Medlemsdelen: bygget (14.10.2026)

- `src/members.js`: tolking av MEDLEMMER, Styremedlemmer og VAKTPLAN, mine vakter med kontaktinfo bare for samme kveld, mottakere for styremelding, manualer fra HOW-TO, Notion-blokker til HTML, kalenderabonnement. Testet i `test/members.test.mjs`.
- `src/memberRoutes.js`: innlogging (økt 180 dager i KV), hjem, manual (bare manualer og sider lenket fra dem), kalender (.ics med token i URL), sett-markering, styrekode (SHA-256 med pepper), nullstilling (nøkkel `reset:<styre-id>` i KV), sending med mottakergruppe, push til innloggede abonnenter, logg. Vaktvarsler i cron (`shiftTick`).
- Push-abonnementet kobles til medlemmet når man logger inn (memberToken i subscribe). Logg ut kobler fra.
- Innloggede medlemmer: `/api/member/*`. Styre: `/api/board/*`. Datakilde-id-er i `wrangler.toml`.
- Eksempelmodus uten Notion-nøkkel: telefon 90000000 = Ferdinand Nilsen (styre), 90000001 = Kari Nordmann.
- Testet lokalt: innlogging, pille, ark med tre faner, vaktdetalj med ring-knapper, manual, meldinger og sett-telling, styrekode, feil kode, sending til alle og kommende vakt, logg, kalenderfil, 401/403/404-grensene.
- Ikke testet: ekte medlemsnummer mot Notion (Georg tester), push på telefon, kalenderabonnement på iPhone.
- 14.10.2026: Innlogging med landskode-velger (kodene som finnes i medlemslisten, +47 først). Numre tolkes uavhengig av mellomrom, bindestrek, parentes, «00» og innledende null etter landskode. Styremedlemmers navn hentes fra Notion-brukeren (krever «Les brukerinformasjon uten e-postadresser» på integrasjonen, slått på 14.10). Infotekst fra Notion vises i hero-feltet. Ekstra bunnplass når pillen vises. Kodefelt viser prikker. Teaser-knappen arver tekstfarge (synlig i lys modus).
- 14.10.2026: Gjenoppretting av nummer: feilmelding med lenke → e-post → nytt nummer (med landskode) lagres i Notion (PATCH Phone) og logger inn. Risiko: den som kjenner et medlems e-post kan knytte sitt eget nummer til kortet. Dempet med ti forsøk per time, avvisning av numre som finnes fra før, og logglinje i Worker-loggen.
- 14.10.2026: Hjelpen for feil lagret nummer vises først etter tre mislykkede innlogginger (telles per nettleserøkt), og nullstilles ved vellykket innlogging.
- 14.10.2026: Rettingen av nummer ligger i en popup (e-post, så nytt nummer). Varselmenyen viser bare spørsmålslinjen og lenken, og bare etter tre mislykkede forsøk.

## Overleveringspakke (14.10.2026)

Mappen `overlevering/` (og zip-filen `AHO-PUBEN-APP-overlevering.zip` i prosjektmappen) inneholder OVERLEVERING.md/.html/.pdf, SJEKKLISTE.md, AI-PROMPT.md, oversiktsdiagram, skjermbilder av appen, Figma-eksporter og en kopi av koden. Skrevet for et styre uten utviklererfaring: to veier for overføring (gi tilgang, eller sette opp alt på nytt), driftsregler i Notion, feilsøking, kostnader.
- 14.10.2026: CTA på forsiden heter nå «Send forslag til arrangementer». Overleveringspakken (mappen «00 overlevering») peker nå kun på vei B, med steg for å legge appen på app.ahopuben.no via Cloudflare Custom Domains. Alle åtte varseltyper er sendt til Georgs telefon som demo.

## PC-versjon og lansering på ahopuben.no (14.10.2026)

Bekreftet i intervju 14.10.2026:

- Appen lanseres som nettapp i løpet av uka og blir selve forsiden på https://www.ahopuben.no/. Dagens Google Sites-side (tider, adresse, e-post, Instagram) erstattes, og den infoen bakes inn i PC-layouten.
- Brukere på PC: studenter og gjester, og styret og bartendere, like mye. PC-versjonen må bære begge roller like godt.
- Mobilversjonen er urørt. Under 900 px bredde tar mobil-layouten over.
- Forslagene vises i mørk modus først. Lys variant lages på det forslaget som velges.
- Ingen nye funksjoner. Domenepeking fra Google Sites til Cloudflare er et eget steg etter at design er valgt.

Tre forslag i Figma (side «AHO pub – app utkast», node 478:2), under de eksisterende utkastene. Hvert forslag har seks rammer på 1440 px: hjem, varsler, forslag, medlem innlogget, send melding (styre), pluss én ekstra.

- **PC 1: PLAKAT, bredformat** (node 552:3). Mobilappen i bredformat: plakaten fyller hele bredden, under ligger kalender til venstre og Kommende + forslag til høyre, siden scroller. Varsler er sidemeny fra høyre (400 px). Forslag er dialog. Innlogget: pillen nede til venstre, arket vokser opp fra pillen (720 px). Minst å lære og minst å kode.
- **PC 2: OPPSLAG, to halvdeler** (node 552:14). Plakaten står fast til venstre (720 px) med tittel, tekst og knapper. Høyre halvdel scroller med kalender, Kommende, forslag og kontaktinfo. Varsler legger seg over høyre halvdel i to spalter. Forslag erstatter høyre halvdel. Innlogget: pille på plakaten, arket glir opp over høyre halvdel.
- **PC 3: TAVLE, alt på én skjerm** (node 552:25). Ingen scroll: plakat 880 px, måned 440 px, Kommende som fire kort nederst, kontaktlinje i bunn. Varsler er popover under bjella uten dimming. Forslag er dialog. Innlogget: fast medlemsspalte (340 px) til venstre, plakat og kalender krymper. Send melding er dialog fra spalten.

Felles for alle tre: topplinje med logo + ARRANGEMENTER til venstre og BLI MEDLEM, NO/EN og bjelle til høyre. Kontaktinfo fra dagens nettside i bunnen. Manualer-fanen, Meldinger-fanen, styrekode og logg har samme innhold som på mobil og bor i samme flate som Vakter og Send melding.

Teknisk notat: hjelpekoden som bygde PC-rammene ligger i et skjult, låst tekstlag «__pc_helpers» (node 552:2) på Figma-siden. Det kan slettes når forslagene er valgt.

### Valgt og bygget: PC 1 (14.10.2026)

Georg valgte PC 1 (PLAKAT, bredformat) med to endringer: logoen står sentrert i topplinjen (ARRANGEMENTER til venstre, BLI MEDLEM, NO/EN og bjelle til høyre), og styremedlemmer kan skjule «Bli medlem»-knappen for alle via en avkryssing i sine innstillinger (varselmenyen, under MEDLEM når man er innlogget som styre). Figma-seksjonen PC 1 er oppdatert med dette, pluss en lys variant av hjem.

Bygget samme dag i samme kodebase:
- `public/index.html`: PC-layout fra 900 px bredde (grid med kalender venstre, Kommende og forslag høyre, plakat 720 px høy, kontaktinfo i bunn, sidemeny 400 px, forslag som dialog med Esc og klikk utenfor, pille nede til venstre og ark 720 px som vokser opp fra pillen). Under 900 px er mobilversjonen urørt. Avkryssingen «Vis «Bli medlem» på nettsiden» for styret. Kontaktinfo (adresse, e-post, Instagram @ahopuben) ligger som konstanter øverst i skriptet.
- Worker: `GET /api/settings` gir `{ join }`. `POST /api/board/join { visible }` (krever styreinnlogging, ikke kode) lagrer `settings:join` i KV med hvem og når i `settings:join:meta`.
- Gjenstår for lansering: peke ahopuben.no fra Google Sites til Cloudflare (Custom Domain på Worker-en), og teste på ekte PC-nettlesere.
- 14.10.2026, etter Georgs egen Figma-ramme (node 563:20): topplinjen på PC har ARRANGEMENTER til venstre, den brede AHO PUB-logoen (node 563:10, eksportert til `public/logo-wide.svg`) med «Torsdager 19:00 - 01:00» under i midten, og BLI MEDLEM, NO/EN og bjelle til høyre. Forslagsknappen ligger nederst som en smal stripe over kontaktinfoen, med mindre skrift, fordi den tok for mye oppmerksomhet i høyre spalte. To alternative «masthode»-utkast (stor AHO PUBEN-tekst eller stor logo øverst på plakaten) ligger i PC 1-seksjonen som ikke valgt.
- 14.10.2026: Den brede logoen har ingen bakplate. Den ligger inline i `index.html` med `currentColor`, så brikkene er hvite i mørk modus og svarte i lys. `public/logo-wide.svg` er samme fil uten bakgrunn.
- 14.10.2026: På PC får man ikke push, så varselvalgene er skjult når man er utlogget (panelet heter da INNSTILLINGER og har bare utseende og innlogging). Innlogget vises valgene igjen og styrer telefonen: `GET /api/member/prefs` leser valgene fra medlemmets push-abonnementer, `POST /api/member/prefs` skriver dem til alle abonnementene. Appen henter kontoens valg ved innlogging og ved oppstart, og sender endringer dit hver gang man endrer et valg. Telefonen kan dermed vise en annen linje enn PC-en til neste gang den åpnes.
- 14.10.2026: «Legg i kalender» på PC. Nettleseren kan ikke åpne kalenderprogrammet direkte, så på PC åpner knappen (og «+» i Kommende) en liten meny under knappen: Google Kalender (ny fane, ferdig utfylt), Outlook på nett, Abonner i Apple Kalender (webcal på alle arrangementer, `GET /api/events.ics`) og Last ned .ics. Valget huskes på maskinen etter første gang, så neste klikk går rett til den kalenderen. Kan endres under innstillinger, «Kalender på PC» (Google, Outlook, Apple (abonner), .ics, Spør hver gang). Mobil er uendret: .ics rett i Kalender på iPhone.
- 14.10.2026 (kveld): Fast bilde av puben (`public/fallback.jpg`, fra Georg) vises når «Bilde til APP» mangler, både i plakaten og i «Valgt dag»-kortet. Logoen på blå bakgrunn er borte.
- 14.10.2026 (kveld): Tall for styret øverst i «Send melding»: telefoner med varsler på (KV `sub:` med metadata m/t) og telefoner som har lagt appen på Hjem-skjerm (KV `dev:<tilfeldig id>` med metadata s/f/t, meldt via `POST /api/ping` én gang om dagen, standalone-modus oppdages i nettleseren). Ingen navn eller numre. Nye siste sju dager telles også.
- 14.10.2026 (kveld): PC-rutenettet er 3fr/2fr med 64 px marg, så høyre spalte ikke skvises på smale PC-skjermer (feil oppdaget ved ca. 1000 px). Overleveringspakken («00 overlevering») er oppdatert med PC-versjonen, domenevalget (appen rett på ahopuben.no + www), styrets innstillinger og tall, kalendermenyen, fallback-bildet, promomanus og Figma-eksporter av PC-forslagene.
- 15.10.2026: Varselvalgene er nå «Samme dag kl 16» og «Dagen før kl 12». «Mandag kl 12» er fjernet; lagrede valg med bare mandag faller tilbake til standard (begge). Samme dag er fast kl 16, unntatt når arrangementet starter før kl 19, da tre timer før start.
- 15.10.2026: Egen tall-visning for styret («Se tall for appen» i varselmenyen, «SE TALL» under Send melding), `GET /api/board/stats`: besøk som unike enheter (siste døgn, 7 og 30 dager, andel PC), innlogget (personer og enheter), varsler på (telefoner, hvorav medlemmer, nye siste 7 dager), på Hjem-skjerm (telefoner, nye siste 7 dager). Kilde: KV-metadata på `dev:`, `sess:` og `sub:`; eldre nøkler får metadata skrevet på første gang tallene leses. Flagget til Georg: den tilfeldige enhets-id-en i nettleseren kan kreve samtykke etter ekomloven.
- 15.10.2026: Musikk fra DJ-en eller artisten. Tre forslag i Figma (seksjon 594:2); Georg valgte B, lyd på plakaten. Notion-feltet «Artist link APP» (lenke eller tekst med lenke) leses i `fromNotion`, `src/music.js` lager innebygd avspiller for Spotify (låt/episode 80 px, ellers 152 px, mørkt tema) og SoundCloud (166 px, blå), og Worker-en henter tittel, artist og cover via oEmbed (bufret i KV `oembed:` i 7 dager, korte delelenker følges). Plakaten får en hvit pille «Hør DJ-en» (type DJ) eller «Hør artisten», som åpner et ark (på PC en dialog) med cover, tittel, artist, avspilleren og «Åpne i Spotify/SoundCloud». Avspilleren lastes først når arket åpnes og fjernes når det lukkes, så musikken stopper. Arrangementer med musikk får en note i Kommende og i kalenderkortet. Tekst fra Spotify/SoundCloud escapes før den vises.
- 15.10.2026: Toppen i nettleseren (ikke Hjem-skjerm-appen) var svart over plakaten. Safari i iOS 26 farger statuslinjen etter bakgrunnsfargen til et fast element øverst (eller body), og bryr seg ikke om theme-color; eldre iOS og Android bruker theme-color. Appen leser nå fargen fra toppen av plakatbildet (canvas, Notion-bildene tillater CORS) og gir topplinjen den fargen (72 %) og setter theme-color til samme farge. Når plakaten er scrollet forbi, eller på PC, går den tilbake til vanlig. Kan ikke vise selve bildet under statuslinjen i Safari, bare en farge som glir over i det. Ikke testet på en ekte iPhone ennå.
- 15.10.2026 (ettermiddag): Toppen var fortsatt svart i Safari på Georgs iPhone etter forrige forsøk (fargen på den gjennomsiktige topplinjen og theme-color ble ikke brukt). Nå farges også html og body med fargen fra plakaten mens plakaten ligger under topplinjen, på telefonbredde (maks 480 px); `.wrap` har fått egen svart bakgrunn så innholdet ikke endrer farge. Ikke bekreftet på ekte iPhone ennå.
- 15.10.2026: «Hør»-knappen følger «Type arrangement»: DJ gir «Hør DJ-en», Band gir «Hør bandet», Artist og alt annet gir «Hør artisten». `fromNotion` returnerer nå alle typene (`tags`). Låta skal starte når man trykker: avspilleren lages i selve trykket, Spotify via iFrame API med `play()` når den er klar (faller tilbake til vanlig avspiller etter 4 s), SoundCloud med `auto_play=true`. iOS kan likevel kreve ett trykk til.
- 15.10.2026 (sen ettermiddag): Den svarte toppen i Safari skyldtes at topplinjen var festet (position: fixed) og gjennomsiktig med uskarphet. Safari i iOS 26 maler da statuslinjen i én farge den ikke klarer å lese, og det ble svart. VG Live (som Georg viste) har ikke festet topplinje, og der vises innholdet under klokka. Løsning: på telefon i nettleseren (klassen `inbrowser` settes før første tegning når appen ikke er åpnet fra Hjem-skjerm) ligger topplinjen i flyten og scroller bort, så plakaten går helt opp under klokka. På Hjem-skjerm og PC er topplinjen festet som før. Forrige forsøk (farge på topplinje og html/body) er fjernet; theme-color får fortsatt fargen fra plakaten for eldre iOS og Android.
- 15.10.2026 (kveld): Fortsatt svart på iPhone Air etter at topplinjen ble løsnet. Skjermbildet viser at Safari holder innholdet under statuslinjen når siden er helt øverst (safe-area-inset-top er 0), så feltet over er Safaris eget og farges med sidens bakgrunnsfarge. Nå settes html og body til fargen fra plakaten mens plakaten er øverst (telefonbredde, nettleser), `.wrap` har egen bakgrunn så innholdet ikke endres, og fargen huskes i localStorage (`topTint`) og settes før første tegning ved neste besøk, i tilfelle Safari bare leser fargen når siden lastes. Bildet i seg selv kan ikke vises der i Safari, bare fargen.
- 15.10.2026: Rettet knappene «Legg i kalender» og «Del» på mobil: Del tok hele bredden og presset Legg i kalender til to linjer (`.ghost`-regelen fra medlemsdelen gjaldt også Del-knappen).
- 15.10.2026: Låta starter ikke av seg selv på iPhone. Safari lar ikke en side starte lyd inne i Spotifys eller SoundClouds avspiller; første trykk må være på avspilleren selv. Venter på Georgs valg av løsning.
- 15.10.2026: Georg valgte «spilleren rett på plakaten». Arket, «Hør»-pillen og Spotify iFrame API er fjernet. Den offisielle spilleren (Spotify 80 px, SoundCloud 166 px, maks 353 px bred på mobil og 480 px på PC) ligger i plakaten under datoen, med etiketten «Hør DJ-en/bandet/artisten» over. Ett trykk på deres play starter låta. SoundCloud har `auto_play=false`, siden spilleren nå lastes med siden. Plakaten får litt høyere maks høyde når den har spiller.
- 15.10.2026: ahopuben.no er registrert hos Domeneshop (navnetjenere ns1-3.hyp.net). www peker til Google Sites (ghs.googlehosted.com), toppdomenet til Domeneshops videresending. Ingen e-post (MX) på domenet.
