// AHO Puben: én Worker som serverer appen (public/) og API-et.
// Notion → arrangementer, DeepL → engelsk, Web Push → varsler, Notion → forslag.
import { buildPushPayload } from '@block65/webcrypto-web-push';
import { fromNotion, pickBody } from './notion.js';
import { normOffsets, when } from './notify.js';
import { memberRoute, shiftTick, shiftMessage } from './memberRoutes.js';

const OSLO = 'Europe/Oslo';
const TYPES = { Aktivitet: 'Activity', DJ: 'DJ', Konsert: 'Concert', Quiz: 'Quiz', Fest: 'Party' };
const SAMPLE = [ // ponytail: eksempeldata til Notion-nøkkelen er på plass
  { id: 's1', date: '2026-10-29', title: 'Halloween', titleEn: 'Halloween', type: 'Aktivitet', typeEn: 'Activity', desc: 'Kostymekonkurranse, DJ og skummel drinkmeny. Beste kostyme vinner bar-tab. Dørene åpner 19, kåringen er kl 23.', descEn: 'Costume contest, DJ and a spooky drinks menu. Best costume wins a bar tab. Doors at 7pm, judging at 11pm.', image: '/sample-halloween.jpg', pub: 11 },
  { id: 's2', date: '2026-11-05', title: 'DJ: Dave Van Zon', titleEn: 'DJ: Dave Van Zon', type: 'DJ', typeEn: 'DJ', desc: 'DJ-kveld. Fri inngang, dørene åpner 19.', descEn: 'DJ night. Free entry, doors at 7pm.', image: '', pub: 12 },
  { id: 's3', date: '2026-11-26', title: 'Julepub', titleEn: 'Christmas pub', type: 'Aktivitet', typeEn: 'Activity', desc: 'Gløgg, pepperkaker og julemusikk. Siste pub før jul.', descEn: 'Mulled wine, gingerbread and Christmas music. Last pub before the holidays.', image: '', pub: 15 },
];

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const id = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
const addDays = (date, n) => { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const weekday = date => new Date(date + 'T12:00:00Z').getUTCDay();
function osloNow(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('sv-SE', { timeZone: OSLO, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
}
const longDate = (date, lang) => new Date(date + 'T12:00:00Z').toLocaleDateString(lang === 'en' ? 'en-GB' : 'nb-NO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);
    const cors = { 'access-control-allow-origin': req.headers.get('origin') || '*', 'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS', 'access-control-allow-headers': 'content-type' };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    let res;
    try { res = await route(req, url, env, ctx); } catch (e) { res = json({ error: String(e.message || e) }, 500); }
    res = new Response(res.body, res);
    for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
    return res;
  },
  async scheduled(ev, env, ctx) { ctx.waitUntil(tick(env)); },
};

async function route(req, url, env, ctx) {
  const p = url.pathname, m = req.method;
  if (p.startsWith('/api/member/') || p.startsWith('/api/board/')) return memberRoute(req, url, env, ctx, { notion, json, push, osloNow, addDays });
  if (p === '/api/events' && m === 'GET') return json(await events(env, ctx));
  if (p === '/api/vapid') return json({ key: env.VAPID_PUBLIC || '' });
  if (p === '/api/settings') return json({ join: (await env.KV.get('settings:join')) !== 'off' }); // styret kan skjule «Bli medlem» for alle
  if (p === '/api/subscribe' && m === 'POST') {
    const { subscription, prefs } = await req.json();
    if (!subscription?.endpoint?.startsWith('https://') || !subscription.keys?.p256dh) return json({ error: 'bad subscription' }, 400);
    const offsets = normOffsets(prefs?.offsets);
    const ms = /^[0-9a-f]{48}$/.test(String(prefs?.memberToken || '')) ? await env.KV.get('sess:' + prefs.memberToken, 'json') : null; // innlogget medlem → vaktvarsler og styremeldinger
    await env.KV.put('sub:' + await id(subscription.endpoint), JSON.stringify({ subscription, memberId: ms?.memberId || '', boardUserId: ms?.boardUserId || '', prefs: { offsets, plain: prefs?.plain !== false, shift: prefs?.shift !== false, lang: prefs?.lang === 'en' ? 'en' : 'no' }, t: Date.now() }));
    return json({ ok: true });
  }
  if (p === '/api/subscribe' && m === 'DELETE') { const { endpoint } = await req.json(); await env.KV.delete('sub:' + await id(String(endpoint))); return json({ ok: true }); }
  if (p === '/api/test' && m === 'POST') {
    const { endpoint, lang } = await req.json();
    const s = await env.KV.get('sub:' + await id(String(endpoint)), 'json');
    if (!s) return json({ error: 'unknown subscription' }, 404);
    const ok = await push(env, s.subscription, { title: lang === 'en' ? 'Test alert' : 'Testvarsel', body: lang === 'en' ? 'Alerts work on this phone.' : 'Varsler virker på denne telefonen.', url: '/', tag: 'test' });
    return json({ ok }, ok ? 200 : 502);
  }
  if (p === '/api/suggest' && m === 'POST') return suggest(req, env);
  if (p.startsWith('/api/ics/') && m === 'GET') {
    const id = p.slice(9), day = /^p\d{4}-\d\d-\d\d$/.test(id) ? id.slice(1) : '';
    const e = (await events(env, ctx)).find(x => x.id === id) || (day && weekday(day) === 4 ? { id, date: day, title: 'Rolig pub', desc: 'Ingen program. Åpent 19-01.' } : null);
    if (!e) return new Response('Not found', { status: 404 });
    return new Response(ics(e), { headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': `inline; filename="aho-pub-${e.date}.ics"` } });
  }
  return json({ error: 'not found' }, 404);
}

// ---------- Notion ----------
async function notion(env, path, body) {
  const r = await fetch('https://api.notion.com/v1' + path, { method: body ? 'POST' : 'GET', headers: { authorization: 'Bearer ' + env.NOTION_TOKEN, 'notion-version': '2025-09-03', 'content-type': 'application/json' }, body: body && JSON.stringify(body) });
  if (!r.ok) throw new Error('Notion ' + r.status + ': ' + (await r.text()).slice(0, 200));
  return r.json();
}
// Databasen har flere datakilder (Arrangementer, ønsker, …). Vi finner dem én gang i timen og velger riktig på innhold, ikke på rekkefølge.
async function sources(env, dbId) {
  const k = 'ds:' + dbId; const c = await env.KV.get(k, 'json'); if (c) return c;
  const db = await notion(env, `/databases/${dbId}`);
  const out = [];
  for (const d of db.data_sources || [{ id: dbId }]) out.push({ id: d.id, name: d.name || '', props: (await notion(env, `/data_sources/${d.id}`)).properties });
  console.log('Notion-datakilder:', JSON.stringify(out.map(x => ({ id: x.id, name: x.name, props: Object.entries(x.props).map(([n, v]) => `${n}:${v.type}`) }))));
  await env.KV.put(k, JSON.stringify(out), { expirationTtl: 3600 });
  return out;
}
const hasDate = x => Object.entries(x.props).some(([n, v]) => v.type === 'date' && /når/i.test(n));

// Server utdatert liste umiddelbart og oppdater i bakgrunnen: første besøkende etter utløp venter aldri på Notion og DeepL.
async function events(env, ctx) {
  const c = await env.KV.get('events', 'json');
  if (c && Date.now() - c.t < 10 * 60e3) return c.items;
  if (c && ctx) { ctx.waitUntil(refresh(env, c).catch(() => {})); return c.items; }
  return refresh(env, c);
}
// Sideinnhold, med ett nivå ned i toggler/kolonner/callouts så info og bilde finnes uansett hvordan styret har lagt dem opp.
async function blocksOf(env, id, depth = 0) {
  const out = [];
  for (const b of (await notion(env, `/blocks/${id}/children?page_size=50`)).results) {
    out.push(b);
    if (b.has_children && depth < 2 && ['toggle', 'callout', 'quote', 'column_list', 'column'].includes(b.type)) out.push(...await blocksOf(env, b.id, depth + 1));
  }
  return out;
}
async function refresh(env, c) {
  let items = SAMPLE;
  if (env.NOTION_TOKEN && env.NOTION_DB_ID) {
    try {
      const ev = (await sources(env, env.NOTION_DB_ID)).find(hasDate); if (!ev) throw new Error('fant ingen datakilde med datofeltet «Når»');
      const r = await notion(env, `/data_sources/${ev.id}/query`, { page_size: 100, filter: { property: 'Når', date: { on_or_after: osloNow().date } }, sorts: [{ property: 'Når', direction: 'ascending' }] }); // samme som visningen «Kommende»
      items = r.results.map(fromNotion).filter(e => e.date && e.title).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 30);
      for (const e of items) {
        if (!e.image || !e.desc) { const b = pickBody(await blocksOf(env, e.id)); e.image ||= b.image; e.desc ||= b.desc; } // ponytail: Notion-bilde-URL-er utløper etter 1 t, cache er 10 min. Proxy via Worker hvis bilder forsvinner.
        e.titleEn = await translate(env, e.title); e.descEn = await translate(env, e.desc); e.typeEn = TYPES[e.type] || await translate(env, e.type);
      }
    } catch (err) { console.error('Notion-henting feilet:', err.message); if (c) return c.items; throw err; }
  }
  await env.KV.put('events', JSON.stringify({ t: Date.now(), items }), { expirationTtl: 86400 });
  return items;
}
async function translate(env, text) {
  if (!text || !env.DEEPL_KEY) return '';
  const k = 'tr:' + await id(text); const c = await env.KV.get(k); if (c !== null) return c;
  const hosts = env.DEEPL_KEY.endsWith(':fx') ? ['api-free.deepl.com', 'api.deepl.com'] : ['api.deepl.com', 'api-free.deepl.com']; // 403 = nøkkelen hører til den andre tjenesten
  let out = '';
  for (const h of hosts) {
    const r = await fetch(`https://${h}/v2/translate`, { method: 'POST', headers: { authorization: 'DeepL-Auth-Key ' + env.DEEPL_KEY, 'content-type': 'application/json' }, body: JSON.stringify({ text: [text], source_lang: 'NB', target_lang: 'EN-GB' }) });
    if (r.status === 403) continue;
    if (!r.ok) return '';
    out = (await r.json()).translations?.[0]?.text || ''; break;
  }
  if (!out) return '';
  await env.KV.put(k, out);
  return out;
}
async function suggest(req, env) {
  const { idea, more, name } = await req.json();
  const text = String(idea || '').trim().slice(0, 120);
  if (!text) return json({ error: 'empty' }, 400);
  const rk = 'rl:' + (req.headers.get('cf-connecting-ip') || 'local'); // ponytail: 5 forslag per time per IP
  const n = Number((await env.KV.get(rk)) || 0); if (n >= 5) return json({ error: 'slow down' }, 429);
  await env.KV.put(rk, String(n + 1), { expirationTtl: 3600 });
  if (!env.NOTION_TOKEN || !env.NOTION_SUGGEST_DB_ID) return json({ ok: true, note: 'sample mode, not stored' });
  const all = await sources(env, env.NOTION_SUGGEST_DB_ID);
  const src = all.find(hasDate); // forslag ligger i Arrangementer-datakilden, som visningen «Ideer» (Bestemt: Nei)
  if (!src) throw new Error('fant ingen datakilde med datofeltet «Når»');
  const E = Object.entries(src.props);
  const properties = { [E.find(([, v]) => v.type === 'title')[0]]: { title: [{ text: { content: text } }] } };
  const bestemt = E.find(([n, v]) => /bestemt/i.test(n) && v.type === 'select'); // «Nei» = ikke bestemt ennå = vises i Ideer
  if (bestemt) properties[bestemt[0]] = { select: { name: (bestemt[1].select.options || []).find(o => /^nei/i.test(o.name))?.name || 'Nei' } };
  const besk = E.find(([n, v]) => /beskriv/i.test(n) && v.type === 'rich_text'); if (besk && more) properties[besk[0]] = { rich_text: [{ text: { content: String(more).slice(0, 1800) } }] };
  const para = s => ({ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: String(s).slice(0, 1800) } }] } });
  const page = await notion(env, '/pages', { parent: { type: 'data_source_id', data_source_id: src.id }, properties, children: [more && para(more), name && para('Fra: ' + name)].filter(Boolean) });
  console.log('Forslag opprettet i datakilde:', src.name, '| felt satt:', Object.keys(properties).join(', '), '| side:', page.url);
  return json({ ok: true });
}

