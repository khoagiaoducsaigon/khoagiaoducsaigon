# /// script
# requires-python = ">=3.11"
# dependencies = ["loguru"]
# ///
"""Tách Phụ lục V (Mẫu phiếu đánh giá bài dạy, kèm CV 05/SGDĐT-GDPT 04/01/2021) → plv.json.

12 tiêu chí × 3 mức mô tả, điểm tối đa theo bảng phiếu (tổng 20), quy tắc chấm và xếp loại.
Chạy: uv run agents/tools/build_plv.py
"""
import json
import re
from pathlib import Path

from loguru import logger

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "data/processed/cv-05-sgddt-2021-pl5.txt"
OUT = ROOT / "data/processed/plv.json"

NHOM = [("I", "Kế hoạch bài dạy"), ("II", "Hoạt động của giáo viên"), ("III", "Hoạt động của học sinh")]
# Tiêu chí và điểm tối đa theo đúng thứ tự trong bảng phiếu
TIEU_CHI = [
    ("Mức độ phù hợp của các hoạt động học với mục tiêu, nội dung và phương pháp dạy học được sử dụng", 1.0),
    ("Mức độ rõ ràng, chính xác của mục tiêu, nội dung, sản phẩm, cách thức tổ chức thực hiện mỗi hoạt động học của học sinh", 2.0),
    ("Mức độ phù hợp của thiết bị dạy học và học liệu được sử dụng để tổ chức các hoạt động học của học sinh", 1.0),
    ("Mức độ phù hợp của phương án kiểm tra, đánh giá trong quá trình tổ chức hoạt động học của học sinh", 2.0),
    ("Mức độ chính xác, phù hợp, sinh động, hấp dẫn của nội dung, phương pháp và hình thức giao nhiệm vụ học tập cho học sinh", 2.0),
    ("Khả năng theo dõi, quan sát, phát hiện kịp thời những khó khăn của học sinh", 1.0),
    ("Mức độ phù hợp, hiệu quả của các biện pháp hỗ trợ và khuyến khích học sinh hợp tác, giúp đỡ nhau khi thực hiện nhiệm vụ học tập", 2.0),
    ("Mức độ chính xác, hiệu quả trong việc tổng hợp, phân tích, đánh giá quá trình và kết quả học tập của học sinh", 2.0),
    ("Khả năng tiếp nhận và sẵn sàng thực hiện nhiệm vụ học tập của học sinh trong lớp", 2.0),
    ("Mức độ tích cực, chủ động, sáng tạo, hợp tác của học sinh trong việc thực hiện các nhiệm vụ học tập", 2.0),
    ("Mức độ tham gia tích cực của học sinh trong trình bày, thảo luận về kết quả thực hiện nhiệm vụ học tập", 2.0),
    ("Mức độ đúng đắn, chính xác, phù hợp của các kết quả thực hiện nhiệm vụ học tập của học sinh", 1.0),
]


def main() -> None:
    lines = [re.sub(r"\s+", " ", l).strip() for l in SRC.read_text(encoding="utf-8").splitlines()]
    start = next(i for i, l in enumerate(lines) if l.startswith("I. Kế hoạch bài dạy"))
    levels, cur, buf = [], None, []

    def flush():
        if cur is not None:
            levels[-1][cur] = " ".join(buf).strip()

    for l in lines[start:]:
        if not l or re.fullmatch(r"\d+", l) or l.startswith("Trường hợp không đạt"):
            continue
        if re.match(r"^(I|II|III)\. ", l):
            continue
        if m := re.match(r"^(\d+)\. (.+)$", l):
            flush(); cur, buf = None, []
            levels.append({"tieu_de_huong_dan": m.group(2)})
            continue
        if m := re.match(r"^Mức ([123]): (.*)$", l):
            flush(); cur, buf = f"muc_{m.group(1)}", [m.group(2)]
            continue
        if cur:
            buf.append(l)
    flush()
    if len(levels) != 12:
        raise SystemExit(f"Kỳ vọng 12 tiêu chí, đọc được {len(levels)}")
    items = []
    for i, ((noi_dung, toi_da), lv) in enumerate(zip(TIEU_CHI, levels)):
        n = NHOM[i // 4]
        items.append({"ma": f"{n[0]}.{i % 4 + 1}", "nhom": n[1], "noi_dung": noi_dung, "diem_toi_da": toi_da,
                      "huong_dan": lv["tieu_de_huong_dan"], "muc": [lv.get("muc_1", ""), lv.get("muc_2", ""), lv.get("muc_3", "")]})
    assert sum(x["diem_toi_da"] for x in items) == 20
    out = {"nguon": "Phụ lục V – Mẫu phiếu đánh giá bài dạy (kèm CV 05/SGDĐT-GDPT ngày 04/01/2021 của Sở GDĐT)",
           "tong_diem": 20, "buoc_diem": 0.25,
           "muc_ty_le": [[0.50, 0.65], [0.65, 0.80], [0.80, 1.00]], "duoi_muc_1": "dưới 50% điểm tối đa",
           "xep_loai": [{"ten": "Giỏi", "tu": 18}, {"ten": "Khá", "tu": 13.5}, {"ten": "Trung bình", "tu": 10}, {"ten": "Không đạt", "tu": 0}],
           "tieu_chi": items}
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    logger.success("Đã ghi {} tiêu chí → {}", len(items), OUT.relative_to(ROOT))


if __name__ == "__main__":
    main()
