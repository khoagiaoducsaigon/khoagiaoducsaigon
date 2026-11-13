# /// script
# requires-python = ">=3.11"
# dependencies = ["loguru", "tenacity"]
# ///
"""Di trú tệp sao lưu JSON của EduPlan cũ ("Sao lưu Database (JSON)") sang định dạng nhập của EduPlan KHBD AI v1.1.

Cùng quy tắc với app/js/migrate.js (đã kiểm chéo bằng evals/tests/migrate_parity.test.mjs):
  - khóa chống trùng legacy_id (truyền --target để bỏ qua bản ghi đã di trú) → chạy nhiều lần không nhân đôi
  - dữ liệu mẫu của bản cũ bị bỏ qua, trừ bản ghi mẫu được dữ liệu thật tham chiếu hoặc đã bị sửa
  - trường không có chỗ → legacy{}; trạng thái duyệt giữ nguyên
  - nội dung KHBD giữ nguyên văn (noi_dung.van_ban_goc, can_doc_lai=true) — app tự đọc theo khung khi nhập

Dùng:
  uv run agents/tools/migrate_eduplan.py data/raw/private/eduplan-backup/x.json --dry-run
  uv run agents/tools/migrate_eduplan.py x.json --out data/processed/di-tru.json [--target ban-moi-da-co.json]
"""
import argparse
import json
import re
import sys
from datetime import datetime, timezone
from itertools import count
from pathlib import Path

from loguru import logger
from tenacity import retry, stop_after_attempt, wait_fixed

BANG_CU = ["users", "lesson_plans", "ai_audits", "review_notes", "audit_logs"]
MAU_CU = {
    "users": {f"u{i}" for i in range(1, 7)}, "lesson_plans": {"lp1", "lp2", "lp3"},
    "ai_audits": {f"a{i}" for i in range(1, 6)}, "review_notes": {f"r{i}" for i in range(1, 6)},
    "audit_logs": {f"log{i:03d}" for i in range(1, 16)},
}
MAU_KHBD_GOC = {"lp1": ("approved", 2), "lp2": ("pending", 2), "lp3": ("revise", 1)}
BIET = {
    "users": ["id", "name", "email", "code", "role", "dept", "grades", "title", "password", "status", "canApprove", "createdAt"],
    "lesson_plans": ["id", "title", "subject", "grade", "book", "term", "dept", "schoolYear", "teacherId", "content", "status", "versions"],
    "ai_audits": ["id", "planId", "version", "at", "by", "engine", "compliance", "activeness", "steps", "suggestions"],
    "review_notes": ["id", "planId", "version", "reviewerId", "reviewerName", "level", "verdict", "at", "strengths", "weaknesses", "solutions", "stepNotes", "general"],
    "audit_logs": ["id", "at", "userId", "userName", "role", "action", "target", "detail"],
}
VAI_TRO = {"admin": "admin", "leader": "to_truong", "teacher": "giao_vien"}
TRANG_THAI = {"draft": "ban_nhap", "revise": "yeu_cau_chinh_sua", "approved": "da_duyet"}
STORES = ["users", "lessons", "lesson_versions", "reviews", "audits", "activity_logs"]


def trang_thai(p: dict) -> str:
    if p.get("status") == "pending":
        return "cho_bgh_duyet" if p.get("ttSignedBy") else "cho_to_duyet"
    return TRANG_THAI.get(p.get("status"), "ban_nhap")


def la_mau(bang, rec):
    return rec.get("id") in MAU_CU[bang]


def mau_da_sua(rec):
    g = MAU_KHBD_GOC.get(rec.get("id"))
    return bool(g) and (rec.get("status") != g[0] or len(rec.get("versions") or []) != g[1])


def con_lai(rec, bang):
    return {k: v for k, v in rec.items() if k not in BIET[bang]}


def cap_hoc(lop) -> str:
    try:
        lop = int(lop)
    except (TypeError, ValueError):
        lop = 10
    return "TH" if lop <= 5 else "THCS" if lop <= 9 else "THPT"


def noi_dung(text: str) -> dict:
    return {"khung": "PL4-5512", "van_ban_goc": text or "", "can_doc_lai": True}


