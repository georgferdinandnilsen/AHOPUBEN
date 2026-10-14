// HTTP-delen av medlemsdelen. Innlogging med telefonnummer, mine vakter, manualer, kalender, styremeldinger og styrekode.
import { normPhone, isActive, myShifts, recipients, loadAll, manualHtml, shiftsIcs, countryCodes } from './members.js';
import { normOffsets } from './notify.js';

async function notionPatch(env, notion, pageId, properties) {
  const r = await fetch('https://api.notion.com/v1/pages/' + pageId, { method: 'PATCH', headers: { authorization: 'Bearer ' + env.NOTION_TOKEN, 'notion-version': '2025-09-03', 'content-type': 'application/json' }, body: JSON.stringify({ properties }) });
  if (!r.ok) throw new Error('Notion ' + r.status + ': ' + (await r.text()).slice(0, 200));
  return r.json();
}
const rand = () => [...crypto.getRandomValues(new Uint8Array(24))].map(b => b.toString(16).padStart(2, '0')).join('');
const sha = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');
const codeHash = (env, code, boardId) => sha(`${code}:${boardId}:${env.VAPID_PRIVATE || ''}`); // ponytail: VAPID-nøkkelen som pepper, egen hemmelighet hvis den noen gang roteres

async function rateLimit(env, req, key, max) { const k = `rl:${key}:${req.headers.get('cf-connecting-ip') || 'local'}`; const n = Number((await env.KV.get(k)) || 0); if (n >= max) return false; await env.KV.put(k, String(n + 1), { expirationTtl: 3600 }); return true; }
async function seenCount(env, msgId) { return (await env.KV.list({ prefix: `seen:${msgId}:` })).keys.length; }
async function messages(env, memberId, limit = 20) {
  const keys = (await env.KV.list({ prefix: 'msg:' })).keys; // ponytail: nøklene er tidsstemplet, KV sorterer på navn, så siste 20 er de nyeste
  const out = [];
  for (const k of keys.slice(-limit).reverse()) { const m = await env.KV.get(k.name, 'json'); if (!m) continue; m.seen = await seenCount(env, m.id); if (memberId) m.seenByMe = !!(await env.KV.get(`seen:${m.id}:${memberId}`)); out.push(m); }
  return out;
}

