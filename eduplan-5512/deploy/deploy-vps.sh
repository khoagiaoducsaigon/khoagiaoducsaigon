#!/bin/bash
# Triển khai EduPlan 5512 CoPilot lên https://eduplan.thaykhoa-ai.tech
# Chạy TRÊN VPS sau khi đã scp index.html lên /tmp/eduplan.html:
#   sed -i 's/\r$//' /tmp/deploy-vps.sh && bash /tmp/deploy-vps.sh
# Nguyên tắc: chỉ THÊM; mọi file sửa đều sao lưu kèm ngày giờ; Caddy lỗi thì khôi phục và dừng.
set -euo pipefail

SLUG=eduplan
DOMAIN=$SLUG.thaykhoa-ai.tech
SRC=/tmp/eduplan.html
BASE=/opt/eduscience
PORTAL=$BASE/portal
BK=$BASE/deploy-backups
TS=$(date +%Y%m%d%H%M%S)
cd "$BASE"
mkdir -p "$BK"

echo "== 1. Kiểm tra file nguồn"
[ -s "$SRC" ] || { echo "Thiếu $SRC — hãy scp index.html lên trước."; exit 1; }
TITLE=$(grep -o '<title>[^<]*' "$SRC" | head -1 | sed 's/<title>//')
SIZE=$(stat -c %s "$SRC")
echo "Title: $TITLE · $SIZE bytes"

echo "== 2. Chép file vào $PORTAL/$SLUG"
mkdir -p "$PORTAL/$SLUG"
if [ -f "$PORTAL/$SLUG/index.html" ]; then mv "$PORTAL/$SLUG/index.html" "$PORTAL/$SLUG/index.html.bak-$TS"; fi
cp "$SRC" "$PORTAL/$SLUG/index.html"
chmod 644 "$PORTAL/$SLUG/index.html"

echo "== 3. Khối Caddy"
if grep -q "^$DOMAIN {" Caddyfile; then
  echo "Khối $DOMAIN đã có — giữ nguyên."
else
  cp Caddyfile "Caddyfile.bak-$SLUG-$TS"
  cat >> Caddyfile <<EOF

$DOMAIN {
    encode zstd gzip
    header Strict-Transport-Security max-age=15552000
    root * /srv/portal/$SLUG
    header Cache-Control no-cache
    file_server
}
EOF
  if ! docker compose exec -T proxy caddy validate --config /etc/caddy/Caddyfile; then
    cp "Caddyfile.bak-$SLUG-$TS" Caddyfile
    echo "!! caddy validate lỗi — đã khôi phục Caddyfile. Dừng."; exit 1
  fi
fi

echo "== 4. Cổng ứng dụng (apps.json + index.html)"
cp "$PORTAL/apps.json" "$BK/apps.json.bak-$SLUG-$TS"
cp "$PORTAL/index.html" "$BK/index.html.bak-$SLUG-$TS"
python3 - "$PORTAL" "$DOMAIN" <<'PY'
import json, re, sys
portal, domain = sys.argv[1], sys.argv[2]
url = f"https://{domain}/"
name = "EduPlan 5512 CoPilot"
desc = "AI rà soát, tối ưu kế hoạch bài dạy chuẩn CV 5512; duyệt 2 cấp, dashboard BGH"
# apps.json
p = f"{portal}/apps.json"
data = json.load(open(p, encoding="utf-8"))
items = data if isinstance(data, list) else data.get("apps", [])
if not any(a.get("url", "").rstrip("/") == url.rstrip("/") for a in items):
    near = next((a for a in items if re.search(r"khkt|homeroom|thuvien", a.get("url", ""))), items[0] if items else {})
    items.append({"name": name, "description": desc, "url": url, "icon": near.get("icon", "")})
    json.dump(data, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("apps.json: đã thêm")
else:
    print("apps.json: đã có")
# index.html
p = f"{portal}/index.html"
html = open(p, encoding="utf-8").read()
if url in html:
    print("index.html: đã có")
else:
    cards = re.findall(r'<a class="app-link"[^>]*href="([^"]*)".*?</a>', html, flags=re.S)
    icons = re.findall(r'<a class="app-link"[^>]*href="([^"]*)"[^>]*>\s*<span class="app-icon"[^>]*>(.*?)</span>\s*<span class="app-text">', html, flags=re.S)
    svg = next((s for h, s in icons if re.search(r"khkt|homeroom", h)), icons[0][1] if icons else "")
    card = (f'<a class="app-link" href="{url}"><span class="app-icon" aria-hidden="true">{svg}</span>'
            f'<span class="app-text"><strong>{name}</strong><span>{desc}</span><small>{domain}</small></span>'
            f'<span class="arrow" aria-hidden="true">↗</span></a>\n')
    i = html.find("</nav>")
    if i < 0: sys.exit("index.html: không thấy </nav>")
    open(p, "w", encoding="utf-8").write(html[:i] + card + html[i:])
    print("index.html: đã chèn thẻ trước </nav>")
PY

echo "== 5. Reload Caddy"
docker compose exec -T proxy caddy reload --config /etc/caddy/Caddyfile

echo "== 6. DNS & chứng chỉ"
if (nslookup "$DOMAIN" 8.8.8.8 2>/dev/null || getent hosts "$DOMAIN") | grep -q "72.62.72.204"; then
  echo "DNS đã trỏ về VPS → restart proxy để xin chứng chỉ ngay"
  docker compose restart proxy
  for i in $(seq 1 30); do
    if docker compose exec -T proxy ls /data/caddy/certificates/acme-v02.api.letsencrypt.org-directory/ 2>/dev/null | grep -q "^$DOMAIN$"; then echo "Chứng chỉ Let's Encrypt: OK"; break; fi
    sleep 10
  done
else
  echo "!! Chưa có bản ghi A '$SLUG' → 72.62.72.204 trên hPanel. Thêm xong hãy chạy lại script này."; exit 2
fi

echo "== 7. Kiểm tra thật bằng curl"
for U in "https://$DOMAIN/" "https://thaykhoa-ai.tech/"; do
  R=$(curl -s -o /tmp/live.html -w '%{http_code} %{size_download} tls=%{ssl_verify_result}' "$U")
  echo "$U -> $R | $(grep -o '<title>[^<]*' /tmp/live.html | head -1)"
done
if grep -q "$DOMAIN" /tmp/live.html; then echo "Trang chủ có liên kết tới $DOMAIN: OK"; else echo "!! Trang chủ chưa có liên kết"; fi
echo "Mong đợi: 200, $SIZE bytes, tls=0, title '$TITLE'"
