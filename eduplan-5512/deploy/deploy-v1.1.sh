#!/bin/bash
# Triển khai EduPlan KHBD AI v1.1 theo kiểu xanh–lục (mục 10 master prompt v1.1). Chạy TRÊN VPS.
#   bash deploy-v1.1.sh stage            # dựng bản mới ở thư mục riêng + sao lưu (an toàn, chưa đổi gì đang chạy)
#   bash deploy-v1.1.sh switch --confirm # ĐIỂM DỪNG mục 11: chỉ chạy khi TS. Khoa đã duyệt — đổi sang bản mới, bật eduplan-old + khbd
#   bash deploy-v1.1.sh rollback         # quay lui 1 lệnh về bản cũ
#   bash deploy-v1.1.sh verify           # curl kiểm tra
#   bash deploy-v1.1.sh retire --confirm # ĐIỂM DỪNG: tắt eduplan-old (sau 14 ngày)
# Yêu cầu: /tmp/eduplan-v11.tar.gz (nội dung thư mục app/) đã scp lên; biến EDUPLAN_OLD_PASS cho switch.
# Vì sao symlink: dữ liệu người dùng nằm trong IndexedDB theo ORIGIN → bản mới PHẢI phục vụ đúng eduplan.thaykhoa-ai.tech;
# portal/eduplan là symlink tương đối trỏ tới thư mục phiên bản → đổi/quay lui tức thì, khối Caddy cũ không cần sửa.
set -euo pipefail
BASE=/opt/eduscience; PORTAL=$BASE/portal; TS=$(date +%Y%m%d%H%M%S); IP=72.62.72.204
BK=/opt/backups/eduplan-$TS; STATE=$PORTAL/.eduplan-deploy
cd "$BASE"; mkdir -p "$STATE"
caddy_ok() { docker compose exec -T proxy caddy validate --config /etc/caddy/Caddyfile >/dev/null; }
reload() { docker compose exec -T proxy caddy reload --config /etc/caddy/Caddyfile; }

case "${1:-}" in
stage)
  [ -s /tmp/eduplan-v11.tar.gz ] || { echo "Thiếu /tmp/eduplan-v11.tar.gz"; exit 1; }
  mkdir -p "$BK"; cp -a Caddyfile "$BK/"; cp -a "$PORTAL/index.html" "$PORTAL/apps.json" "$BK/"
  [ -e "$PORTAL/eduplan" ] && cp -aL "$PORTAL/eduplan" "$BK/eduplan-dang-chay"
  echo "Sao lưu: $BK"
  # Lần đầu: thư mục thật portal/eduplan (v1) → đổi thành portal/eduplan-v1 + symlink (cùng nội dung, chưa đổi bản)
  if [ -d "$PORTAL/eduplan" ] && [ ! -L "$PORTAL/eduplan" ]; then
    mv "$PORTAL/eduplan" "$PORTAL/eduplan-v1"; ln -sfn eduplan-v1 "$PORTAL/eduplan"; echo "portal/eduplan → eduplan-v1 (symlink, nội dung không đổi)"
  fi
  NEW=eduplan-v11-$TS; mkdir -p "$PORTAL/$NEW"; tar -xzf /tmp/eduplan-v11.tar.gz -C "$PORTAL/$NEW"
  grep -q "<title>EduPlan KHBD AI</title>" "$PORTAL/$NEW/index.html" || { echo "Gói không đúng (thiếu title)"; exit 1; }
  echo "$NEW" > "$STATE/staged"; echo "Đã dựng $NEW (chưa phục vụ). Bước tiếp: duyệt → switch --confirm" ;;

switch)
  [ "${2:-}" = "--confirm" ] || { echo "ĐIỂM DỪNG (mục 11): cần TS. Khoa duyệt. Chạy lại với --confirm."; exit 2; }
  NEW=$(cat "$STATE/staged"); OLD=$(readlink "$PORTAL/eduplan"); : "${EDUPLAN_OLD_PASS:?Đặt EDUPLAN_OLD_PASS cho tài khoản admin của eduplan-old}"
  mkdir -p "$BK"; cp -a Caddyfile "$BK/Caddyfile.truoc-switch"; cp -a "$PORTAL/index.html" "$PORTAL/apps.json" "$BK/"
  HASH=$(docker compose exec -T proxy caddy hash-password --plaintext "$EDUPLAN_OLD_PASS" | tr -d '\r')
  grep -q "^eduplan-old.thaykhoa-ai.tech {" Caddyfile || cat >> Caddyfile <<EOF

eduplan-old.thaykhoa-ai.tech {
    encode zstd gzip
    header Strict-Transport-Security max-age=15552000
    basicauth {
        admin $HASH
    }
    root * /srv/portal/eduplan-old
    header Cache-Control no-cache
    file_server
}
EOF
  grep -q "^khbd.thaykhoa-ai.tech {" Caddyfile || cat >> Caddyfile <<'EOF'

