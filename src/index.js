// AHO Puben: én Worker som serverer appen (public/) og API-et.
// Notion → arrangementer, DeepL → engelsk, Web Push → varsler, Notion → forslag.
import { buildPushPayload } from '@block65/webcrypto-web-push';

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
    try { res = await route(req, url, env); } catch (e) { res = json({ error: String(e.message || e) }, 500); }
    res = new Response(res.body, res);
    for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
    return res;
  },
  async scheduled(ev, env, ctx) { ctx.waitUntil(tick(env)); },
};

async function route(req, url, env) {
  const p = url.pathname, m = req.method;
  if (p === '/api/events' && m === 'GET') return json(await events(env));
  if (p === '/api/vapid') return json({ key: env.VAPID_PUBLIC || '' });
  if (p === '/api/subscribe' && m === 'POST') {
    const { subscription, prefs } = await req.json();
    if (!subscription?.endpoint?.startsWith('https://') || !subscription.keys?.p256dh) return json({ error: 'bad subscription' }, 400);
    const offsets = (Array.isArray(prefs?.offsets) ? prefs.offsets : [[0, 16], [1, 12]]).filter(o => Array.isArray(o) && Number.isInteger(o[0]) && Number.isInteger(o[1]) && o[0] >= 0 && o[0] <= 14 && o[1] >= 0 && o[1] <= 23).slice(0, 4);
    await env.KV.put('sub:' + await id(subscription.endpoint), JSON.stringify({ subscription, prefs: { offsets, plain: prefs?.plain !== false, lang: prefs?.lang === 'en' ? 'en' : 'no' }, t: Date.now() }));
    return json({ ok: true });
  }
  if (p === '/api/subscribe' && m === 'DELETE') { const { endpoint } = await req.json(); await env.KV.delete('sub:' + await id(String(endpoint))); return json({ ok: true }); }
  if (p === '/api/test' && m === 'POST') {
    const { endpoint, lang } = await req.json();
    const s = await env.KV.get('sub:' + await id(String(endpoint)), 'json');
    if (!s) return json({ error: 'unknown subscription' }, 404);
    const ok = await push(env, s.subscription, { title: 'AHO Puben', body: lang === 'en' ? 'Test alert. Alerts work on this phone.' : 'Testvarsel. Varsler virker på denne telefonen.', url: '/', tag: 'test' });
    return json({ ok }, ok ? 200 : 502);
  }
  if (p === '/api/suggest' && m === 'POST') return suggest(req, env);
  if (p.startsWith('/api/ics/') && m === 'GET') {
    const e = (await events(env)).find(x => x.id === p.slice(9));
    if (!e) return new Response('Not found', { status: 404 });
    return new Response(ics(e), { headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': `attachment; filename="aho-pub-${e.date}.ics"` } });
  }
  return json({ error: 'not found' }, 404);
}

// ---------- Notion ----------
async function notion(env, path, body) {
  const r = await fetch('https://api.notion.com/v1' + path, { method: body ? 'POST' : 'GET', headers: { authorization: 'Bearer ' + env.NOTION_TOKEN, 'notion-version': '2022-06-28', 'content-type': 'application/json' }, body: body && JSON.stringify(body) });
  if (!r.ok) throw new Error('Notion ' + r.status + ': ' + (await r.text()).slice(0, 200));
  return r.json();
}
function fromNotion(p) {
  const P = Object.entries(p.properties);
  const by = (type, re) => (P.find(([n, v]) => v.type === type && re && re.test(n)) || P.find(([, v]) => v.type === type))?.[1];
  const rt = a => (a || []).map(x => x.plain_text).join('');
  const f = by('files', /bilde|image|photo/i)?.files?.[0];
  return {
    id: p.id.replace(/-/g, ''),
    date: by('date')?.date?.start?.slice(0, 10) || '',
    title: rt(by('title')?.title),
    type: by('select', /type/i)?.select?.name || '',
    desc: rt(by('rich_text', /beskriv|desc|tekst|info/i)?.rich_text),
    image: f ? (f.file?.url || f.external?.url || '') : (p.cover?.file?.url || p.cover?.external?.url || ''), // ponytail: Notion-bilde-URL-er utløper etter 1 t, cache er 10 min. Proxy via Worker hvis bilder forsvinner.
    pub: by('number', /pub|nr|nummer/i)?.number ?? null,
  };
}
async function events(env) {
  const c = await env.KV.get('events', 'json');
  if (c && Date.now() - c.t < 10 * 60e3) return c.items;
  let items = SAMPLE;
  if (env.NOTION_TOKEN && env.NOTION_DB_ID) {
    const r = await notion(env, `/databases/${env.NOTION_DB_ID}/query`, { page_size: 100 });
    const since = addDays(osloNow().date, -1);
    items = r.results.map(fromNotion).filter(e => e.date && e.title && e.date >= since).sort((a, b) => a.date.localeCompare(b.date));
    for (const e of items) { e.titleEn = await translate(env, e.title); e.descEn = await translate(env, e.desc); e.typeEn = TYPES[e.type] || await translate(env, e.type); }
  }
  await env.KV.put('events', JSON.stringify({ t: Date.now(), items }), { expirationTtl: 3600 });
  return items;
}
async function translate(env, text) {
  if (!text || !env.DEEPL_KEY) return '';
  const k = 'tr:' + await id(text); const c = await env.KV.get(k); if (c !== null) return c;
  const host = env.DEEPL_KEY.endsWith(':fx') ? 'api-free.deepl.com' : 'api.deepl.com';
  const r = await fetch(`https://${host}/v2/translate`, { method: 'POST', headers: { authorization: 'DeepL-Auth-Key ' + env.DEEPL_KEY, 'content-type': 'application/json' }, body: JSON.stringify({ text: [text], source_lang: 'NB', target_lang: 'EN-GB' }) });
  if (!r.ok) return '';
  const out = (await r.json()).translations?.[0]?.text || '';
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
  const db = await notion(env, `/databases/${env.NOTION_SUGGEST_DB_ID}`);
  const titleProp = Object.entries(db.properties).find(([, v]) => v.type === 'title')[0];
  const para = s => ({ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: String(s).slice(0, 1800) } }] } });
  await notion(env, '/pages', { parent: { database_id: env.NOTION_SUGGEST_DB_ID }, properties: { [titleProp]: { title: [{ text: { content: text } }] } }, children: [more && para(more), name && para('Fra: ' + name)].filter(Boolean) });
  return json({ ok: true });
}