export async function memberRoute(req, url, env, ctx, D) {
  const p = url.pathname, m = req.method, today = D.osloNow().date;
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') || url.searchParams.get('t') || '';
  const sess = /^[0-9a-f]{48}$/.test(token) ? await env.KV.get('sess:' + token, 'json') : null;
  const body = m === 'POST' ? await req.json().catch(() => ({})) : {};
  const data = () => loadAll(env, D.notion, ctx, today);

  if (p === '/api/member/countries') { const { members, board } = await data(); return D.json({ codes: countryCodes([...members, ...board]) }); }
  if (p === '/api/member/login' && m === 'POST') {
    if (!await rateLimit(env, req, 'login', 20)) return D.json({ error: 'slow down' }, 429);
    const ph = normPhone(body.phone); if (ph.length < 7) return D.json({ error: 'bad_phone' }, 400);
    const { members, board } = await data();
    const me = members.find(x => x.phone && x.phone === ph); const b = board.find(x => x.phone && x.phone === ph); // styremedlemmer trenger ikke stå i medlemslisten
    if (!me && !b) return D.json({ error: 'not_member' }, 404);
    if (me && !isActive(me, today) && !b) return D.json({ error: 'expired', until: me.until }, 403);
    const t = rand(); const name = me?.name || b.name || b.role;
    await env.KV.put('sess:' + t, JSON.stringify({ memberId: me?.id || '', name, phone: ph, boardId: b?.id || '', boardUserId: b?.userId || '', t: Date.now() }), { expirationTtl: 180 * 86400 });
    return D.json({ token: t, name, board: !!b, hasCode: b ? !!(await env.KV.get('code:' + b.id)) : false });
  }
  // Glemt eller feil lagret nummer: finn medlemskortet med e-post, skriv inn nytt nummer, som lagres i Notion.
  if (p === '/api/member/recover' && m === 'POST') {
    if (!await rateLimit(env, req, 'recover', 10)) return D.json({ error: 'slow down' }, 429);
    const email = String(body.email || '').trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return D.json({ error: 'bad_email' }, 400);
    const { members } = await data(); const me = members.find(x => x.email && x.email === email);
    if (!me) return D.json({ error: 'not_found' }, 404);
    if (!isActive(me, today)) return D.json({ error: 'expired', until: me.until }, 403);
    const t = rand(); await env.KV.put('recover:' + t, me.id, { expirationTtl: 600 });
    return D.json({ ok: true, token: t });
  }
  if (p === '/api/member/recover/phone' && m === 'POST') {
    const rt = String(body.token || ''); const memberId = /^[0-9a-f]{48}$/.test(rt) ? await env.KV.get('recover:' + rt) : null;
    if (!memberId) return D.json({ error: 'unauthorized' }, 401);
    const pretty = String(body.phone || '').trim(); const ph = normPhone(pretty); if (ph.length < 7) return D.json({ error: 'bad_phone' }, 400);
    const { members, board } = await data(); const me = members.find(x => x.id === memberId); if (!me) return D.json({ error: 'not_found' }, 404);
    if (members.some(x => x.id !== memberId && x.phone === ph)) return D.json({ error: 'phone_taken' }, 409); // nummeret tilhører et annet medlem
    if (env.NOTION_TOKEN) { await notionPatch(env, D.notion, me.id, { Phone: { phone_number: pretty } }); await env.KV.delete('cache:members'); }
    await env.KV.delete('recover:' + rt);
    console.log('Telefonnummer oppdatert via e-post for medlem', me.id);
    const b = board.find(x => x.phone === ph); const t = rand();
    await env.KV.put('sess:' + t, JSON.stringify({ memberId: me.id, name: me.name, phone: ph, boardId: b?.id || '', boardUserId: b?.userId || '', t: Date.now() }), { expirationTtl: 180 * 86400 });
    return D.json({ token: t, name: me.name, board: !!b, hasCode: b ? !!(await env.KV.get('code:' + b.id)) : false });
  }
  if (!sess) return D.json({ error: 'unauthorized' }, 401);

  if (p === '/api/member/logout') { await env.KV.delete('sess:' + token); return D.json({ ok: true }); }
  if (p === '/api/member/home') {
    const { members, board, shifts, manuals } = await data();
    const counts = sess.boardId ? Object.fromEntries(['all', 'upcoming', 'active'].map(k => [k, recipients(k, members, shifts, today).length])) : null;
    return D.json({ name: sess.name, board: !!sess.boardId, hasCode: sess.boardId ? !!(await env.KV.get('code:' + sess.boardId)) : false, today, shifts: myShifts(sess.memberId, shifts, members, board, sess.boardUserId), messages: await messages(env, sess.memberId || 'b' + sess.boardId), manuals, counts });
  }
  // Varselvalg på kontoen: alle push-abonnementer som tilhører medlemmet (telefonen) leses og oppdateres, så PC og telefon viser det samme.
  if (p === '/api/member/prefs') {
    const mine = [];
    for (const k of (await env.KV.list({ prefix: 'sub:' })).keys) { const s = await env.KV.get(k.name, 'json'); if (s && ((sess.memberId && s.memberId === sess.memberId) || (sess.boardUserId && s.boardUserId === sess.boardUserId))) mine.push({ k: k.name, s }); }
    if (m === 'POST') {
      for (const { k, s } of mine) { s.prefs = { ...s.prefs, offsets: normOffsets(body.offsets ?? s.prefs?.offsets), plain: body.plain ?? s.prefs?.plain !== false, shift: body.shift ?? s.prefs?.shift !== false }; await env.KV.put(k, JSON.stringify(s)); }
      return D.json({ ok: true, devices: mine.length });
    }
    const latest = mine.sort((a, b) => (b.s.t || 0) - (a.s.t || 0))[0];
    return D.json({ found: !!latest, devices: mine.length, prefs: latest ? latest.s.prefs : null });
  }
  if (p.startsWith('/api/member/manual/')) {
    const id = p.split('/')[4]; if (!/^[0-9a-f]{32}$/.test(id)) return D.json({ error: 'bad id' }, 400);
    const { manuals } = await data(); const allowed = new Set([...manuals.map(x => x.id), ...((await env.KV.get('manual-links', 'json')) || [])]); // bare manualer og sider lenket fra dem, aldri andre Notion-sider
    if (!allowed.has(id)) return D.json({ error: 'not a manual' }, 404);
    const r = await manualHtml(env, D.notion, id, ctx);
    if (r.links?.length) { const add = r.links.filter(x => !allowed.has(x)); if (add.length) await env.KV.put('manual-links', JSON.stringify([...allowed, ...add].filter(x => !manuals.some(mm => mm.id === x)))); }
    return D.json({ id, title: manuals.find(x => x.id === id)?.title || '', html: r.html });
  }
  if (p === '/api/member/shifts.ics') {
    const { members, board, shifts } = await data();
    return new Response(shiftsIcs(myShifts(sess.memberId, shifts, members, board, sess.boardUserId)), { headers: { 'content-type': 'text/calendar; charset=utf-8', 'cache-control': 'no-store' } });
  }
  if (p === '/api/member/seen' && m === 'POST') { for (const id of (body.ids || []).slice(0, 50)) if (/^[a-z0-9]{6,20}$/.test(id)) await env.KV.put(`seen:${id}:${sess.memberId || 'b' + sess.boardId}`, '1'); return D.json({ ok: true }); }

  // ---- styret ----
  if (!p.startsWith('/api/board/')) return D.json({ error: 'not found' }, 404);
  if (!sess.boardId) return D.json({ error: 'not_board' }, 403);
  const stored = await env.KV.get('code:' + sess.boardId);
  if (p === '/api/board/code' && m === 'POST') {
    const code = String(body.code || ''); if (!/^\d{4}$/.test(code)) return D.json({ error: 'bad_code' }, 400);
    if (stored) { const r = await env.KV.get('reset:' + sess.boardId, 'json'); if (!r || r.code !== String(body.temp || '')) return D.json({ error: 'need_temp' }, 403); }
    await env.KV.put('code:' + sess.boardId, await codeHash(env, code, sess.boardId)); await env.KV.delete('reset:' + sess.boardId);
    return D.json({ ok: true });
  }
  if (p === '/api/board/reset' && m === 'POST') {
    const code = String(1000 + Math.floor(Math.random() * 9000)); // lederen leser denne i Cloudflare KV, nøkkel reset:<styre-id>
    await env.KV.put('reset:' + sess.boardId, JSON.stringify({ code, name: sess.name, t: new Date().toISOString() }), { expirationTtl: 7 * 86400 });
    return D.json({ ok: true, key: 'reset:' + sess.boardId });
  }
  if (p === '/api/board/join' && m === 'POST') { // avkryssing i innstillingene: vis eller skjul «Bli medlem» for alle. Krever bare styreinnlogging, ikke kode.
    const on = body.visible !== false;
    await env.KV.put('settings:join', on ? 'on' : 'off'); await env.KV.put('settings:join:meta', JSON.stringify({ name: sess.name, t: new Date().toISOString() }));
    console.log('bli-medlem', on ? 'vist' : 'skjult', 'av', sess.name);
    return D.json({ ok: true, join: on });
  }
  if (!stored) return D.json({ error: 'no_code' }, 403);
  if (p === '/api/board/log') return D.json({ messages: await messages(env, null, 100) });
  if (p === '/api/board/send' && m === 'POST') {
    if (!await rateLimit(env, req, 'send', 30)) return D.json({ error: 'slow down' }, 429);
    if (await codeHash(env, String(body.code || ''), sess.boardId) !== stored) return D.json({ error: 'wrong_code' }, 403);
    const text = String(body.text || '').trim().slice(0, 300); const to = ['all', 'upcoming', 'active'].includes(body.to) ? body.to : 'all';
    if (!text) return D.json({ error: 'empty' }, 400);
    const { members, shifts } = await data(); const rec = new Set(recipients(to, members, shifts, today));
    const msg = { id: Date.now().toString(36) + rand().slice(0, 4), text, to, count: rec.size, sender: sess.name, t: Date.now() };
    await env.KV.put('msg:' + msg.id, JSON.stringify(msg));
    let pushed = 0;
    for (const k of (await env.KV.list({ prefix: 'sub:' })).keys) { const s = await env.KV.get(k.name, 'json'); if (s?.memberId && rec.has(s.memberId) && await D.push(env, s.subscription, { title: s.prefs?.lang === 'en' ? 'Message from the board' : 'Melding fra styret', body: text, url: '/#medlem', tag: 'msg' + msg.id })) pushed++; }
    return D.json({ ok: true, id: msg.id, count: rec.size, pushed });
  }
  return D.json({ error: 'not found' }, 404);
}

