// Kjør: node test/notion.test.mjs. Modellerer siden «test» i Arrangementer-databasen.
import assert from 'node:assert/strict';
import { fromNotion, pickBody } from '../src/notion.js';
const t = s => [{ plain_text: s }];
const page = (tags, date = '2026-10-29') => ({ id: '3f7fc4bc-274d-8050-8d75-caeb60aef7c9', properties: {
  Navn: { type: 'title', title: t('test') }, Opprettet: { type: 'created_time' }, Tagger: { type: 'multi_select', multi_select: tags.map(name => ({ name })) },
  'Ansvarlig for arrangement': { type: 'people', people: [] }, 'Når': { type: 'date', date: date && { start: date + 'T19:00:00.000+01:00' } }, Vakt: { type: 'relation' },
  'PUB': { type: 'number', number: 11 } } });
let e = fromNotion(page(['Aktivitet']));
assert.deepEqual(e, { id: '3f7fc4bc274d80508d75caeb60aef7c9', date: '2026-10-29', time: '19:00', title: 'test', type: 'Aktivitet', plain: false, image: '', desc: '', pub: 11, musicUrl: '' });
const withMusic = page(['DJ']); withMusic.properties['Artist link APP'] = { type: 'url', url: 'https://open.spotify.com/track/abc' };
assert.equal(fromNotion(withMusic).musicUrl, 'https://open.spotify.com/track/abc', 'musikklenke som lenke-felt');
const musicText = page(['DJ']); musicText.properties['Artist link APP'] = { type: 'rich_text', rich_text: [{ plain_text: 'hør her', href: 'https://soundcloud.com/x/y' }] };
assert.equal(fromNotion(musicText).musicUrl, 'https://soundcloud.com/x/y', 'musikklenke som tekst med lenke');
assert.equal(fromNotion(page(['Rolig Pub'])).plain, true, 'Rolig Pub = vanlig pub');
assert.equal(fromNotion(page(['Forslag???'])).type, '', 'forslag er ikke en type');
assert.equal(fromNotion(page(['Forslag???'])).date, '2026-10-29', 'forslag med dato vises, som i Kommende');
assert.equal(fromNotion(page([], null)).date, '', 'uten dato');
const blocks = [
  { type: 'paragraph', paragraph: { rich_text: t('Legg til bilde her (hvis ikke blir et generisk bilde valgt i appen)') } },
  { type: 'image', image: { type: 'file', file: { url: 'https://s3/x.png' } } },
  { type: 'paragraph', paragraph: { rich_text: t('skriv info her:') } },
  { type: 'callout', callout: { rich_text: t('dette er en test!') } },
  { type: 'divider', divider: {} },
];
assert.deepEqual(pickBody(blocks), { image: 'https://s3/x.png', desc: 'dette er en test!' });
assert.deepEqual(pickBody([blocks[0], blocks[2]]), { image: '', desc: '' }, 'uten bilde og info');
assert.deepEqual(pickBody([{ type: 'paragraph', paragraph: { rich_text: t('Bare tekst') } }]), { image: '', desc: 'Bare tekst' });
const renamedType = page(['Aktivitet']); renamedType.properties['Type arrangement'] = renamedType.properties.Tagger; delete renamedType.properties.Tagger;
assert.equal(fromNotion(renamedType).type, 'Aktivitet', 'typefeltet heter nå «Type arrangement»');
const urlImg = page(['DJ']); urlImg.properties['Bilde til APP'] = { type: 'url', url: 'https://x/u.png' };
assert.equal(fromNotion(urlImg).image, 'https://x/u.png', 'bilde som lenke-felt');
// Felter «Bilde til APP» / «Info til APP» og nye overskrifter på siden
const withProps = page(['DJ']); withProps.properties['Bilde til APP'] = { type: 'files', files: [{ file: { url: 'https://s3/p.png' } }] }; withProps.properties['Info til APP'] = { type: 'rich_text', rich_text: t('Info fra felt') };
e = fromNotion(withProps); assert.equal(e.image, 'https://s3/p.png'); assert.equal(e.desc, 'Info fra felt');
const renamed = [{ type: 'heading_3', heading_3: { rich_text: t('Bilde til APP') } }, { type: 'image', image: { type: 'external', external: { url: 'https://x/y.jpg' } } }, { type: 'heading_3', heading_3: { rich_text: t('Info til APP') } }, { type: 'paragraph', paragraph: { rich_text: t('Linje 1') } }, { type: 'bulleted_list_item', bulleted_list_item: { rich_text: t('Linje 2') } }];
assert.deepEqual(pickBody(renamed), { image: 'https://x/y.jpg', desc: 'Linje 1\n\nLinje 2' });
console.log('ok: notion-tolking');
