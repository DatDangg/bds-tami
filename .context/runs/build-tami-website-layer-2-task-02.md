# Run Journal — build/tami-website · layer-2-task-02

```yaml
workItem: build/tami-website
phaseTask: layer-2-task-02
step: closeout
agent: primary
status: done
attempt: 3
interrupted: false
updatedAt: 2026-10-17T22:10:00.000Z
filesTouched: ["context/progress.json",".context/runs/build-tami-website-layer-2-task-02.md","docs/ERD.md","migrations/index.ts","package.json","src/payload-types.ts","src/payload.config.ts","tasks/tami-website/layer-2-task-02.md","tasks/tami-website/layer-6-task-02.md"]
filesNew: [".context/review-reports/build-tami-website-layer-2-task-02-round-1-review.md",".context/review-reports/build-tami-website-layer-2-task-02-round-2-review.md",".context/review-reports/build-tami-website-layer-2-task-02-round-3-review.md","migrations/20261017_122831_provinces_wards.json","migrations/20261017_122831_provinces_wards.ts","scripts/admin-units/read-xlsx.mjs","scripts/admin-units/vietnamese-key.ts","scripts/build-admin-units.mjs","scripts/seed-run.ts","scripts/seed.mjs","seed/data/administrative-units.json","seed/data/danh-muc-phuong-xa-moi.xlsx","seed/data/vietnam-sap-nhap-phuong-xa.csv","seed/geo.ts","seed/index.ts","src/collections/Provinces.ts","src/collections/Wards.ts","tests/fixtures/geo/payload-config.ts","tests/integration/geo-seed.test.ts","tests/unit/admin-units.test.ts","tests/unit/vietnamese-key.test.ts"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-2-task-02-round-3-review.md
  round: 3
  verdict: PASS
next: "Task done + committed. Task kế: layer-5-task-01 (projects)."
loopSignal: none
approvals: [{gate: data_source, at: 2026-10-17T20:40:00.000Z, ok: true, note: "User: xlsx làm nguồn chính, lấy tên cũ từ CSV. Làm L2-T02 rồi L5-T01, L5-T04, layer 6"}]
batchQueue: []
```

## History

- 2026-10-17T20:40:00.000Z Unblock: user gửi 2 file (xlsx danh mục phường xã mới — mã tỉnh BNV 01–34 + mã TMS 8 số; CSV sáp nhập — tên cũ). Primary đối chiếu: 34 tỉnh, 3.321 phường/xã khớp 2 file, 16 tên khác cách viết. Chép vào seed/data/. ▶ START builder (cancel sẽ redo bước này). HEAD 08acf77.
- 2026-10-17T21:00:00.000Z ✅ DONE builder attempt 1 — Provinces/Wards + migration 20261017_122831_provinces_wards (additive), converter scripts/build-admin-units.mjs → seed/data/administrative-units.json (34 tỉnh, 3.321 phường/xã 687/2.621/13, 10.643 legacyNames, 16 alias), seed runner pnpm seed (base/sample, --sample chặn production). Seed dev: lần 1 tạo 34/3.321, lần 2-3 unchanged. test 101 file 1.043 PASS, build OK. ▶ START reviewer round 1 STRICT (cancel sẽ redo bước này).
- 2026-10-17T21:15:00.000Z ✅ DONE reviewer round 1 STRICT — FAIL: M1 matchKey bỏ hết dấu → 16 cặp phường cùng tỉnh khác dấu (Cẩm Giang/Cẩm Giàng, Thạnh An/Thanh An…) bị gộp legacyNames. MINOR m1–m8; ERD §4.2 phải ghi trước commit. ▶ START builder fix attempt 2 (cancel sẽ redo bước này).
- 2026-10-17T21:35:00.000Z ✅ DONE builder fix attempt 2 — vietnamese-key.ts giữ dấu, chỉ chuẩn hoá vị trí dấu thanh; converter fail khi trùng khoá; 16 phường sửa legacyNames (Thạnh An Cần Giờ hết Dầu Tiếng); alias 16→11 (thêm Albá↔Al Bá, Đào Duy Tư↔Đào Duy Từ); Provinces beforeDelete 409; engines >=22.18; ERD §4.2 as-built. Seed dev: 16 updated → lần 2 unchanged. test 102 file 1.059 PASS, build OK. ▶ START reviewer round 2 STRICT (cancel sẽ redo bước này).
- 2026-10-17T21:50:00.000Z ✅ DONE reviewer round 2 STRICT — PASS. MINOR n1 converter chưa fail khi 2 phường xlsx trỏ cùng nhóm CSV; n2 test xoá ward dùng id tỉnh; n3 comment đảo nhãn. User chọn tên Đào Duy Từ → cần sửa code sau PASS nên chạy builder fix + reviewer round 3. ▶ START builder fix attempt 3 (cancel sẽ redo bước này).
- 2026-10-17T22:00:00.000Z ✅ DONE builder fix attempt 3 — WARD_NAME_OVERRIDES 40153016 → Phường Đào Duy Từ (bỏ alias), n1 fail khi nhóm CSV khớp 2 lần, n2, n3, ERD §4.2. Seed: 1 updated → unchanged. test 1.060 PASS, build OK. ▶ START reviewer round 3 (cancel sẽ redo bước này).
- 2026-10-17T22:10:00.000Z ✅ DONE reviewer round 3 — PASS. Primary sửa comment r3-1 (chỉ comment). Follow-up legacyNames[].name → L6-T02. Close-out → commit.