def lap_ke_hoach(cu: dict, hien_co: dict | None = None, now: str | None = None):
    hien_co = hien_co or {}
    now = now or datetime.now(timezone.utc).isoformat()
    seq = count()
    new_id = lambda p: f"{p}_py{next(seq):05d}"  # noqa: E731
    da_co = lambda store, lid: lid in hien_co.get(store, set())  # noqa: E731
    goc = {"nguon_du_lieu": "eduplan_cu", "ngay_di_tru": now}
    bao_cao = {b: {"doc": len(cu.get(b, [])), "ghi": 0, "bo_qua_mau": 0, "bo_qua_da_co": 0, "loi": 0} for b in BANG_CU}
    loi, ops = [], {s: [] for s in STORES}
    plans_all = cu.get("lesson_plans", [])
    by_id = {p["id"]: p for p in plans_all}

    giu_plan = {p["id"] for p in plans_all if not la_mau("lesson_plans", p) or mau_da_sua(p)}
    for b in ("ai_audits", "review_notes"):
        giu_plan |= {r["planId"] for r in cu.get(b, []) if not la_mau(b, r)}
    plans = [p for p in plans_all if p["id"] in giu_plan]
    keep_child = lambda b, r: r.get("planId") in giu_plan and (not la_mau(b, r) or mau_da_sua(by_id.get(r.get("planId"), {})))  # noqa: E731
    audits = [a for a in cu.get("ai_audits", []) if keep_child("ai_audits", a)]
    notes = [n for n in cu.get("review_notes", []) if keep_child("review_notes", n)]
    logs = [l for l in cu.get("audit_logs", []) if not la_mau("audit_logs", l)]
    giu_user = {u["id"] for u in cu.get("users", []) if not la_mau("users", u)}
    giu_user |= {p.get("teacherId") for p in plans} | {n.get("reviewerId") for n in notes} | {l.get("userId") for l in logs}
    users = [u for u in cu.get("users", []) if u["id"] in giu_user]
    for b, giu in (("users", users), ("lesson_plans", plans), ("ai_audits", audits), ("review_notes", notes), ("audit_logs", logs)):
        bao_cao[b]["bo_qua_mau"] = len(cu.get(b, [])) - len(giu)

    u_map, p_map = {}, {}
    for u in users:
        if da_co("users", u["id"]):
            bao_cao["users"]["bo_qua_da_co"] += 1
            continue
        if not (u.get("email") or u.get("code")):
            bao_cao["users"]["loi"] += 1
            loi.append({"bang": "users", "legacy_id": u["id"], "loi": "thiếu email và mã GV"})
            continue
        uid = new_id("u")
        u_map[u["id"]] = uid
        pw = u.get("password") or ""
        ops["users"].append({**goc, "legacy_id": u["id"], "id": uid, "ho_ten": u.get("name"), "email": u.get("email", ""), "ma_gv": u.get("code", ""),
                             "vai_tro": VAI_TRO.get(u.get("role"), "giao_vien"), "to_chuyen_mon": u.get("dept", ""), "cap_hoc": "",
                             "khoi_phu_trach": [x for x in re.split(r"[,;\s]+", str(u.get("grades") or "")) if x], "chuc_danh": u.get("title", ""),
                             "mat_khau_bam": pw, "phai_doi_mat_khau": pw.startswith("djb2:") or not pw, "trang_thai": u.get("status", "active"),
                             "quyen_duyet": bool(u.get("canApprove")), "tao_luc": u.get("createdAt") or now, "cap_nhat_luc": now, "legacy": con_lai(u, "users")})
        bao_cao["users"]["ghi"] += 1

    for p in plans:
        if da_co("lessons", p["id"]):
            bao_cao["lesson_plans"]["bo_qua_da_co"] += 1
            continue
        if not p.get("title"):
            bao_cao["lesson_plans"]["loi"] += 1
            loi.append({"bang": "lesson_plans", "legacy_id": p["id"], "loi": "thiếu tên bài"})
            continue
        lid = new_id("l")
        p_map[p["id"]] = lid
        m = re.search(r"(\d+)\s*ti[ếe]t", p.get("content") or "", re.I)
        versions = p.get("versions") or [{"v": 1, "at": p.get("createdAt") or now, "by": p.get("teacherName", ""), "note": "Bản gốc", "content": p.get("content", "")}]
        lop = int(p["grade"]) if str(p.get("grade", "")).isdigit() else None
        ops["lessons"].append({**goc, "legacy_id": p["id"], "id": lid, "ten_bai": p["title"], "cap_hoc": cap_hoc(p.get("grade")), "mon": p.get("subject", ""), "lop": lop,
                               "bo_sach": p.get("book", ""), "hoc_ky": p.get("term", ""), "nam_hoc": p.get("schoolYear", ""), "so_tiet": int(m.group(1)) if m else None,
                               "khung": "PL4-5512", "yccd_ids": [], "noi_dung": noi_dung(p.get("content", "")), "trang_thai": trang_thai(p),
                               "phien_ban_hien_tai": len(versions), "giao_vien_id": u_map.get(p.get("teacherId")), "to": p.get("dept", ""),
                               "nhan": "nhập từ EduPlan", "che_do": "ra_soat_nhanh", "tao_luc": p.get("createdAt") or now, "cap_nhat_luc": p.get("updatedAt") or now,
                               "nop_luc": p.get("submittedAt"), "legacy": con_lai(p, "lesson_plans")})
        for i, v in enumerate(versions):
            so = v.get("v", i + 1)
            ops["lesson_versions"].append({**goc, "legacy_id": f"{p['id']}#v{so}", "id": new_id("lv"), "lesson_id": lid, "so_phien_ban": so,
                                           "noi_dung": noi_dung(v.get("content", "")), "ghi_chu": v.get("note", ""), "nguoi_sua": v.get("by", ""),
                                           "luc": v.get("at") or now, "legacy": {"score": v.get("score")}})
        bao_cao["lesson_plans"]["ghi"] += 1

    cap_cua = lambda n: "to" if n.get("level") == "Tổ chuyên môn" else "bgh"  # noqa: E731
    for n in notes:
        if da_co("reviews", n["id"]):
            bao_cao["review_notes"]["bo_qua_da_co"] += 1
            continue
        if n.get("planId") not in p_map:
            bao_cao["review_notes"]["loi"] += 1
            loi.append({"bang": "review_notes", "legacy_id": n["id"], "loi": "KHBD tham chiếu không có trong lần di trú này"})
            continue
        ops["reviews"].append({**goc, "legacy_id": n["id"], "id": new_id("r"), "lesson_id": p_map[n["planId"]], "phien_ban": n.get("version"), "cap": cap_cua(n),
                               "nguoi_duyet_id": u_map.get(n.get("reviewerId")), "nguoi_duyet_ten": n.get("reviewerName", ""), "ket_luan": n.get("verdict", ""),
                               "uu_diem": n.get("strengths", ""), "ton_tai": n.get("weaknesses", ""), "giai_phap": n.get("solutions", ""),
                               "nhan_xet_4_buoc": n.get("stepNotes", []), "nhan_xet_chung": n.get("general", ""), "gop_y_theo_dong": [], "luc": n.get("at") or now,
                               "legacy": con_lai(n, "review_notes")})
        bao_cao["review_notes"]["ghi"] += 1
    for p in plans:
        if p["id"] not in p_map:
            continue
        for cap, ten, luc in (("to", p.get("ttSignedBy"), p.get("ttSignedAt")), ("bgh", p.get("bghSignedBy"), p.get("bghSignedAt"))):
            lk = f"{p['id']}#ky-{cap}"
            co_phieu = any(n.get("planId") == p["id"] and cap_cua(n) == cap and n.get("verdict") == "Đạt" for n in notes)
            if not ten or co_phieu or da_co("reviews", lk):
                continue
            ops["reviews"].append({**goc, "legacy_id": lk, "id": new_id("r"), "lesson_id": p_map[p["id"]], "phien_ban": len(p.get("versions") or []) or 1, "cap": cap,
                                   "nguoi_duyet_id": None, "nguoi_duyet_ten": ten, "ket_luan": "Đạt", "uu_diem": "", "ton_tai": "", "giai_phap": "",
                                   "nhan_xet_4_buoc": [], "nhan_xet_chung": "Ký duyệt (chuyển từ chữ ký trên EduPlan cũ, không kèm phiếu).",
                                   "gop_y_theo_dong": [], "luc": luc or now, "legacy": {"nguon": "chu_ky_cu"}})

    for a in audits:
        if da_co("audits", a["id"]):
            bao_cao["ai_audits"]["bo_qua_da_co"] += 1
            continue
        if a.get("planId") not in p_map:
            bao_cao["ai_audits"]["loi"] += 1
            loi.append({"bang": "ai_audits", "legacy_id": a["id"], "loi": "KHBD tham chiếu không có trong lần di trú này"})
            continue
        co = [{"rule_id": f"EDUPLAN-B{s.get('step')}", "muc": "vang", "nhom": "Tổ chức", "nguon": "eduplan v1", "vi_tri": "hoat_dong", "thong_diep": s.get("analysis", ""), "de_xuat": ""}
              for s in a.get("steps", []) if s.get("status") != "Đạt"]
        co += [{"rule_id": "EDUPLAN-DX", "muc": "xanh", "nhom": "Đề xuất", "nguon": "eduplan v1", "vi_tri": "hoat_dong", "thong_diep": s.get("activity", ""), "de_xuat": s.get("revised", "")}
               for s in a.get("suggestions", [])]
        ops["audits"].append({**goc, "legacy_id": a["id"], "id": new_id("a"), "lesson_id": p_map[a["planId"]], "phien_ban": a.get("version"),
                              "chi_so": {"tuan_thu_5512": a.get("compliance"), "tich_cuc": a.get("activeness")}, "co": co,
                              "engine": f"{a.get('engine') or 'EduPlan cũ'} (eduplan v1)", "luc": a.get("at") or now,
                              "legacy": {**con_lai(a, "ai_audits"), "steps": a.get("steps"), "suggestions": a.get("suggestions")}})
        bao_cao["ai_audits"]["ghi"] += 1

    for l in logs:
        if da_co("activity_logs", l["id"]):
            bao_cao["audit_logs"]["bo_qua_da_co"] += 1
            continue
        ops["activity_logs"].append({**goc, "legacy_id": l["id"], "id": new_id("log"), "nguoi": l.get("userName", ""), "nguoi_id": u_map.get(l.get("userId")),
                                     "vai_tro": VAI_TRO.get(l.get("role"), l.get("role", "")), "hanh_dong": l.get("action", ""), "doi_tuong": l.get("target", ""),
                                     "chi_tiet": l.get("detail", ""), "luc": l.get("at") or now, "legacy": con_lai(l, "audit_logs")})
        bao_cao["audit_logs"]["ghi"] += 1
    return ops, bao_cao, loi