export function shiftMessage(sh, days, lang) {
  const en = lang === 'en', R = { open: { label: 'Åpnevakt', labelEn: 'Opening shift', time: '19-22' }, close: { label: 'Stengevakt', labelEn: 'Closing shift', time: '22-01' }, resp: { label: 'Ansvarlig', labelEn: 'In charge', time: '19-01' } }[sh.role];
  return { title: `${en ? R.labelEn : R.label} ${days ? (en ? 'tomorrow' : 'i morgen') : (en ? 'tonight' : 'i kveld')}, ${R.time}`, body: [sh.event || sh.pub, sh.coworkers.length ? (en ? 'With ' : 'Med ') + sh.coworkers.map(p => p.name.split(' ')[0]).join(', ') : '', sh.obs ? 'Obs: ' + sh.obs : ''].filter(Boolean).join('. '), url: '/#medlem', tag: 'shift' + sh.id + days };
}
// Vaktvarsler, kalt fra cron: kl 19 dagen før og én time før start.
export async function shiftTick(env, D, subs, date, hour) {
  const { members, board, shifts } = await loadAll(env, D.notion, null, date);
  const { shiftAlerts } = await import('./members.js');
  for (const s of subs) {
    if ((!s.memberId && !s.boardUserId) || s.prefs?.shift === false) continue;
    for (const sh of myShifts(s.memberId, shifts, members, board, s.boardUserId)) for (const [days, h] of shiftAlerts(sh)) {
      if (h !== hour || D.addDays(sh.date, -days) !== date) continue;
      await D.push(env, s.subscription, shiftMessage(sh, days, s.prefs?.lang));
    }
  }
}
