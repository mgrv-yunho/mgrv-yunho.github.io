# mgrv-yunho.github.io

비밀번호로 보호되는 정적 문서 모음을 GitHub Pages로 배포하는 사이트입니다.

- 사이트: https://mgrv-yunho.github.io/
- 메인(`index.html`)은 글 **목차를 최신순(날짜 내림차순)** 으로 보여줍니다. **목차는 공개**라 접근하면 바로 보입니다.
- **각 문서는 StatiCrypt로 AES 암호화** 되어, 비밀번호 없이는 내용을 볼 수 없습니다. (목차에서 글을 클릭하면 비번을 묻습니다.)
- 사이트 전체가 **단일 비밀번호**입니다. 한 번 입력하면 그 세션 동안 모든 문서가 열립니다.
  - 데모 비번: `demo1234` (실제 비번은 아래처럼 교체)

> ⚠️ 무료 플랜은 private 레포에서 Pages 게시가 안 됩니다. 그래서 레포는 public이고,
> 대신 내용을 암호화해 보호합니다. (진짜 접근 제어가 필요하면 Enterprise Pages / Cloudflare Access 등)

## 디렉토리

| 경로 | 설명 | 배포 |
|---|---|---|
| `src/posts/*.html` | 평문 원본 (여기에 글 작성) | ❌ (`.gitignore`) |
| `index.html` | 공개 목차 (build.mjs가 생성) | ✅ |
| `posts/*.html` | 암호화된 각 글 | ✅ |
| `build.mjs` | 목차 생성기 (날짜 내림차순) → `index.html` | — |
| `build.sh` | 목차 생성(공개) + 글 암호화 | — |

## 새 글 추가하기

1. `src/posts/` 에 HTML을 추가합니다. 파일명은 `YYYY-MM-DD-슬러그.html` 권장.
   각 파일에 제목과 날짜를 넣으세요:
   ```html
   <title>글 제목</title>
   <meta name="date" content="2026-05-29" />
   ```
   (제목이 없으면 파일명, 날짜가 없으면 파일 수정시각이 쓰입니다.)

2. 빌드 — 목차를 다시 만들고 전부 암호화합니다:
   ```bash
   STATICRYPT_PASSWORD='사이트비밀번호' ./build.sh
   ```

3. 배포:
   ```bash
   git add -A
   git commit -m "add post"
   git push
   ```
   push하면 GitHub Pages가 자동 재배포합니다. (평문 `src/`는 커밋되지 않습니다.)

## 비밀번호 변경

```bash
STATICRYPT_PASSWORD='새비밀번호' ./build.sh
git add -A && git commit -m "rotate password" && git push
```
모든 문서가 새 비밀번호로 다시 암호화됩니다.

## 요구사항

- Node.js (목차 생성)
- `npx staticrypt` (자동 설치됨)

---

에이전트(Claude)용 상세 작업 지침은 [`CLAUDE.md`](./CLAUDE.md) 참고.
