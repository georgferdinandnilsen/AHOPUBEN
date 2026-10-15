// Musikklenken fra Notion («Artist link APP») → avspiller. Ren funksjon så den kan testes (node test/music.test.mjs).
// Spotify og SoundCloud får sin offisielle innebygde avspiller. Andre lenker (YouTube, Bandcamp …) åpnes i ny fane.
export function parseMusic(raw) {
  let u; try { u = new URL(String(raw || '').trim()); } catch { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  const host = u.hostname.replace(/^www\./, '');
  if (host === 'open.spotify.com') {
    const m = u.pathname.match(/^\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/);
    if (!m) return null;
    return { provider: 'spotify', url: `https://open.spotify.com/${m[1]}/${m[2]}`, embed: `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=aho-puben&theme=0`, height: ['track', 'episode'].includes(m[1]) ? 80 : 152 };
  }
  if (host === 'soundcloud.com' || host === 'm.soundcloud.com') {
    const path = u.pathname.replace(/\/+$/, '');
    if (path.split('/').filter(Boolean).length < 1) return null;
    const clean = 'https://soundcloud.com' + path;
    return { provider: 'soundcloud', url: clean, embed: `https://w.soundcloud.com/player/?url=${encodeURIComponent(clean)}&color=%230000ff&auto_play=true&hide_related=true&show_comments=false&show_reposts=false&show_teaser=false&visual=false`, height: 166 };
  }
  return { provider: 'link', url: u.href, embed: '', height: 0 };
}
