# /// script
# requires-python = ">=3.11"
# dependencies = ["loguru"]
# ///
"""Tách yêu cầu cần đạt (YCCĐ) từ 28 chương trình GDPT 2018 (bản trích UTF-8) thành yccd.json.

Cấu trúc chương trình sau khi trích: tiêu đề "LỚP n" → các dòng mạch/chủ đề/nội dung → các dòng "- ..." là YCCĐ.
Chạy: uv run agents/tools/build_yccd.py
"""
import json
import re
import unicodedata
from pathlib import Path

from loguru import logger

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "data/processed/ct-gdpt-2018"
OUT = ROOT / "data/processed/yccd.json"

# Tệp chương trình → (tên môn hiển thị, các lớp áp dụng)
MON = {
    "02-ngu-van": "Ngữ văn", "03-toan": "Toán", "04-giao-duc-cong-dan": "GDCD / GD Kinh tế và Pháp luật",
    "05-tu-nhien-va-xa-hoi": "Tự nhiên và Xã hội", "06-lich-su-va-dia-li-th": "Lịch sử và Địa lí",
    "07-lich-su-va-dia-li-thcs": "Lịch sử và Địa lí", "08-lich-su": "Lịch sử", "09-dia-li": "Địa lí",
    "10-khoa-hoc": "Khoa học", "11-khoa-hoc-tu-nhien": "KHTN", "12-vat-li": "Vật lí", "13-hoa-hoc": "Hóa học",
    "14-sinh-hoc": "Sinh học", "15-cong-nghe": "Công nghệ", "16-tin-hoc": "Tin học", "17-am-nhac": "Âm nhạc",
    "18-mi-thuat": "Mĩ thuật", "19-giao-duc-the-chat": "Giáo dục thể chất", "20-hoat-dong-trai-nghiem": "Hoạt động trải nghiệm",
    "22-tieng-anh-3-12": "Tiếng Anh",
}
GRADE_RX = re.compile(r"^\s*(?:LỚP|Lớp)\s+(\d{1,2})\s*(?::.*)?$")
BULLET_RX = re.compile(r"^\s*[-–−•]\s*(.{12,})$")
CAPS_RX = re.compile(r"^[A-ZÀ-Ỹ0-9 ,\-–/()]+$")


def cap_hoc(lop: int) -> str:
    return "TH" if lop <= 5 else "THCS" if lop <= 9 else "THPT"


def parse(path: Path, mon: str) -> list[dict]:
    items, lop, mach, noi_dung = [], None, "", ""
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = unicodedata.normalize("NFC", raw).strip()
        if not line:
            continue
        if m := GRADE_RX.match(line):
            lop, mach, noi_dung = int(m.group(1)), "", ""
            continue
        if lop is None:
            continue
        if m := BULLET_RX.match(line):
            items.append({"mon": mon, "lop": lop, "cap_hoc": cap_hoc(lop), "mach": mach, "noi_dung": noi_dung, "yccd": m.group(1).strip()})
            continue
        if len(line) <= 120:
            if CAPS_RX.match(line) and len(line) > 3:
                mach = line.title() if line.isupper() else line
                noi_dung = ""
            else:
                noi_dung = line
    return items


def main() -> None:
    all_items: list[dict] = []
    for stem, mon in MON.items():
        f = SRC / f"{stem}.txt"
        if not f.exists():
            logger.warning("Thiếu {}", f.name)
            continue
        got = parse(f, mon)
        logger.info("{:<32} {:>5} YCCĐ", mon, len(got))
        all_items.extend(got)
    seen, uniq = set(), []
    for it in all_items:
        k = (it["mon"], it["lop"], it["yccd"])
        if k not in seen:
            seen.add(k)
            uniq.append(it)
    for i, it in enumerate(uniq, 1):
        it["id"] = f"Y{i:05d}"
    OUT.write_text(json.dumps(uniq, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    logger.success("Đã ghi {} YCCĐ → {}", len(uniq), OUT.relative_to(ROOT))


if __name__ == "__main__":
    main()
