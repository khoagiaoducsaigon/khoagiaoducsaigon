// Bộ sinh Mock AI: bản nháp trọn bộ 5 bước phải sạch cờ đỏ ở cả 3 cấp (bài mẫu mục 8 v1.0).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { soanTronBo } from '../../app/js/gen.js';
import { runRules } from '../../app/js/rules.js';

const J = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const YCCD = J('../../data/processed/yccd.json'), NLS = J('../../data/processed/nls.json'), AI = J('../../data/processed/ai.json');
export const BAI_MAU = [
  { ten_bai: 'Hình tròn: tâm, bán kính, đường kính', mon: 'Toán', lop: 3, bo_sach: 'Kết nối tri thức', so_tiet: 1, tim: /tâm, bán kính, đường kính/i },
  { ten_bai: 'Hình chóp tam giác đều và diện tích xung quanh', mon: 'Toán', lop: 8, bo_sach: 'Kết nối tri thức', so_tiet: 2, tim: /hình chóp tam giác đều/i },
  { ten_bai: 'Nghệ thuật xây dựng hình tượng nhân vật sử thi', mon: 'Ngữ văn', lop: 10, bo_sach: 'Chân trời sáng tạo', so_tiet: 2, tim: /sử thi/i }
];

for (const b of BAI_MAU) {
  test(`soạn trọn bộ ${b.mon} ${b.lop}: YCCĐ đúng CT 2018, không cờ đỏ`, () => {
    const yccd = YCCD.filter(y => y.mon === b.mon && y.lop === b.lop && b.tim.test(y.yccd));
    assert.ok(yccd.length >= 1, 'tìm thấy YCCĐ trong CT 2018');
    const bo = soanTronBo(b, yccd, NLS, AI);
    assert.equal(bo.nd.khung, b.lop <= 5 ? 'PL3-2345' : 'PL4-5512');
    const r = runRules({ lesson: b, nd: bo.nd, yccd, assessments: bo.assessments, worksheets: bo.worksheets, slides: bo.slides, integrations: bo.integrations, nls: NLS, ai: AI });
    const do_ = r.flags.filter(f => f.muc === 'do');
    assert.deepEqual(do_, [], JSON.stringify(do_, null, 1));
    assert.ok(r.chi_so.bam_yccd >= 50, JSON.stringify(r.chi_so));
    assert.ok(bo.assessments.cau_hoi.some(c => c.muc_do === 'VD'));
    assert.ok(bo.integrations.some(x => x.loai === 'NLS') && bo.integrations.some(x => x.loai === 'AI'));
    assert.equal(r.flags.filter(f => ['NLS-01', 'AI-01'].includes(f.rule_id)).length, 0, JSON.stringify(r.flags.filter(f => ['NLS-01', 'AI-01'].includes(f.rule_id))));
  });
}
