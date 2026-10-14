// Varselvalg og når de sendes. Egen fil så logikken kan testes (node test/notify.test.mjs).
// same = samme dag kl 16 (puben åpner 19). Starter arrangementet kl 19 eller tidligere, sendes det tre timer før start. day = dagen før kl 12.
export const KEYS = ['same', 'day'];

// Eldre lagrede valg var par som [0,16] og [1,12], og et valg «mon» som er fjernet. Ukjente verdier forkastes, tomt valg gir standard.
export const normOffsets = a => {
  const old = { '0,16': 'same', '1,12': 'day' };
  const o = [...new Set((Array.isArray(a) ? a : []).map(x => Array.isArray(x) ? old[x.join()] : x).filter(x => KEYS.includes(x)))];
  return o.length ? o : ['same', 'day'];
};

// [dager før arrangementets dato, klokketime i Oslo]. Starttid hentes fra Notion hvis den finnes, ellers 19.
export const when = (e, k) => k === 'same' ? [0, Math.min(16, Math.max(0, (Number((e.time || '').slice(0, 2)) || 19) - 3))] : [1, 12];
