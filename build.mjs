// src/posts/*.html (평문)을 스캔해 날짜 내림차순 목차를 만들어 루트 index.html에 쓴다.
// 목차(index.html)는 공개로 바로 보이고, 각 글(posts/*.html)만 암호화된다.
// 각 글의 제목은 <title>, 날짜는 <meta name="date" content="YYYY-MM-DD">에서 읽는다.
// (없으면 제목=파일명, 날짜=파일 수정시각으로 폴백)
import { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const POSTS_DIR = 'src/posts';
const OUT = 'index.html';

function pick(html, re, fallback) {
  const m = html.match(re);
  return m ? m[1].trim() : fallback;
}

mkdirSync(POSTS_DIR, { recursive: true });

const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith('.html'));
const posts = files.map((f) => {
  const html = readFileSync(join(POSTS_DIR, f), 'utf8');
  const title = pick(html, /<title>([^<]*)<\/title>/i, f.replace(/\.html$/, ''));
  let date = pick(html, /<meta\s+name=["']date["']\s+content=["']([^"']+)["']/i, null);
  if (!date) date = statSync(join(POSTS_DIR, f)).mtime.toISOString().slice(0, 10);
  return { file: f, title, date };
});

// 날짜 내림차순(최신 우선), 같은 날짜면 제목 오름차순
posts.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

const items = posts
  .map(
    (p) => `      <li>
        <a href="./posts/${p.file}">
          <time>${p.date}</time>
          <span class="t">${p.title}</span>
        </a>
      </li>`
  )
  .join('\n');

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>문서 목차</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0d1117; color: #e6edf3; }
    .wrap { max-width: 760px; margin: 0 auto; padding: 3rem 1.25rem 5rem; }
    h1 { font-size: 1.6rem; margin: 0 0 .25rem; }
    .sub { color: #8b949e; margin: 0 0 2rem; font-size: .9rem; }
    ul.toc { list-style: none; margin: 0; padding: 0; }
    ul.toc li { border-top: 1px solid #21262d; }
    ul.toc li:last-child { border-bottom: 1px solid #21262d; }
    ul.toc a { display: flex; align-items: baseline; gap: 1rem; padding: 1rem .25rem; text-decoration: none; color: inherit; transition: background .15s; }
    ul.toc a:hover { background: #161b22; }
    ul.toc time { flex: 0 0 6.5rem; color: #79c0ff; font-variant-numeric: tabular-nums; font-size: .85rem; }
    ul.toc .t { font-size: 1.05rem; }
    .empty { color: #8b949e; }
    footer { margin-top: 2.5rem; color: #6e7681; font-size: .8rem; }
  </style>
</head>
<body>
  <main class="wrap">
    <h1>🔒 문서 목차</h1>
    <p class="sub">최신순 · 총 ${posts.length}개 · 각 문서는 비밀번호로 보호됩니다</p>
    <ul class="toc">
${items || '      <li class="empty" style="padding:1rem .25rem">아직 글이 없습니다.</li>'}
    </ul>
    <footer>비밀번호를 한 번 입력하면 이 세션 동안 모든 문서가 열립니다.</footer>
  </main>
</body>
</html>
`;

writeFileSync(OUT, html);
console.log(`목차 생성 완료: ${posts.length}개 글 → ${OUT}`);
posts.forEach((p) => console.log(`  ${p.date}  ${p.title}  (posts/${p.file})`));
