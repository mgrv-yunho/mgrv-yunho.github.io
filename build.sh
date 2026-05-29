#!/usr/bin/env bash
#
# 목차를 다시 만들고, index와 모든 글을 비밀번호로 AES 암호화해 배포본을 생성합니다.
#
# 사용법:
#   STATICRYPT_PASSWORD='사이트비밀번호' ./build.sh
#   (STATICRYPT_PASSWORD 를 안 주면 실행 중 입력을 요청합니다.)
#
# 흐름:
#   1) src/posts/*.html (평문) 스캔 → ./index.html(목차) 생성  [build.mjs]
#      ※ 목차는 공개로 바로 보임 (암호화 안 함)
#   2) src/posts/*.html → ./posts/<같은이름>  (암호화) ← 각 글만 비번 보호
#   평문(src/)은 절대 커밋·배포되지 않습니다. 목차 + 암호화된 글만 배포됩니다.
#
set -euo pipefail

COMMON=(--short --remember 30
  --template-title "보호된 문서"
  --template-instructions "비밀번호를 입력하세요. 한 번 입력하면 모든 문서가 열립니다."
  --template-button "열기"
  --template-placeholder "비밀번호"
  --template-error "비밀번호가 올바르지 않습니다."
  --template-remember "이 기기에서 30일간 기억")

# 1) 목차 생성 (공개 index.html)
node build.mjs

# 2) 글 전부 암호화
shopt -s nullglob
posts=(src/posts/*.html)
if [ ${#posts[@]} -gt 0 ]; then
  npx -y staticrypt "${posts[@]}" -d posts "${COMMON[@]}"
fi

echo "✅ 빌드 완료 (글 ${#posts[@]}개). 배포: git add -A && git commit -m '...' && git push"
