# CLAUDE.md — 이 레포 작업 지침 (에이전트용)

이 레포는 **비밀번호로 보호되는 정적 문서 모음**을 GitHub Pages로 배포한다.
새 세션에서 이 파일을 읽으면 아래 절차대로 작업하면 된다.

## 핵심 사실
- 배포처: GitHub Pages, **public** 레포 `mgrv-yunho/mgrv-yunho.github.io`
- URL: https://mgrv-yunho.github.io/  (main 브랜치 / 루트)
- 무료 플랜이라 private 레포는 Pages 불가(422). 그래서 **레포는 public, 내용은 암호화**로 보호한다.
- `index.html` = **목차(최신순)** 이며 **공개**다(암호화 안 함). 접근하면 바로 글 목록이 보인다.
- **각 글(`posts/*.html`)만 StatiCrypt(AES)로 암호화**된다. 목차에서 글을 클릭하면 비밀번호를 묻는다.
- 사이트 전체가 **단일 비밀번호**. 한 번 입력하면 remember-me로 모든 글이 열린다.
  - 현재 데모 비번: `demo1234` (실제 비번은 `STATICRYPT_PASSWORD` 환경변수로 교체)

## 디렉토리 구조
```
src/posts/*.html   평문 원본            ← .gitignore (절대 커밋/배포 금지)
index.html         공개 목차 (build.mjs가 직접 생성, 암호화 안 함)  ← 배포됨
posts/*.html       암호화된 각 글         ← 배포됨
build.mjs          목차 생성기 → index.html 직접 출력 (날짜 내림차순)
build.sh           목차 생성(공개) + 글만 암호화
.staticrypt.json   salt (비번 아님 — 커밋 OK, 안 바꾸는 게 좋음)
```

## 글 메타데이터 규약
각 평문 글(`src/posts/*.html`)은 다음을 가진다 (build.mjs가 읽음):
- 제목: `<title>제목</title>`  (없으면 파일명)
- 날짜: `<meta name="date" content="YYYY-MM-DD" />`  (없으면 파일 수정시각)
파일명은 `YYYY-MM-DD-슬러그.html` (ASCII 슬러그) 권장 — URL 인코딩 문제 회피.

## 새 글 추가 절차 (사용자가 HTML을 주면 — 합의된 범위: "확인+배포까지")
1. 받은 HTML을 `src/posts/<YYYY-MM-DD-슬러그>.html` 로 저장.
   - `<title>` 과 `<meta name="date">` 가 있는지 확인, 없으면 추가.
   - 날짜를 모르면 사용자에게 묻거나 오늘 날짜 사용.
2. 빌드: `STATICRYPT_PASSWORD='<비번>' ./build.sh`
   - **비번을 모르면 채팅에 남기지 말고** 사용자에게 `!` 로 직접 실행을 요청:
     `! cd <repo> && STATICRYPT_PASSWORD='실제비번' ./build.sh`
3. 누출 검사: **암호화돼야 할 글**에 평문이 없는지 확인 (index.html은 공개 목차라 제외)
   `grep -RE "<글의 고유 평문 문자열>" posts/` → 결과 없어야 정상.
   (각 `posts/*.html` 에 `staticrypt` 마커가 있어야 암호화된 것.)
4. 커밋 & push (평문 `src/` 는 .gitignore로 자동 제외).
   - 커밋 전 `git status --short` 로 `src/` 가 안 올라가는지 반드시 확인.
5. 라이브 확인:
   - 목차: `curl -s https://mgrv-yunho.github.io/` → 글 제목이 평문으로 보이고 `staticrypt` 마커는 **없어야** 정상.
   - 글: `curl -s https://mgrv-yunho.github.io/posts/<파일>` → `staticrypt` 마커 **있어야** 정상, HTTP 200.
   - Pages 빌드 status API가 `building`으로 지연돼도 CDN엔 보통 먼저 반영됨.

## 비밀번호 변경
`STATICRYPT_PASSWORD='새비번' ./build.sh` 재실행 후 커밋·push. 전 문서가 새 비번으로 재암호화된다.

## 불변 규칙 (어기지 말 것)
- 평문(`src/`)을 **절대** 커밋/배포하지 않는다.
- `index.html` / `posts/*.html` 를 직접 손으로 수정하지 않는다 — 평문 소스 + build로만 생성한다.
- 목차 정렬(날짜 내림차순)은 build.mjs가 담당. 수동 정렬 금지.
- 실제 비밀번호를 코드/커밋 메시지/채팅/문서에 하드코딩하지 않는다 (데모 `demo1234` 제외).

## 진짜 비공개가 필요해지면
StatiCrypt는 강력하지만 public 레포라 암호문·비번 UI 자체는 누구나 받을 수 있다(브루트포스 표적).
완전한 접근 제어가 필요하면: GitHub Enterprise Cloud의 Pages 접근제어, 또는 Cloudflare Access / Netlify 비번보호로 이전.
