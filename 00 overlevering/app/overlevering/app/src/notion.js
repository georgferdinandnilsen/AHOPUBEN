// Rene funksjoner som tolker Notion-svar. Egen fil så de kan testes uten Worker (node test/notion.test.mjs).
const rt = a => (a || []).map(x => x.plain_text).join('');

// Én rad i databasen → et arrangement. Feltene finnes på type og navn: «Når» (dato), «Tagger» (type), tittel.
// Bilde og info hentes fra feltene «Bilde til APP» og «Info til APP» hvis de finnes, ellers fra sideinnholdet (se pickBody).
// Hvilke rader som vises avgjøres av Worker-en: samme regel som visningen «Kommende» (Når fra i dag og utover).
export function fromNotion(p) {
  const P = Object.entries(p.properties);
  const tagProp = P.find(([n, v]) => /tag|type/i.test(n) && ['multi_select', 'select', 'status'].includes(v.type))?.[1]; // «Tagger», nå «Type arrangement»
  const tags = !tagProp ? [] : tagProp.type === 'multi_select' ? tagProp.multi_select.map(o => o.name) : [tagProp[tagProp.type]?.name].filter(Boolean);
  const pubProp = P.find(([n, v]) => /^pub/i.test(n) && (v.type === 'number' || (v.type === 'formula' && v.formula?.type === 'number')))?.[1];
  const dateProp = P.find(([n, v]) => v.type === 'date' && /når|dato|date|tid/i.test(n))?.[1] || P.find(([, v]) => v.type === 'date')?.[1];
  const imgProp = P.find(([n, v]) => ['files', 'url'].includes(v.type) && /bilde|image/i.test(n))?.[1];
  const file = imgProp?.type === 'url' ? { external: { url: imgProp.url } } : imgProp?.files?.[0];
  const info = P.find(([n, v]) => v.type === 'rich_text' && /info|beskriv/i.test(n))?.[1];
  return {
    id: p.id.replace(/-/g, ''),
    date: dateProp?.date?.start?.slice(0, 10) || '',
    time: (dateProp?.date?.start || '').length > 10 ? dateProp.date.start.slice(11, 16) : '', // starttid hvis styret har satt klokkeslett i «Når»
    title: rt(P.find(([, v]) => v.type === 'title')?.[1].title).trim(),
    type: tags.find(t => !/^forslag/i.test(t)) || '',
    plain: tags.some(t => /^rolig/i.test(t)), // «Rolig Pub»-rader er vanlig pub, ikke et program
    image: file?.file?.url || file?.external?.url || '',
    desc: rt(info?.rich_text).trim(),
    pub: (pubProp && (pubProp.type === 'number' ? pubProp.number : pubProp.formula.number)) ?? null,
  };
}

// Innholdet på siden: første bilde = bildet, teksten etter «Info til APP» (tidligere «skriv info her») = infoen.
// Instruksjonslinjene («Bilde til APP», «Legg til bilde her…») hoppes over.
export function pickBody(blocks) {
  let image = '', out = [];
  for (const b of blocks) {
    if (b.type === 'image') { image ||= b.image.file?.url || b.image.external?.url || ''; continue; }
    const t = rt(b[b.type]?.rich_text).trim();
    if (!t) continue;
    if (/^(skriv info|info til app)/i.test(t)) { out = []; continue; }
    if (/^(legg til bilde|bilde til app)/i.test(t)) continue;
    out.push(t);
  }
  return { image, desc: out.join('\n\n') };
}
