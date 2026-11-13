# /// script
# requires-python = ">=3.11"
# dependencies = ["loguru"]
# ///
"""Chép dữ liệu khung vào app/data/ và tách yccd.json theo môn (trình duyệt chỉ tải môn đang soạn).
Chạy sau build_yccd.py, build_khung.py, build_plv.py:  uv run agents/tools/build_app_data.py
"""
import json
import re
import shutil
import unicodedata
from collections import defaultdict
from pathlib import Path

from loguru import logger

ROOT = Path(__file__).resolve().parents[2]
SRC, OUT = ROOT / "data/processed", ROOT / "app/data"


def slug(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").replace("đ", "d").replace("Đ", "D").lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def main() -> None:
    (OUT / "yccd").mkdir(parents=True, exist_ok=True)
    for f in ("nls.json", "ai.json", "plv.json"):
        shutil.copy(SRC / f, OUT / f)
    theo_mon = defaultdict(list)
    for y in json.loads((SRC / "yccd.json").read_text(encoding="utf-8")):
        theo_mon[y["mon"]].append({k: y[k] for k in ("id", "lop", "mach", "noi_dung", "yccd")})
    for mon, items in theo_mon.items():
        (OUT / "yccd" / f"{slug(mon)}.json").write_text(json.dumps(items, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    logger.success("app/data: {} môn YCCĐ + nls/ai/plv", len(theo_mon))


if __name__ == "__main__":
    main()
