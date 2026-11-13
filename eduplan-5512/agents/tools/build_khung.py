# /// script
# requires-python = ">=3.11"
# dependencies = ["loguru"]
# ///
"""Tách khung năng lực số (CV 3456) → nls.json và khung giáo dục AI (QĐ 2422) → ai.json.

- NLS: 6 miền, 24 năng lực thành phần, 5 bậc theo khối lớp. Phụ lục không có ký hiệu mã chỉ báo,
  app dùng mã `miền.năng_lực.bậc` (vd 1.1.L6-7) — đã ghi trong docs/decisions.md.
- AI: dùng nguyên mã chính thức của QĐ 2422 `lớp.chủ_đề.số` (vd 6.A1.2) và `lớp.chủ_đề.MRsố`.
Chạy: uv run agents/tools/build_khung.py
"""
import json
import re
from pathlib import Path

from loguru import logger

ROOT = Path(__file__).resolve().parents[2]
P = ROOT / "data/processed"

BAC = [
    {"ma": "L1-3", "lop": [1, 2, 3], "ten": "Cơ bản 1", "nhiem_vu": "Nhiệm vụ đơn giản", "tu_chu": "Với sự hướng dẫn"},
    {"ma": "L4-5", "lop": [4, 5], "ten": "Cơ bản 2", "nhiem_vu": "Nhiệm vụ đơn giản", "tu_chu": "Tự chủ và có hướng dẫn khi cần thiết"},
    {"ma": "L6-7", "lop": [6, 7], "ten": "Trung cấp 1", "nhiem_vu": "Nhiệm vụ xác định rõ ràng, thường xuyên; vấn đề đơn giản", "tu_chu": "Tự chủ hoàn toàn"},
    {"ma": "L8-9", "lop": [8, 9], "ten": "Trung cấp 2", "nhiem_vu": "Nhiệm vụ xác định rõ ràng, không thường xuyên", "tu_chu": "Độc lập và theo nhu cầu cá nhân"},
    {"ma": "L10-12", "lop": [10, 11, 12], "ten": "Nâng cao 1", "nhiem_vu": "Các nhiệm vụ và vấn đề khác nhau", "tu_chu": "Hướng dẫn người khác"},
]
MIEN = {"1": "Khai thác dữ liệu và thông tin", "2": "Giao tiếp và hợp tác", "3": "Sáng tạo nội dung số",
        "4": "An toàn", "5": "Giải quyết vấn đề", "6": "Ứng dụng trí tuệ nhân tạo"}


def build_nls() -> dict:
    lines = (P / "cv-3456-phu-luc-khung-nls.txt").read_text(encoding="utf-8").splitlines()
    comp_rx = re.compile(r"^([1-6])\.([1-6])\.?\s+(.{5,})$")
    comps, cur = [], None
    for i, raw in enumerate(lines):
        line = raw.strip()
        if m := comp_rx.match(line):
            cur = {"ma": f"{m.group(1)}.{m.group(2)}", "mien": MIEN[m.group(1)], "ten": m.group(3).strip(),
                   "mo_ta": lines[i + 1].strip() if i + 1 < len(lines) else "", "bieu_hien": []}
            comps.append(cur)
        elif cur and line.startswith("- ") and len(line) > 12:
            cur["bieu_hien"].append(line[2:].strip())
    logger.info("NLS: {} năng lực thành phần", len(comps))
    return {"nguon": "CV 3456/BGDĐT-GDPT ngày 27/6/2025 (phụ lục)", "quy_uoc_ma": "miền.năng_lực.bậc, vd 1.1.L6-7",
            "bac": BAC, "mien": MIEN, "nang_luc": comps}


def build_ai() -> dict:
    text = (P / "qd-2422-khung-giao-duc-ai.txt").read_text(encoding="utf-8")
    topic_rx = re.compile(r"^Chủ đề ([A-D][1-5])\.\s*(.+?)\s*$", re.M)
    topics = {m.group(1): m.group(2) for m in topic_rx.finditer(text)}
    yc_rx = re.compile(r"^(\d{1,2})\.([A-D][1-5])\.(MR)?(\d+)\.?\s+(.+)$")
    mach = {"A": "Tư duy lấy con người làm trung tâm", "B": "Đạo đức AI", "C": "Các kĩ thuật và ứng dụng AI", "D": "Thiết kế hệ thống AI"}
    items, seen, noi_dung = [], set(), ""
    for raw in text.splitlines():
        line = raw.strip()
        if m := yc_rx.match(line):
            lop, cd, mr, so, nd = m.groups()
            ma = f"{lop}.{cd}.{'MR' if mr else ''}{so}"
            if ma in seen:
                continue
            seen.add(ma)
            items.append({"ma": ma, "lop": int(lop), "chu_de": cd, "ten_chu_de": topics.get(cd, ""), "mach": mach[cd[0]],
                          "mo_rong": bool(mr), "noi_dung": noi_dung, "yccd": nd})
        elif line and not line.startswith(("-", "+", "*")) and len(line) < 110 and not re.match(r"^(LỚP|Chủ đề|Nội dung|Yêu cầu)", line):
            noi_dung = line
    logger.info("AI: {} chủ đề, {} YCCĐ có mã", len(topics), len(items))
    return {"nguon": "QĐ 2422/QĐ-BGDĐT ngày 18/8/2026", "mach": mach, "chu_de": topics, "yccd": items}


def main() -> None:
    (P / "nls.json").write_text(json.dumps(build_nls(), ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (P / "ai.json").write_text(json.dumps(build_ai(), ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    logger.success("Đã ghi nls.json, ai.json")


if __name__ == "__main__":
    main()
