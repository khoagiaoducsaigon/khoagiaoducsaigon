#!/bin/bash
# =====================================================================
#  Triển khai EduLesson Study CoPilot lên VPS thaykhoa-ai.tech
#  -> https://edulesson.thaykhoa-ai.tech
#  Chạy trên VPS (root). An toàn khi chạy lại nhiều lần.
#  Nguyên tắc: chỉ THÊM; mọi tệp bị sửa đều được sao lưu kèm ngày giờ;
#  không đụng khối Caddy, thư mục portal hay container nào khác ngoài "proxy".
# =====================================================================
set -uo pipefail
SELF="$(readlink -f "$0")"

SLUG="${SLUG:-edulesson}"
DOMAIN="$SLUG.thaykhoa-ai.tech"
VPS_IP="${VPS_IP:-72.62.72.204}"
ROOT="${ROOT:-/opt/eduscience}"
PORTAL="$ROOT/portal"
DIR="$PORTAL/$SLUG"
BK="$PORTAL/deploy-backups"
TS=$(date +%Y%m%d%H%M%S)
EXPECT_SHA="@@SHA256@@"
EXPECT_SIZE="@@SIZE@@"
DNS_WAIT_MIN="${DNS_WAIT_MIN:-20}"
CERT_WAIT_MIN="${CERT_WAIT_MIN:-5}"
TMP="$(mktemp -d)"
BACKUPS=()

step() { echo; echo "=== $* ==="; }
ok()   { echo "  ✓ $*"; }
die()  { echo; echo "  ✗ DỪNG: $*"; echo; exit 1; }
backup() { local f="$1" dst="$2"; cp -p "$f" "$dst" && BACKUPS+=("$dst") && ok "Sao lưu $f → $dst"; }

resolve() { # IP mà Google DNS trả về cho $1 (rỗng nếu chưa có)
  if command -v dig >/dev/null 2>&1; then dig +short A "$1" @8.8.8.8 | grep -E '^[0-9.]+$' | head -1
  elif command -v nslookup >/dev/null 2>&1; then nslookup "$1" 8.8.8.8 2>/dev/null | awk '/^Name:/{f=1} f&&/^Address:/{print $2; exit}'
  else getent ahostsv4 "$1" 2>/dev/null | awk '{print $1; exit}'; fi
}
dc() { (cd "$ROOT" && docker compose "$@"); }

cd "$ROOT" 2>/dev/null || die "Không thấy thư mục dự án $ROOT"

# ---------------------------------------------------------------- 1. Chuẩn bị
step "1/6 Chuẩn bị tệp ứng dụng"
sed -n '/^__PAYLOAD_BELOW__$/,$p' "$SELF" | tail -n +2 | base64 -d > "$TMP/index.html" 2>/dev/null || die "Không giải nén được ứng dụng nhúng trong script"
GOT_SHA=$(sha256sum "$TMP/index.html" | cut -d' ' -f1)
[ "$GOT_SHA" = "$EXPECT_SHA" ] || die "Tệp ứng dụng bị hỏng khi truyền (sha256 không khớp). Hãy tải lại bộ triển khai."
TITLE=$(grep -o '<title>[^<]*' "$TMP/index.html" | head -1 | sed 's/<title>//')
ok "index.html: $EXPECT_SIZE byte, sha256 khớp, title: \"$TITLE\""

CUR_IP=$(resolve "$DOMAIN")
if [ -n "$CUR_IP" ] && [ "$CUR_IP" != "$VPS_IP" ]; then
  die "$DOMAIN đang trỏ sang IP khác ($CUR_IP), không phải VPS ($VPS_IP). Có thể đó là dịch vụ khác của anh/chị – không sửa."
fi
[ -n "$CUR_IP" ] && ok "DNS đã có: $DOMAIN → $CUR_IP" || ok "DNS chưa có bản ghi cho $DOMAIN (sẽ hướng dẫn thêm ở bước 4)"

# ---------------------------------------------------------------- 2. Chép tệp
step "2/6 Chép ứng dụng vào $DIR"
mkdir -p "$DIR" "$BK"
if [ -f "$DIR/index.html" ]; then
  if cmp -s "$DIR/index.html" "$TMP/index.html"; then ok "Tệp trên VPS đã là bản mới nhất"
  else mv "$DIR/index.html" "$DIR/index.html.bak-$TS" && BACKUPS+=("$DIR/index.html.bak-$TS") && ok "Bản cũ đổi tên → index.html.bak-$TS"; fi
fi
[ -f "$DIR/index.html" ] || { cp "$TMP/index.html" "$DIR/index.html" && chmod 644 "$DIR/index.html"; }
ok "$DIR/index.html ($(stat -c%s "$DIR/index.html") byte) → trong container: /srv/portal/$SLUG"

# ---------------------------------------------------------------- 3. Caddy
step "3/6 Khối Caddy cho $DOMAIN"
if grep -qE "^${DOMAIN//./\\.}[[:space:]]*\{" Caddyfile; then
  ok "Caddyfile đã có khối $DOMAIN – giữ nguyên"
