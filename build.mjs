// src/posts/*.html (평문)을 스캔해 날짜 내림차순 목차를 만들어 루트 index.html에 쓴다.
// 목차(index.html)는 공개로 바로 보이고, 각 글(posts/*.html)만 암호화된다.
// 각 글의 제목은 <title>, 날짜·시간은 <meta name="date" content="YYYY-MM-DD HH:MM">에서 읽는다.
//   - 시간은 선택: "YYYY-MM-DD" / "YYYY-MM-DD HH:MM" / "YYYY-MM-DDTHH:MM" 모두 허용.
//   - 시간이 있으면 목차에 날짜 밑에 함께 표시된다.
// (date 메타가 없으면 제목=파일명, 날짜+시각=파일 수정시각으로 폴백)
import { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const POSTS_DIR = 'src/posts';
const OUT = 'index.html';

function pick(html, re, fallback) {
  const m = html.match(re);
  return m ? m[1].trim() : fallback;
}

// HTML 특수문자 이스케이프 (제목에 <, &, " 등이 들어가도 안전)
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

mkdirSync(POSTS_DIR, { recursive: true });

const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith('.html'));
const posts = files.map((f) => {
  const html = readFileSync(join(POSTS_DIR, f), 'utf8');
  const title = pick(html, /<title>([^<]*)<\/title>/i, f.replace(/\.html$/, ''));
  const raw = pick(html, /<meta\s+name=["']date["']\s+content=["']([^"']+)["']/i, null);
  let date, time;
  if (raw) {
    // "YYYY-MM-DD" / "YYYY-MM-DD HH:MM" / "YYYY-MM-DDTHH:MM" 모두 수용
    const m = raw.match(/(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?/);
    date = m ? m[1] : raw.slice(0, 10);
    time = m && m[2] ? m[2] : null;
  } else {
    // date 메타가 없으면 파일 수정시각(날짜+시:분)으로 폴백
    const mt = statSync(join(POSTS_DIR, f)).mtime;
    const iso = new Date(mt.getTime() - mt.getTimezoneOffset() * 60000).toISOString();
    date = iso.slice(0, 10);
    time = iso.slice(11, 16);
  }
  return { file: f, title, date, time };
});

// 날짜+시간 내림차순(최신 우선), 같으면 제목 오름차순
posts.sort(
  (a, b) =>
    `${b.date} ${b.time ?? '00:00'}`.localeCompare(`${a.date} ${a.time ?? '00:00'}`) ||
    a.title.localeCompare(b.title)
);

// 연도별로 묶어 타임라인처럼 보여준다 (연도 내림차순)
const byYear = new Map();
for (const p of posts) {
  const y = p.date.slice(0, 4);
  if (!byYear.has(y)) byYear.set(y, []);
  byYear.get(y).push(p);
}
const years = [...byYear.keys()].sort((a, b) => b.localeCompare(a));

const MONTHS = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
function fmtDay(date) {
  const [, mm, dd] = date.split('-');
  return `${MONTHS[Number(mm)]} ${Number(dd)}일`;
}

const sections = years
  .map((y) => {
    const rows = byYear
      .get(y)
      .map((p) => {
        const dt = p.time ? `${p.date}T${p.time}` : p.date;
        const timeEl = p.time ? `<span class="t">${p.time}</span>` : '';
        return `        <li class="row">
          <a href="./posts/${p.file}">
            <span class="dot" aria-hidden="true"></span>
            <time datetime="${dt}" class="date"><span class="d">${fmtDay(p.date)}</span>${timeEl}</time>
            <span class="title">${esc(p.title)}</span>
            <span class="lock" aria-hidden="true">🔒</span>
            <span class="chev" aria-hidden="true">→</span>
          </a>
        </li>`;
      })
      .join('\n');
    return `      <section class="year">
        <h2 class="year-label"><span>${y}</span></h2>
        <ul class="toc">
${rows}
        </ul>
      </section>`;
  })
  .join('\n');

const empty = `      <p class="empty">아직 글이 없습니다.</p>`;
const latest = posts[0]?.date ?? '—';

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <title>문서 목차</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0a0e14;
      --surface: #11161f;
      --surface-2: #161c27;
      --border: #1f2733;
      --border-hi: #2d3a4d;
      --text: #e6edf3;
      --muted: #8b97a7;
      --faint: #5c6b7e;
      --accent: #79c0ff;
      --accent-2: #a98eff;
      --ring: rgba(121, 192, 255, .35);
    }
    * { box-sizing: border-box; }
    html { -webkit-text-size-adjust: 100%; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Apple SD Gothic Neo", Pretendard, Roboto, sans-serif;
      color: var(--text);
      background:
        radial-gradient(900px 480px at 50% -8%, rgba(121,192,255,.12), transparent 60%),
        radial-gradient(700px 420px at 100% 0%, rgba(169,142,255,.10), transparent 55%),
        var(--bg);
      background-attachment: fixed;
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
    }
    .wrap { max-width: 720px; margin: 0 auto; padding: clamp(2.5rem, 6vw, 4.5rem) 1.25rem 5rem; }

    /* ── 헤더 ── */
    header { margin-bottom: 2.75rem; }
    .badge {
      display: inline-flex; align-items: center; gap: .4rem;
      font-size: .72rem; font-weight: 600; letter-spacing: .08em;
      color: var(--accent); text-transform: uppercase;
      padding: .35rem .7rem; border-radius: 999px;
      background: rgba(121,192,255,.08);
      border: 1px solid rgba(121,192,255,.22);
    }
    h1 {
      font-size: clamp(1.9rem, 5vw, 2.5rem); line-height: 1.1;
      margin: 1rem 0 .5rem; letter-spacing: -.02em; font-weight: 700;
      background: linear-gradient(100deg, #fff 10%, var(--accent) 60%, var(--accent-2));
      -webkit-background-clip: text; background-clip: text; color: transparent;
    }
    .sub { color: var(--muted); margin: 0; font-size: .95rem; }
    .stats { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: 1.25rem; }
    .stat {
      display: inline-flex; align-items: baseline; gap: .4rem;
      font-size: .82rem; color: var(--muted);
      padding: .4rem .75rem; border-radius: 10px;
      background: var(--surface); border: 1px solid var(--border);
    }
    .stat b { color: var(--text); font-variant-numeric: tabular-nums; font-weight: 600; }

    /* ── 연도 타임라인 ── */
    .year { position: relative; margin-bottom: 1.5rem; padding-left: 1.5rem; }
    .year::before {
      content: ""; position: absolute; left: 4px; top: .9rem; bottom: .2rem;
      width: 2px; background: linear-gradient(var(--border-hi), transparent);
    }
    .year-label {
      font-size: .8rem; font-weight: 700; letter-spacing: .06em;
      color: var(--faint); margin: 0 0 .6rem; position: relative;
      font-variant-numeric: tabular-nums;
    }
    .year-label span {
      position: relative; padding-left: .2rem;
    }
    .year-label::before {
      content: ""; position: absolute; left: -1.5rem; top: 50%; transform: translateY(-50%);
      width: 11px; height: 11px; border-radius: 50%;
      background: var(--bg); border: 2px solid var(--accent);
      box-shadow: 0 0 0 4px rgba(121,192,255,.10);
    }

    ul.toc { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .5rem; }
    .row a {
      display: grid;
      grid-template-columns: auto 6.5rem 1fr auto auto;
      align-items: center; gap: .85rem;
      padding: .8rem 1rem; border-radius: 12px;
      text-decoration: none; color: inherit;
      background: var(--surface);
      border: 1px solid var(--border);
      transition: transform .16s ease, border-color .16s ease, background .16s ease, box-shadow .16s ease;
    }
    .row a:hover, .row a:focus-visible {
      background: var(--surface-2);
      border-color: var(--border-hi);
      transform: translateX(3px);
      box-shadow: -3px 0 0 0 var(--accent), 0 6px 20px -8px rgba(0,0,0,.6);
      outline: none;
    }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); opacity: .55; transition: opacity .16s, box-shadow .16s; }
    .row a:hover .dot { opacity: 1; box-shadow: 0 0 0 4px rgba(121,192,255,.15); }
    .date { display: flex; flex-direction: column; line-height: 1.25; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .date .d { color: var(--accent); font-size: .8rem; }
    .date .t { color: var(--faint); font-size: .72rem; letter-spacing: .02em; }
    .title { font-size: 1.02rem; font-weight: 500; color: var(--text); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .lock { font-size: .8rem; opacity: .4; filter: grayscale(.3); }
    .chev { color: var(--faint); font-size: 1rem; transform: translateX(-2px); opacity: 0; transition: opacity .16s, transform .16s, color .16s; }
    .row a:hover .chev { opacity: 1; transform: translateX(0); color: var(--accent); }

    .empty { color: var(--muted); padding: 2rem 1rem; text-align: center; border: 1px dashed var(--border); border-radius: 12px; }

    footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--border); color: var(--faint); font-size: .8rem; display: flex; align-items: center; gap: .5rem; }
    footer .key { color: var(--muted); }

    @media (max-width: 520px) {
      .row a { grid-template-columns: auto 1fr auto; row-gap: .2rem; }
      .date { grid-column: 2; flex-direction: row; gap: .45rem; align-items: baseline; }
      .date .t { font-size: .74rem; }
      .title { grid-column: 2; white-space: normal; }
      .chev { display: none; }
    }
    @media (prefers-reduced-motion: reduce) {
      * { transition: none !important; }
    }
  </style>
</head>
<body>
  <main class="wrap">
    <header>
      <span class="badge">🔒 Protected</span>
      <h1>문서 목차</h1>
      <p class="sub">비밀번호로 보호되는 문서 모음 · 최신순</p>
      <div class="stats">
        <span class="stat">문서 <b>${posts.length}</b></span>
        <span class="stat">최신 <b>${latest}</b></span>
      </div>
    </header>

${sections || empty}

    <footer>
      <span class="key">🔑</span>
      <span>비밀번호를 한 번 입력하면 이 세션 동안 모든 문서가 열립니다.</span>
    </footer>
  </main>
</body>
</html>
`;

writeFileSync(OUT, html);
console.log(`목차 생성 완료: ${posts.length}개 글 → ${OUT}`);
posts.forEach((p) => console.log(`  ${p.date}  ${p.title}  (posts/${p.file})`));
