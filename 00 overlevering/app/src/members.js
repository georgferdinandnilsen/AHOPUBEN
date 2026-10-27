// Medlemsdelen: medlemmer, styre, vakter, manualer. Rene funksjoner øverst (node test/members.test.mjs), Notion-henting nederst.
const rt = a => (a || []).map(x => x.plain_text).join('');
const ids = a => (a || []).map(x => x.id.replace(/-/g, ''));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const addDays = (date, n) => { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

// Telefonnummer: «+47 900 00 000», «90000000» og «0047 90 00 00 00» er like (→ 90000000). Utenlandske numre beholder landskoden:
// «+46 (0)70-123 45 67» → 46701234567. Mellomrom, bindestreker, parenteser og en innledende null etter landskoden ignoreres.
const CC2 = new Set(['20', '27', '30', '31', '32', '33', '34', '36', '39', '40', '41', '43', '44', '45', '46', '47', '48', '49', '51', '52', '53', '54', '55', '56', '57', '58', '60', '61', '62', '63', '64', '65', '66', '81', '82', '84', '86', '90', '91', '92', '93', '94', '95', '98']);
export function splitPhone(p) {
  const raw = String(p || '').trim(); let d = raw.replace(/\D/g, '');
  const hasCc = raw.startsWith('+') || d.startsWith('00');
  if (!hasCc) return d.length === 8 ? { cc: '47', national: d } : { cc: '', national: d };
  if (d.startsWith('00')) d = d.slice(2);
  const cc = ['1', '7'].includes(d[0]) ? d[0] : CC2.has(d.slice(0, 2)) ? d.slice(0, 2) : d.slice(0, 3);
  return { cc, national: d.slice(cc.length).replace(/^0/, '') };
}
export const normPhone = p => { const { cc, national } = splitPhone(p); return cc === '47' || !cc ? national : cc + national; };
// Landskodene som finnes i medlemslisten, 47 først.
export const countryCodes = people => [...new Set(['47', ...people.map(x => x.cc).filter(Boolean)])];

export const ROLE = { open: { start: 19, end: 22, label: 'Åpnevakt', labelEn: 'Opening shift', time: '19-22' }, close: { start: 22, end: 25, label: 'Stengevakt', labelEn: 'Closing shift', time: '22-01' }, resp: { start: 19, end: 25, label: 'Ansvarlig', labelEn: 'In charge', time: '19-01' } };

export function memberFrom(p) { const P = p.properties; const d = P['How long do you want to be a member?']?.date; return { id: p.id.replace(/-/g, ''), name: rt(P['Full name']?.title).trim(), phone: normPhone(P.Phone?.phone_number), cc: splitPhone(P.Phone?.phone_number).cc, email: String(P['E-mail']?.email || '').trim().toLowerCase(), until: (d?.end || d?.start || '').slice(0, 10) }; }
export const isActive = (m, today) => !!m.name && (!m.until || m.until >= today); // ponytail: uten dato = aktiv, feltet kommer fra skjemaet og kan mangle
export function boardFrom(p) { const P = p.properties; const u = P.Person?.people?.[0]; return { id: p.id.replace(/-/g, ''), role: rt(P.Rolle?.title).trim(), phone: normPhone(P.Telefon?.phone_number), cc: splitPhone(P.Telefon?.phone_number).cc, userId: u?.id || '', name: (u?.name || '').trim() }; }
export function shiftFrom(p) {
  const P = p.properties; const u = P['Ansvarlig styremedlem']?.people?.[0];
  return { id: p.id.replace(/-/g, ''), date: (P.Dato?.date?.start || '').slice(0, 10), pub: rt(P['PUB NR']?.title).trim(), obs: rt(P['Noe å være obs på for kvelden']?.rich_text).trim(), event: P.Event?.formula?.string || '', eventId: ids(P.Arrangement?.relation)[0] || '', responsible: u ? { userId: u.id, name: u.name || '' } : null, open: ids(P['Åpnevakt (medlemsliste)']?.relation), close: ids(P['Stengevakt (medlemsliste)']?.relation) };
}

// Mine vakter. Telefonnumre bare for folk på samme kveld og ansvarlig styremedlem. Styremedlemmer får også kveldene de er ansvarlige for.
export function myShifts(memberId, shifts, members, board, boardUserId = '') {
  const M = Object.fromEntries(members.map(m => [m.id, m]));
  const person = id => { const m = M[id]; return m ? { name: m.name, phone: m.phone } : null; };
  const resp = s => { if (!s.responsible) return null; const b = board.find(x => x.userId === s.responsible.userId); return { name: b?.name || s.responsible.name || b?.role || '', phone: b?.phone || '', role: b?.role || '' }; };
  const isResp = s => !!boardUserId && s.responsible?.userId === boardUserId;
  return shifts.filter(s => s.date && ((memberId && (s.open.includes(memberId) || s.close.includes(memberId))) || isResp(s))).sort((a, b) => a.date.localeCompare(b.date)).map(s => {
    const role = memberId && s.open.includes(memberId) ? 'open' : memberId && s.close.includes(memberId) ? 'close' : 'resp';
    const mine = role === 'open' ? s.open : role === 'close' ? s.close : s.open, other = role === 'open' ? s.close : role === 'close' ? s.open : s.close;
    return { id: s.id, date: s.date, role, time: ROLE[role].time, pub: s.pub, event: s.event, eventId: s.eventId, obs: s.obs, responsible: resp(s), coworkers: mine.filter(x => x !== memberId).map(person).filter(Boolean), others: other.map(person).filter(Boolean), otherRole: role === 'open' ? 'close' : role === 'close' ? 'open' : 'close', coRole: role === 'resp' ? 'open' : role };
  });
}
// Mottakere av en styremelding: alle aktive, de på neste pubkveld, eller de på dagens.
export function recipients(to, members, shifts, today) {
  const active = members.filter(m => isActive(m, today));
  if (to === 'all') return active.map(m => m.id);
  const onDate = d => new Set(shifts.filter(s => s.date === d).flatMap(s => [...s.open, ...s.close]));
  if (to === 'active') return active.filter(m => onDate(today).has(m.id)).map(m => m.id);
  const next = shifts.map(s => s.date).filter(d => d >= today).sort()[0];
  return next ? active.filter(m => onDate(next).has(m.id)).map(m => m.id) : [];
}
// Styremeldinger: mottakerne som er valgt får push, og i tillegg alle i styret som er innlogget med varsler på, uansett valg.
export const wantsMsg = (s, rec, boardUserIds) => !!s && ((!!s.memberId && rec.has(s.memberId)) || (!!s.boardUserId && boardUserIds.has(s.boardUserId)));
// Vaktvarsler: kl 19 dagen før, og én time før start.
export const shiftAlerts = s => [[1, 19], [0, ROLE[s.role].start - 1]];

// Manualene (bar-rutinene): undersidene på siden «HOW-TO / BAR RUTINER», gruppert av skillelinjer.
// Har siden en overskrift med HOW-TO, brukes bare undersidene etter den (det gamle oppsettet med en større infoside).
export function manualsFrom(blocks) {
  const isHead = b => b.type === 'heading_2' || b.type === 'heading_1', howTo = b => /how.?to/i.test(rt(b[b.type]?.rich_text));
  const headed = blocks.some(b => isHead(b) && howTo(b));
  let on = !headed, group = 0; const out = [];
  for (const b of blocks) {
    if (isHead(b)) { if (headed) on = howTo(b); continue; }
    if (!on) continue;
    if (b.type === 'divider') group++;
    else if (b.type === 'child_page') out.push({ id: b.id.replace(/-/g, ''), title: b.child_page.title, group });
    else if (b.type === 'child_database') on = false;
  }
  return out;
}
// Notion-blokker → enkel HTML. kids = ferdig HTML for underblokker.
export function richHtml(arr) { return (arr || []).map(x => { let t = esc(x.plain_text).replace(/\n/g, '<br>'); const a = x.annotations || {}; if (a.code) t = `<code>${t}</code>`; if (a.bold) t = `<b>${t}</b>`; if (a.italic) t = `<i>${t}</i>`; if (a.underline) t = `<u>${t}</u>`; if (x.href) t = `<a href="${esc(x.href)}" target="_blank" rel="noopener">${t}</a>`; return t; }).join(''); }
export const LIST = { bulleted_list_item: 'ul', numbered_list_item: 'ol', to_do: 'ul' };
export function blockHtml(b, kids = '') {
  const r = b[b.type]?.rich_text, k = kids;
  switch (b.type) {
    case 'paragraph': return (r?.length ? `<p>${richHtml(r)}</p>` : '') + k;
    case 'heading_1': return `<h2>${richHtml(r)}</h2>${k}`; case 'heading_2': return `<h3>${richHtml(r)}</h3>${k}`; case 'heading_3': return `<h4>${richHtml(r)}</h4>${k}`;
    case 'bulleted_list_item': case 'numbered_list_item': return `<li>${richHtml(r)}${k}</li>`;
    case 'to_do': return `<li class="todo${b.to_do.checked ? ' done' : ''}">${richHtml(r)}${k}</li>`;
    case 'toggle': return `<details><summary>${richHtml(r)}</summary>${k}</details>`;
    case 'callout': return `<aside class="callout">${richHtml(r)}${k}</aside>`;
    case 'quote': return `<blockquote>${richHtml(r)}${k}</blockquote>`;
    case 'divider': return '<hr>';
    case 'image': { const u = b.image.file?.url || b.image.external?.url || ''; return u ? `<img src="${esc(u)}" alt="" loading="lazy">` : ''; }
    case 'video': case 'file': case 'pdf': case 'audio': { const o = b[b.type]; const u = o.file?.url || o.external?.url || ''; return u ? `<p><a href="${esc(u)}" target="_blank" rel="noopener">${esc(rt(o.caption) || { video: 'Video', file: 'Fil', pdf: 'PDF', audio: 'Lyd' }[b.type])} ›</a></p>` : ''; }
    case 'bookmark': case 'embed': case 'link_preview': { const u = b[b.type].url; return `<p><a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a></p>`; }
    case 'code': return `<pre>${esc(rt(b.code.rich_text))}</pre>`;
    case 'child_page': return `<p><a href="#manual=${b.id.replace(/-/g, '')}" data-manual="${b.id.replace(/-/g, '')}">${esc(b.child_page.title)} ›</a></p>`;
    case 'table': case 'child_database': return '<p class="muted">Tabell, se Notion.</p>';
    default: return k; // column_list, column, synced_block, ukjent
  }
}
// Setter sammen blokkene og pakker lister i ul/ol.
export function pageHtml(items) { let out = '', open = null; for (const it of items) { const kind = it.kind || null; if (kind !== open) { if (open) out += `</${open}>`; if (kind) out += `<${kind}>`; open = kind; } out += it.html; } if (open) out += `</${open}>`; return out; }

// Kalenderabonnement med alle mine vakter.
export function shiftsIcs(shifts) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const escI = s => String(s || '').replace(/[\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
  const ev = s => { const R = ROLE[s.role], d = s.date.replace(/-/g, ''), d2 = addDays(s.date, 1).replace(/-/g, ''); const who = [...s.coworkers.map(p => p.name), ...(s.responsible ? ['ansvarlig: ' + s.responsible.name] : [])].join(', ');
    return ['BEGIN:VEVENT', `UID:${s.id}-${s.role}@ahopuben`, `DTSTAMP:${stamp}`, `DTSTART;TZID=Europe/Oslo:${d}T${String(R.start).padStart(2, '0')}0000`, `DTEND;TZID=Europe/Oslo:${s.role === 'open' ? d + 'T220000' : d2 + 'T010000'}`, `SUMMARY:${escI(R.label + ' AHO Pub' + (s.event ? ', ' + s.event : ''))}`, `DESCRIPTION:${escI([s.pub, who && 'Med ' + who, s.obs && 'Obs: ' + s.obs].filter(Boolean).join('\n'))}`, 'LOCATION:AHO Puben', 'END:VEVENT']; };
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AHO Puben//NO', 'X-WR-CALNAME:AHO Pub vakter', 'REFRESH-INTERVAL;VALUE=DURATION:PT6H', ...shifts.flatMap(ev), 'END:VCALENDAR'].join('\r\n');
}

// ---------- Notion ----------
async function cached(env, key, fn, ctx) {
  const c = await env.KV.get(key, 'json');
  if (c && Date.now() - c.t < 10 * 60e3) return c.v;
  const put = v => env.KV.put(key, JSON.stringify({ t: Date.now(), v }), { expirationTtl: 86400 }).then(() => v);
  if (c && ctx) { ctx.waitUntil(fn().then(put).catch(() => {})); return c.v; }
  try { return await put(await fn()); } catch (e) { if (c) return c.v; throw e; } // Notion svarer ikke akkurat nå: bruk forrige lagrede versjon
}
async function queryAll(env, notion, ds, body) { let out = [], cursor; do { const r = await notion(env, `/data_sources/${ds}/query`, { page_size: 100, ...body, ...(cursor ? { start_cursor: cursor } : {}) }); out = out.concat(r.results); cursor = r.has_more ? r.next_cursor : null; } while (cursor); return out; }
async function children(env, notion, id) { let out = [], cursor; do { const r = await notion(env, `/blocks/${id}/children?page_size=100${cursor ? '&start_cursor=' + cursor : ''}`); out = out.concat(r.results); cursor = r.has_more ? r.next_cursor : null; } while (cursor); return out; }
async function flat(env, notion, id, depth = 0) { const out = []; for (const b of await children(env, notion, id)) { if (['column_list', 'column', 'synced_block'].includes(b.type) && b.has_children && depth < 3) out.push(...await flat(env, notion, b.id, depth + 1)); else out.push(b); } return out; }
export async function renderPage(env, notion, id, depth = 0) {
  const blocks = await children(env, notion, id); const items = [], links = [];
  for (const b of blocks) {
    let kids = ''; if (b.has_children && depth < 3 && !['child_page', 'child_database'].includes(b.type)) { const r = await renderPage(env, notion, b.id, depth + 1); kids = r.html; links.push(...r.links); }
    if (b.type === 'child_page') links.push(b.id.replace(/-/g, ''));
    items.push({ html: blockHtml(b, kids), kind: LIST[b.type] });
  }
  return { html: pageHtml(items), links };
}
// Vakter fra VAKTPLAN fra i går og fremover (samme spørring og cache for medlemsdelen og for kveldene med vakt under).
const loadShifts = (env, notion, ctx, today) => cached(env, 'cache:shifts', async () => (await queryAll(env, notion, env.NOTION_SHIFTS_DS, { filter: { property: 'Dato', date: { on_or_after: addDays(today, -1) } }, sorts: [{ property: 'Dato', direction: 'ascending' }] })).map(shiftFrom), ctx);
// Kvelder med vakt: datoer der noen står på åpnevakt, stengevakt eller som ansvarlig. Bare datoer, aldri navn, så de kan vises offentlig.
// Uten arrangement blir en slik kveld «Normal pub» i appen. Uten vakt og uten arrangement vises ingenting (Georg 27.10.2026).
export const hasCrew = s => !!(s && s.date && (s.open?.length || s.close?.length || s.responsible));
export const crewDates = shifts => [...new Set((shifts || []).filter(hasCrew).map(s => s.date))].sort();
export async function shiftNights(env, notion, ctx, today) {
  if (!env.NOTION_TOKEN) return crewDates(SAMPLE(today).shifts);
  return crewDates(await loadShifts(env, notion, ctx, today));
}
export async function loadAll(env, notion, ctx, today) {
  if (!env.NOTION_TOKEN) return SAMPLE(today);
  const [members, board, shifts, manuals] = await Promise.all([
    cached(env, 'cache:members', async () => (await queryAll(env, notion, env.NOTION_MEMBERS_DS, {})).map(memberFrom).filter(m => m.name), ctx),
    cached(env, 'cache:board', async () => { const rows = (await queryAll(env, notion, env.NOTION_BOARD_DS, {})).map(boardFrom);
      for (const b of rows) if (b.userId && !b.name) { try { b.name = (await notion(env, `/users/${b.userId}`)).name || ''; } catch (e) { break; } } // krever «lese brukerinformasjon» på integrasjonen, ellers brukes rollen som navn
      return rows; }, ctx),
    loadShifts(env, notion, ctx, today),
    cached(env, 'cache:manuals', async () => manualsFrom(await flat(env, notion, env.NOTION_INFO_PAGE)), ctx),
  ]);
  return { members, board, shifts, manuals };
}
export async function manualHtml(env, notion, id, ctx) {
  if (!env.NOTION_TOKEN) return { html: SAMPLE_MANUAL, links: [] };
  return cached(env, 'cache:manual:' + id, () => renderPage(env, notion, id), ctx);
}

// ---------- eksempeldata (uten Notion-nøkkel) ----------
const nextThu = (today, n = 0) => { let d = today; while (new Date(d + 'T12:00:00Z').getUTCDay() !== 4) d = addDays(d, 1); return addDays(d, 7 * n); };
export function SAMPLE(today) {
  const members = [['m1', 'Ferdinand Nilsen', '90000000'], ['m2', 'Kari Nordmann', '90000001'], ['m3', 'Ola Hansen', '90000002'], ['m4', 'Bianka Szczypka', '90000003'], ['m5', 'Caspian Björkstam', '90000004'], ['m6', 'Celina Dolonen', '90000005'], ['m7', 'Utgått Medlem', '90000006', '2025-06-30'], ['m8', 'Sven Svensson', '46701234567', '', '46']].map(([id, name, phone, until, cc]) => ({ id, name, phone, cc: cc || '47', email: name.toLowerCase().replace(/[^a-z]/g, '.') + '@example.com', until: until || '' }));
  const board = [{ id: 'b1', role: 'Leder', phone: '90000000', cc: '47', userId: 'u1', name: 'Ferdinand Nilsen' }, { id: 'b2', role: 'Barsjef', phone: '90000009', cc: '47', userId: 'u2', name: 'Einar Mar Malmquist' }];
  const t = nextThu(today);
  const shifts = [{ id: 's1', date: t, pub: 'PUB: 9', obs: 'Ny keg-leverandør. Kvittering ligger i kassaskuffen.', event: 'Rolig Pub', eventId: '', responsible: { userId: 'u2', name: 'Einar Mar Malmquist' }, open: ['m1', 'm2', 'm3'], close: ['m4', 'm5', 'm6'] }, { id: 's2', date: nextThu(today, 2), pub: 'PUB: 11', obs: '', event: 'Halloween', eventId: '', responsible: { userId: 'u1', name: 'Ferdinand Nilsen' }, open: ['m4', 'm5'], close: ['m1', 'm2', 'm3'] }, { id: 's3', date: nextThu(today, 6), pub: 'PUB: 15', obs: '', event: 'Julepub', eventId: '', responsible: null, open: ['m1', 'm6'], close: ['m2'] }];
  const manuals = ['Pubvakt: Regler for salg og skjenking', 'Skifte vakt', 'Kontakte pubstyret', 'Hvordan åpne Puben', 'Kasse og oppgjør', 'Hvordan bytte keg', 'Renhold og avfall', 'Avvik (skader, uønskede hendelser)', 'Lydsystemet og musikk', 'Hvordan låse Puben'].map((title, i) => ({ id: 'a'.repeat(31) + i.toString(16), title, group: i < 3 ? 0 : i < 4 ? 1 : i < 9 ? 2 : 3 }));
  return { members, board, shifts, manuals };
}
const SAMPLE_MANUAL = '<h3>Før du åpner</h3><ol><li>Lås opp bakdøra med nøkkelen i safen.</li><li>Slå på lyset ved trappa.</li></ol><aside class="callout">Alarmen må av innen 30 sekunder.</aside><h3>Kasse</h3><p>Start kassen og tell vekslepengene. <b>Skriv beløpet</b> i boka.</p><details><summary>Hvis kassen ikke starter</summary><p>Hold inne knappen i 10 sekunder.</p></details><hr><p class="muted">Eksempeltekst. I drift hentes dette fra Notion.</p>';
