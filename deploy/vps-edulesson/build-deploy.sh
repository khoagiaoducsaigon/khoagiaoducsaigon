#!/bin/bash
# Đóng gói bộ triển khai tự chứa: nhúng edulesson-copilot/index.html vào deploy-edulesson.sh
# Chạy lại mỗi khi index.html thay đổi:  bash deploy/vps-edulesson/build-deploy.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/../../edulesson-copilot/index.html"
OUT="$HERE/deploy-edulesson.sh"
SHA=$(sha256sum "$SRC" | cut -d' ' -f1)
SIZE=$(stat -c%s "$SRC")
{
  sed -e "s/@@SHA256@@/$SHA/" -e "s/@@SIZE@@/$SIZE/" "$HERE/deploy-template.sh"
  echo "__PAYLOAD_BELOW__"
  base64 -w 76 "$SRC"
} > "$OUT"
echo "Đã tạo $OUT ($(stat -c%s "$OUT") byte) – index.html $SIZE byte, sha256 $SHA"
