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