@retry(stop=stop_after_attempt(3), wait=wait_fixed(1))
def doc_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


@retry(stop=stop_after_attempt(3), wait=wait_fixed(1))
def ghi_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    tmp.replace(path)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("backup", type=Path, help="Tệp JSON sao lưu của EduPlan cũ")
    ap.add_argument("--out", type=Path, help="Tệp JSON đầu ra (định dạng nhập của v1.1)")
    ap.add_argument("--target", type=Path, help="Tệp JSON bản mới đã có (để bỏ qua bản ghi đã di trú)")
    ap.add_argument("--dry-run", action="store_true", help="Chỉ in báo cáo, không ghi gì")
    a = ap.parse_args(argv)
    raw = doc_json(a.backup)
    cu = raw.get("tables", raw)
    if not all(isinstance(cu.get(b), list) for b in BANG_CU):
        logger.error("Tệp không đúng cấu trúc 5 bảng của EduPlan cũ")
        return 2
    hien_co = {}
    if a.target and a.target.exists():
        tg = doc_json(a.target).get("tables", {})
        hien_co = {s: {r.get("legacy_id") for r in tg.get(s, []) if r.get("nguon_du_lieu") == "eduplan_cu"} for s in STORES}
    ops, bao_cao, loi = lap_ke_hoach(cu, hien_co)
    log_run = {"luc": datetime.now(timezone.utc).isoformat(), "dry_run": a.dry_run, "nguon": a.backup.name, "bao_cao": bao_cao, "loi": loi, "nguoi_chay": "migrate_eduplan.py"}
    for b, r in bao_cao.items():
        logger.info("{:<13} đọc {:>4} · ghi {:>4} · bỏ qua (mẫu) {:>3} · bỏ qua (đã có) {:>3} · lỗi {:>2}", b, r["doc"], r["ghi"], r["bo_qua_mau"], r["bo_qua_da_co"], r["loi"])
    for e in loi:
        logger.warning("Lỗi {}#{}: {}", e["bang"], e["legacy_id"], e["loi"])
    if a.dry_run:
        logger.success("--dry-run: không ghi tệp nào")
        print(json.dumps(log_run, ensure_ascii=False))
        return 1 if loi else 0
    if not a.out:
        logger.error("Thiếu --out")
        return 2
    ghi_json(a.out, {"app": "EduPlan KHBD AI", "schema": "1.1", "loai": "di_tru_eduplan_cu", "tables": ops, "migration_logs": [log_run]})
    logger.success("Đã ghi {} → {}", sum(len(v) for v in ops.values()), a.out)
    return 1 if loi else 0


if __name__ == "__main__":
    sys.exit(main())