// ---------- kalenderfil ----------
function ics(e) {
  const esc = s => String(s || '').replace(/[\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
  const d = e.date.replace(/-/g, ''), d2 = addDays(e.date, 1).replace(/-/g, '');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AHO Puben//NO', 'BEGIN:VEVENT', `UID:${e.id}@ahopuben`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;TZID=${OSLO}:${d}T${(e.time || '19:00').replace(':', '')}00`, `DTEND;TZID=${OSLO}:${d2}T010000`, `SUMMARY:${esc(e.title)}`, `DESCRIPTION:${esc(e.desc)}`, 'LOCATION:AHO Puben', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}

// ---------- push ----------
async function push(env, subscription, data) {
  if (!env.VAPID_PUBLIC || !env.VAPID_PRIVATE) return false;
  const payload = await buildPushPayload({ data: JSON.stringify(data), options: { ttl: 6 * 3600 } }, subscription, { subject: env.VAPID_SUBJECT || 'https://github.com/georgferdinandnilsen/AHOPUBEN', publicKey: env.VAPID_PUBLIC, privateKey: env.VAPID_PRIVATE });
  const r = await fetch(subscription.endpoint, payload);
  if (r.status === 404 || r.status === 410) await env.KV.delete('sub:' + await id(subscription.endpoint));
  return r.ok;
}
function message(e, key, lang) {
  const en = lang === 'en';
  const name = e.plain ? (en ? 'Pub night' : 'Rolig pub') : (en && e.titleEn) || e.title;
  const hours = en ? '7pm-1am' : 'Kl 19-01';
  const day = key === 'same' ? (en ? 'tonight' : 'i kveld') : key === 'day' ? (en ? 'tomorrow' : 'i morgen') : longDate(e.date, lang);
  const first = ((en && e.descEn) || e.desc || '').split(/(?<=[.!?])\s/)[0];
  return { title: `${name} ${day}`, body: `${hours}.${e.plain ? (en ? ' No programme, just the pub.' : ' Ingen program, bare pub.') : first ? ' ' + first : ''}`, url: '/', tag: e.date + key }; // iOS viser selv «from AHO PUBEN» under tittelen
}
async function tick(env) {
  const { date, hour } = osloNow();
  const real = await events(env);
  const has = new Set(real.map(e => e.date));
  const all = real.map(e => ({ plain: false, ...e }));
  for (let i = 0; i < 56; i++) { const d = addDays(date, i); if (weekday(d) === 4 && !has.has(d)) all.push({ date: d, plain: true }); }
  const list = await env.KV.list({ prefix: 'sub:' }); // ponytail: maks 1000 abonnenter per side, mer har ikke en studentpub
  const subs = [];
  for (const k of list.keys) {
    const s = await env.KV.get(k.name, 'json'); if (!s) continue; subs.push(s);
    for (const e of all) {
      if (e.plain && !s.prefs.plain) continue;
      const sent = new Set();
      for (const k of normOffsets(s.prefs.offsets)) {
        const [days, h] = when(e, k), slot = days + '|' + h;
        if (h === hour && addDays(e.date, -days) === date && !sent.has(slot)) { sent.add(slot); await push(env, s.subscription, message(e, k, s.prefs.lang)); } // samme tidspunkt to ganger (mandag og dagen før på en tirsdag) sendes én gang
      }
    }
  }
  if (env.NOTION_TOKEN) await shiftTick(env, { notion, push, addDays }, subs, date, hour).catch(e => console.error('vaktvarsler feilet:', e.message));
}
