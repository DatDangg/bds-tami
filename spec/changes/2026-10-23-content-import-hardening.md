---
id: content-import-hardening
type: bug
status: pending
created: 2026-10-23
---

# Script `content:import`: tốn RAM tới mức bị kill, dry-run lỗi vẫn exit 0, runbook thiếu bước danh mục dự án ở prod

## Yêu cầu
Ba lỗi lộ ra khi nhập 3 dự án + 8 tin lên production (BL-072 phase-2-task-02). Cùng script `scripts/import-content.ts` (`seed/content/import.ts`) + runbook `docs/runbooks/english-pack.md`, nên gộp một change:

1. **Bị OOM-kill khi nhập lô ảnh lớn.** `content:import apply` trong `tami-app` (giới hạn 1 GB) bị kernel kill (exit 137, `anon-rss` ~847 MB) sau khi tải ~56/90 ảnh. Phải tạm nâng `tami-app` lên 2 GB mới chạy xong. Script có vẻ giữ buffer ảnh trong bộ nhớ suốt lần chạy. Cần tìm root cause rồi giải phóng bộ nhớ theo từng ảnh (hoặc tương đương), để nhập ~90 ảnh 1–6 MB vẫn nằm trong 1 GB.
2. **Dry-run có dòng `LỖI` vẫn trả exit 0.** Runbook ghi "exit code ≠ 0 khi còn lỗi". Dry-run prod lần đầu in `Tổng: 13 sẽ tạo, 0 đã có, 3 lỗi` mà exit 0. (`apply` vẫn tự dừng khi còn lỗi, nên chưa gây hại.)
3. **Runbook thiếu hướng dẫn khi prod chưa có danh mục `project`.** Thông báo lỗi và runbook đều bảo "chạy `pnpm seed`", nhưng seed bị cấm ở staging/prod (AGENTS.md). Danh mục `project` vốn chỉ có trong seed mẫu (`seed/sample/projects.ts`), còn `seed/categories.ts` để admin tự thêm. Lần này phải tạo 4 danh mục bằng script one-off.

## Bối cảnh / tái hiện (bug)
- Môi trường: production `tami-app` (mem 1 GB), 2026-10-23. Log + số đo: `tasks/feature-new-content-english/phase-2-task-02.md` § Verification summary.
- Bước tái hiện (1): DB chưa có bộ dữ liệu 2026-10-23 → `IMPORT_IMG_DIR=<thư mục ảnh 184 MB> IMPORT_CONFIRM=2026-10-23 pnpm content:import apply` trong container giới hạn 1 GB.
- Bước tái hiện (2): DB thiếu danh mục `project` → `pnpm content:import` (dry-run) → in `LỖI`, exit 0.
- Expected: (1) chạy hết trong 1 GB; (2) exit ≠ 0 khi có `LỖI`; (3) thông báo + runbook chỉ cách đúng cho prod.
- Actual: (1) exit 137 giữa chừng; (2) exit 0; (3) bảo chạy `pnpm seed`.

## Acceptance (bắt buộc)
- [ ] Root cause RAM được ghi rõ (buffer nào giữ, ở đâu); nhập bộ 2026-10-23 (~90 ảnh) trên DB trống với giới hạn 1 GB không bị kill (đo peak RSS, ghi số).
- [ ] Dry-run có ít nhất một dòng `LỖI` → exit code ≠ 0; không lỗi → exit 0. Có test.
- [ ] Thông báo thiếu danh mục `project` không còn bảo chạy `pnpm seed` ở staging/prod; runbook có bước tạo danh mục dự án cho prod (admin tạo tay, hoặc cách có kiểm soát được chốt), kèm tên EN cho các danh mục gói EN không phủ.
- [ ] Vẫn giữ: mặc định dry-run, `apply` cần `IMPORT_CONFIRM`, chạy lại idempotent (test hiện có PASS).

## Ghi chú
- Liên quan BL-070 (SeaweedFS 256 MB OOM): cùng lần nhập, nhưng là container khác, xử lý riêng.
- Không cần cho tới lần nhập nội dung lớn tiếp theo; chưa gấp.