khbd.thaykhoa-ai.tech {
    redir https://eduplan.thaykhoa-ai.tech{uri} permanent
}
EOF
  if ! caddy_ok; then cp "$BK/Caddyfile.truoc-switch" Caddyfile; echo "!! caddy validate lỗi — đã khôi phục"; exit 1; fi
  ln -sfn "$OLD" "$PORTAL/eduplan-old"; ln -sfn "$NEW" "$PORTAL/eduplan"; echo "$OLD" > "$STATE/previous"; date -d '+14 days' +%F > "$STATE/retire_after"
  # Trang chủ: SỬA thẻ eduplan sẵn có (không thêm thẻ mới)
  python3 - "$PORTAL" <<'PY'
import json, re, sys
p = sys.argv[1]; url = "https://eduplan.thaykhoa-ai.tech/"
name = "EduPlan KHBD AI"
desc = "Soạn trọn bộ KHBD 5 bước theo CV 5512, CV 2345 · Tích hợp năng lực số, AI đúng TT 02/2025, QĐ 2422 · Rà soát, duyệt 2 cấp tổ – BGH, dashboard theo dõi"
d = json.load(open(f"{p}/apps.json", encoding="utf-8")); items = d if isinstance(d, list) else d.get("apps", [])
hit = [a for a in items if a.get("url", "").rstrip("/") == url.rstrip("/")]
if not hit: sys.exit("apps.json: không thấy thẻ eduplan để sửa")
hit[0].update(name=name, description=desc)
json.dump(d, open(f"{p}/apps.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
h = open(f"{p}/index.html", encoding="utf-8").read()
m = re.search(r'(<a class="app-link" href="' + re.escape(url) + r'">.*?<strong>)(.*?)(</strong><span>)(.*?)(</span>)', h, re.S)
if not m: sys.exit("index.html: không thấy thẻ eduplan để sửa")
h = h[:m.start()] + m.group(1) + name + m.group(3) + desc + m.group(5) + h[m.end():]
open(f"{p}/index.html", "w", encoding="utf-8").write(h); print("Đã sửa thẻ eduplan trên trang chủ (apps.json + index.html)")
PY
  reload; echo "Đã đổi sang $NEW. Bản cũ: eduplan-old (admin). Tắt bản cũ sau $(cat "$STATE/retire_after")."
  echo "Cần bản ghi A trên hPanel: eduplan-old và khbd → $IP (rồi docker compose restart proxy)." ;;

rollback)
  PREV=$(cat "$STATE/previous"); ln -sfn "$PREV" "$PORTAL/eduplan"; echo "Đã quay lui: portal/eduplan → $PREV" ;;

verify)
  for U in https://eduplan.thaykhoa-ai.tech/ https://eduplan.thaykhoa-ai.tech/data/plv.json https://eduplan.thaykhoa-ai.tech/js/app.js https://thaykhoa-ai.tech/; do
    echo "$U -> $(curl -s -o /tmp/v.out -w '%{http_code} %{size_download} tls=%{ssl_verify_result}' "$U") $(grep -o '<title>[^<]*' /tmp/v.out | head -1)"
  done
  echo "khbd 301 giữ đường dẫn: $(curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}' https://khbd.thaykhoa-ai.tech/bai/abc/1)"
  echo "eduplan-old không mật khẩu (mong đợi 401): $(curl -s -o /dev/null -w '%{http_code}' https://eduplan-old.thaykhoa-ai.tech/)" ;;

retire)
  [ "${2:-}" = "--confirm" ] || { echo "ĐIỂM DỪNG (mục 11): cần duyệt trước khi tắt eduplan-old."; exit 2; }
  [ "$(date +%F)" \> "$(cat "$STATE/retire_after")" ] || { echo "Chưa đủ 14 ngày (đến $(cat "$STATE/retire_after"))."; exit 2; }
  cp -a Caddyfile "/opt/backups/Caddyfile.truoc-retire-$TS"
  python3 - <<'PY'
import re; p = "/opt/eduscience/Caddyfile"; s = open(p, encoding="utf-8").read()
s = re.sub(r"\neduplan-old\.thaykhoa-ai\.tech \{.*?\n\}\n", "\n", s, flags=re.S); open(p, "w", encoding="utf-8").write(s)
PY
  caddy_ok || { cp "/opt/backups/Caddyfile.truoc-retire-$TS" Caddyfile; echo "!! lỗi — đã khôi phục"; exit 1; }
  reload; echo "Đã tắt eduplan-old (thư mục bản cũ vẫn giữ trên đĩa, không xóa)." ;;
*) sed -n '2,9p' "$0"; exit 1 ;;
esac