else
  backup Caddyfile "Caddyfile.bak-$SLUG-$TS"
  # Bám theo khối tĩnh có sẵn (750prompts) để giữ nguyên nếp cấu hình đang chạy ổn
  awk '/^750prompts\.thaykhoa-ai\.tech[[:space:]]*\{/{f=1} f{print} f&&/^\}/{exit}' Caddyfile > "$TMP/block"
  if [ -s "$TMP/block" ] && grep -q '/srv/portal/750prompts' "$TMP/block"; then
    sed "s/750prompts/$SLUG/g" "$TMP/block" > "$TMP/newblock"; ok "Chép cấu trúc từ khối 750prompts"
  else
    printf '%s {\n    encode zstd gzip\n    header Strict-Transport-Security max-age=15552000\n    root * /srv/portal/%s\n    header Cache-Control no-cache\n    file_server\n}\n' "$DOMAIN" "$SLUG" > "$TMP/newblock"
    ok "Không tìm thấy khối 750prompts – dùng mẫu chuẩn của hạ tầng"
  fi
  { echo; cat "$TMP/newblock"; } >> Caddyfile
  if dc exec -T proxy caddy validate --config /etc/caddy/Caddyfile >"$TMP/validate.log" 2>&1; then
    ok "caddy validate: hợp lệ"
  else
    cp -p "Caddyfile.bak-$SLUG-$TS" Caddyfile
    tail -5 "$TMP/validate.log"
    die "Cấu hình Caddy không hợp lệ – đã khôi phục bản sao lưu, các trang khác không bị ảnh hưởng."
  fi
fi

# ---------------------------------------------------------------- 5. Cổng ứng dụng (làm trước bước 4 để không phải chờ DNS)
step "4/6 Cập nhật cổng ứng dụng thaykhoa-ai.tech"
NEED=0
[ -f "$PORTAL/apps.json" ] && ! grep -q "$DOMAIN" "$PORTAL/apps.json" && NEED=1
[ -f "$PORTAL/index.html" ] && ! grep -q "$DOMAIN" "$PORTAL/index.html" && NEED=1
if [ "$NEED" = 1 ]; then
  [ -f "$PORTAL/apps.json" ] && backup "$PORTAL/apps.json" "$BK/apps.json.bak-$SLUG-$TS"
  [ -f "$PORTAL/index.html" ] && backup "$PORTAL/index.html" "$BK/index.html.bak-$SLUG-$TS"
  cat > "$TMP/portal.py" <<'PY'
import json, re, sys
portal, domain = sys.argv[1], sys.argv[2]
name = 'EduLesson Study CoPilot'
desc = 'Sinh hoạt chuyên môn theo Nghiên cứu bài học: dự giờ, AI phân tích, biên bản 4 bước'
url = f'https://{domain}/'
assert len(desc) < 90
# apps.json
try:
    p = f'{portal}/apps.json'
    raw = open(p, encoding='utf-8').read()
    data = json.loads(raw)
    apps = data if isinstance(data, list) else data.get('apps', [])
    if not any(domain in str(a.get('url', '')) for a in apps):
        ref = next((a for a in apps if 'khkt' in str(a.get('url', ''))), apps[0] if apps else {})
        entry = {'name': name, 'description': desc, 'url': url}
        if 'icon' in ref: entry['icon'] = ref['icon']
        apps.append(entry)
        indent = 4 if '\n    "' in raw[:400] else 2
        open(p, 'w', encoding='utf-8').write(json.dumps(data, ensure_ascii=False, indent=indent) + '\n')
        print('  ✓ apps.json: đã thêm mục', name)
    else: print('  ✓ apps.json: đã có sẵn')
except FileNotFoundError: print('  ! Không có apps.json – bỏ qua')
# index.html: chèn thẻ ngay trước </nav> của <nav class="links">
try:
    p = f'{portal}/index.html'
    html = open(p, encoding='utf-8').read()
    if domain in html: print('  ✓ index.html: đã có sẵn')
    else:
        m = re.search(r'<nav class="links"[^>]*>', html)
        if not m: sys.exit('  ✗ Không tìm thấy <nav class="links"> trong trang chủ – không sửa')
        end = html.find('</nav>', m.end())
        nav = html[m.end():end]
        cards = re.findall(r'<a class="app-link"[^>]*href="([^"]*)"[^>]*>.*?<span class="app-icon"[^>]*>(.*?)</span>\s*<span class="app-text">', nav, re.S)
        icon = next((svg for href, svg in cards if 'khkt' in href), cards[0][1] if cards else '')
        card = (f'<a class="app-link" href="{url}"><span class="app-icon" aria-hidden="true">{icon}</span>'
                f'<span class="app-text"><strong>{name}</strong><span>{desc}</span><small>{domain}</small></span>'
                f'<span class="arrow" aria-hidden="true">↗</span></a>\n')
        open(p, 'w', encoding='utf-8').write(html[:end] + card + html[end:])
        print('  ✓ index.html: đã thêm thẻ', name, '(icon chép từ thẻ', 'khkt' if any('khkt' in h for h, _ in cards) else 'đầu tiên', ')')
