// Varselvalg og når de sendes. Egen fil så logikken kan testes (node test/notify.test.mjs).
// same = samme dag, 3 timer før start (kl 16 når puben åpner 19). day = dagen før kl 12. mon = mandag kl 12 i arrangementets uke.
export const KEYS = ['same', 'day', 'mon'];
const weekday = date => new Date(date + 'T12:00:00Z').getUTCDay();

// Eldre lagrede valg var par som [0,16] og [1,12]. Ukjente verdier forkastes, tomt valg gir standard.
export const normOffsets = a => {
  const old = { '0,16': 'same', '1,12': 'day' };
  const o = [...new Set((Array.isArray(a) ? a : []).map(x => Array.isArray(x) ? old[x.join()] : x).filter(x => KEYS.includes(x)))];
  return o.length ? o : ['same', 'day'];
};

// [dager før arrangementets dato, klokketime i Oslo]. Starttid hentes fra Notion hvis den finnes, ellers 19.
export const when = (e, k) => k === 'same' ? [0, Math.max(0, (Number((e.time || '').slice(0, 2)) || 19) - 3)]
  : k === 'day' ? [1, 12]
  : [(weekday(e.date) + 6) % 7, 12];
