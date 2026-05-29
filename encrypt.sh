#!/usr/bin/env bash
#
# 평문 HTML을 StatiCrypt(AES)로 암호화해 배포용 파일을 생성합니다.
#
# 사용법:
#   STATICRYPT_PASSWORD='원하는비밀번호' ./encrypt.sh src/secret.html
#   (STATICRYPT_PASSWORD 를 안 주면 실행 중 비밀번호 입력을 요청합니다.)
#
# 규칙:
#   - 평문 원본은 src/ 에 둡니다 (.gitignore 처리 → 커밋/배포 안 됨).
#   - 결과물은 레포 루트에 <원본파일명> 으로 생성되며, 이 암호화 파일만 커밋·배포합니다.
#
set -euo pipefail

SRC="${1:?사용법: [STATICRYPT_PASSWORD=...] ./encrypt.sh src/파일.html}"

npx -y staticrypt "$SRC" --short -d . \
  --template-title "보호된 문서" \
  --template-instructions "이 문서를 보려면 비밀번호를 입력하세요." \
  --template-button "열기" \
  --template-placeholder "비밀번호" \
  --template-error "비밀번호가 올바르지 않습니다." \
  --template-remember "이 기기에서 기억하기" \
  --remember 7

OUT="$(basename "$SRC")"
echo "✅ 암호화 완료: ./$OUT"
echo "   git add $OUT && git commit -m 'add protected doc' && git push"
echo "   → https://mgrv-yunho.github.io/$OUT"