// ---------- kalenderfil ----------
function ics(e) {
  const esc = s => String(s || '').replace(/[\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
  const d = e.date.replace(/-/g, ''), d2 = addDays(e.date, 1).replace(/-/g, '');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AHO Puben//NO', 'BEGIN:VEVENT', `UID:${e.id}@ahopuben`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;TZID=${OSLO}:${d}T190000`, `DTEND;TZID=${OSLO}:${d2}T010000`, `SUMMARY:${esc(e.title)}`, `DESCRIPTION:${esc(e.desc)}`, 'LOCATION:AHO Puben', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}

// ---------- push ----------
async function push(env, subscription, data) {
  if (!env.VAPID_PUBLIC || !env.VAPID_PRIVATE) return false;
  const payload = await buildPushPayload({ data: JSON.stringify(data), options: { ttl: 6 * 3600 } }, subscription, { subject: env.VAPID_SUBJECT || 'https://github.com/georgferdinandnilsen/AHOPUBEN', publicKey: env.VAPID_PUBLIC, privateKey: env.VAPID_PRIVATE });
  const r = await fetch(subscription.endpoint, payload);
  if (r.status === 404 || r.status === 410) await env.KV.delete('sub:' + await id(subscription.endpoint));
  return r.ok;
}
function message(e, days, lang) {
  const en = lang === 'en';
  const name = e.plain ? (en ? 'Pub night' : 'Rolig pub') : (en && e.titleEn) || e.title;
  const hours = en ? '7pm-1am' : 'kl 19-01';
  const when = days === 0 ? (en ? 'tonight' : 'i kveld') : days === 1 ? (en ? 'tomorrow' : 'i morgen') : longDate(e.date, lang);
  const first = ((en && e.descEn) || e.desc || '').split(/(?<=[.!?])\s/)[0];
  return { title: 'AHO Puben', body: `${name} ${when}, ${hours}.${e.plain ? (en ? ' No programme, just the pub.' : ' Ingen program, bare pub.') : first ? ' ' + first : ''}`, url: '/', tag: e.date };
}
async function tick(env) {
  const { date, hour } = osloNow();
  const real = await events(env);
  const has = new Set(real.map(e => e.date));
  const all = real.map(e => ({ ...e, plain: false }));
  for (let i = 0; i < 56; i++) { const d = addDays(date, i); if (weekday(d) === 4 && !has.has(d)) all.push({ date: d, plain: true }); }
  const list = await env.KV.list({ prefix: 'sub:' }); // ponytail: maks 1000 abonnenter per side, mer har ikke en studentpub
  for (const k of list.keys) {
    const s = await env.KV.get(k.name, 'json'); if (!s) continue;
    for (const e of all) {
      if (e.plain && !s.prefs.plain) continue;
      for (const [days, h] of s.prefs.offsets) if (h === hour && addDays(e.date, -days) === date) await push(env, s.subscription, message(e, days, s.prefs.lang));
    }
  }
}