except FileNotFoundError: print('  ! Không có index.html trang chủ – bỏ qua')
PY
  python3 "$TMP/portal.py" "$PORTAL" "$DOMAIN" || die "Cập nhật cổng ứng dụng thất bại – bản sao lưu nằm trong $BK"
else
  ok "Cổng ứng dụng đã có mục $DOMAIN"
fi

dc exec -T proxy caddy reload --config /etc/caddy/Caddyfile >/dev/null 2>&1 && ok "Đã reload Caddy" || die "Reload Caddy thất bại"

# ---------------------------------------------------------------- 4. DNS
step "5/6 Bản ghi DNS"
CUR_IP=$(resolve "$DOMAIN")
if [ "$CUR_IP" != "$VPS_IP" ]; then
  echo
  echo "  ┌──────────────────────────────────────────────────────────────┐"
  echo "  │  CẦN THÊM 1 BẢN GHI DNS (30 giây) – script đang chờ...         │"
  echo "  │  hpanel.hostinger.com/domain/thaykhoa-ai.tech/dns              │"
  echo "  │  Loại: A    Tên: $SLUG    Giá trị: $VPS_IP    TTL: 14400   │"
  echo "  │  Bấm 'Thêm bản ghi'. Không sửa/xóa bản ghi nào khác.           │"
  echo "  └──────────────────────────────────────────────────────────────┘"
  END=$(( $(date +%s) + DNS_WAIT_MIN * 60 ))
  while [ "$(date +%s)" -lt "$END" ]; do
    CUR_IP=$(resolve "$DOMAIN")
    [ "$CUR_IP" = "$VPS_IP" ] && break
    [ -n "$CUR_IP" ] && die "$DOMAIN vừa phân giải sang IP khác ($CUR_IP) – kiểm tra lại bản ghi."
    printf '.'; sleep 20
  done
  echo
  [ "$CUR_IP" = "$VPS_IP" ] || die "Sau $DNS_WAIT_MIN phút chưa thấy bản ghi DNS. Thêm bản ghi rồi chạy lại script (an toàn khi chạy lại)."
fi
ok "Google DNS: $DOMAIN → $CUR_IP"

# ---------------------------------------------------------------- 6. Chứng chỉ + kiểm tra thật
step "6/6 Chứng chỉ Let's Encrypt và kiểm tra bằng curl"
PROD=/data/caddy/certificates/acme-v02.api.letsencrypt.org-directory/
has_cert() { dc exec -T proxy ls "$PROD" 2>/dev/null | grep -qx "$DOMAIN"; }
if ! has_cert; then
  dc restart proxy >/dev/null 2>&1 && ok "Khởi động lại container proxy để xin chứng chỉ ngay"
  END=$(( $(date +%s) + CERT_WAIT_MIN * 60 ))
  until has_cert || [ "$(date +%s)" -ge "$END" ]; do printf '.'; sleep 10; done; echo
  has_cert || { dc logs --tail 20 proxy 2>/dev/null | grep -i -E "acme|$SLUG" | tail -8; die "Chưa có chứng chỉ thật sau $CERT_WAIT_MIN phút – chờ thêm vài phút rồi chạy lại script."; }
fi
ok "Chứng chỉ thật (production) đã có cho $DOMAIN"

RESULT=$(curl -s -o "$TMP/live.html" -w '%{http_code} %{size_download} %{ssl_verify_result}' --max-time 30 "https://$DOMAIN/")
read -r CODE SIZE TLS <<<"$RESULT"
LIVE_TITLE=$(grep -o '<title>[^<]*' "$TMP/live.html" 2>/dev/null | head -1 | sed 's/<title>//')
HOME_OK=$(curl -s --max-time 20 https://thaykhoa-ai.tech/ | grep -c "$DOMAIN")
echo "  https://$DOMAIN/ → HTTP $CODE · $SIZE byte · TLS verify=$TLS · title: \"$LIVE_TITLE\""
echo "  https://thaykhoa-ai.tech/ → có mục mới: $([ "${HOME_OK:-0}" -ge 1 ] && echo có || echo CHƯA)"
[ "$CODE" = 200 ] || die "Trang chưa trả mã 200"
[ "$TLS" = 0 ] || die "Xác minh TLS chưa đạt"
[ "$SIZE" = "$EXPECT_SIZE" ] || echo "  ! Dung lượng ($SIZE) khác tệp gốc ($EXPECT_SIZE) – có thể do nén; kiểm tra title"
[ "$LIVE_TITLE" = "$TITLE" ] || die "Title lấy về không khớp tệp gốc"

echo
echo "================ HOÀN TẤT ================"
echo "  Ứng dụng : https://$DOMAIN/"
echo "  Trang chủ: https://thaykhoa-ai.tech/"
echo "  Sao lưu  :"; for b in "${BACKUPS[@]:-}"; do [ -n "$b" ] && echo "    - $b"; done
echo "  Nếu máy anh/chị chưa mở được: nhà mạng còn nhớ DNS cũ – thử bằng 4G hoặc chờ ít phút."
rm -rf "$TMP"
exit 0
