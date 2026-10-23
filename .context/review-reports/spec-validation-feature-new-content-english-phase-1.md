Agent: spec-validator

# Spec validation — feature-new-content-english (BL-072) · phase 1 · round 1

- Mode: Phase review (đã build đúng & đủ so với spec?) + cross-doc consistency
- Spec: `SPECIFICATIONS.md` spec_version 1.57.0 (F12 bullet BL-072, dòng 228; BL-064 dòng 227) · scope `spec/test-scope/current.json` v76 · change doc `spec/changes/2026-10-23-new-content-english.md`
- Phase 2 (áp staging/prod) chưa làm theo kế hoạch → item cần staging/prod ghi **pending phase 2**, không tính là gap.

## Verdict: PASS (⚠️ 1 gap MEDIUM về chữ trong spec, 3 LOW)

Không có ❌, không có HIGH conflict, 1 ⚠️ (< 3). Code đúng và đủ so với spec và acceptance của phase 1. Spec bullet BL-072 bỏ sót ngoại lệ `categories` khi khớp nhiều bản ghi, đã có trong code, README và runbook. Nên sửa chữ spec cùng scope trước khi chốt BL-072 hoặc trong close-out phase 2.

## Evidence chạy thật (read-only, DB dev)

`pnpm english:pack 2026-10-23-real-content` (dry-run) → `Tổng: sẽ ghi 0, không đổi 100, bỏ qua 0, thiếu bản vi 0`, exit 0. Gói idempotent trên dev, không bị bỏ dòng nào, `Căn hộ chung cư` khớp cả 2 scope.

## Coverage matrix

| # | Requirement | Source | Implementation | Status | Note |
|---|---|---|---|---|---|
| 1 | Nhập bằng `pnpm content:import` (`scripts/import-content.ts`), dữ liệu chữ `seed/content/<đợt>/`, ảnh qua `IMPORT_IMG_DIR` | SPEC:228 | `package.json:35`; `scripts/import-content.ts:17-23`; `seed/content/2026-10-23/` | ✅ | Bộ dữ liệu cố định trong code `CONTENT_DATASET="2026-10-23"` (`seed/content/import-plan.ts:9`). Xem L2 |
| 2 | Chỉ **tạo mới** `vi`; bản đã có (kể cả thùng rác) bỏ qua | SPEC:228 | `seed/content/import.ts:73-80` (`trash: true`, `locale: "vi"`), :150, :201 | ✅ | Runbook Rollback ghi rõ hệ quả với thùng rác |
| 3 | Gói EN ở `seed/english/packs/<gói>/`, ngoài `data/` | SPEC:228 | `seed/english/pack.ts:16`; `index.ts:17` (`DATA_DIR = ./data/`) | ✅ | |
| 4 | `pnpm english:pack <gói>`: chỉ bản ghi có trong gói | SPEC:228 | `package.json:34`; `pack.ts:63-81` (find theo khoá) | ✅ | |
| 5 | Mỗi khoá khớp đúng 1 bản ghi (≥ 2 → không ghi) | SPEC:228 | `pack-plan.ts:53-56`, `pack.ts:69-77` | ⚠️ PARTIAL (spec text) | Code có **ngoại lệ `categories`**: ≥ 2 → áp cho từng bản (`allowsMultipleMatches`). Có trong README:100, runbook:40, task T01 D3 (fix round 3). Spec bullet + `current.json impact.direct[1]` **không nhắc** → M1 |
| 6 | Không ghi đè EN đã có khác gói (trừ `overwrite`) | SPEC:228 | `apply.ts:96-97` (`protectExisting`), `pack.ts:107`; media `pack-plan.ts:81-85`, `media.ts:92-94` | ✅ | |
| 7 | Alt ảnh chỉ theo danh sách tường minh | SPEC:228 | `media.ts:76-102` (`applyExplicitMediaAlts`, không sinh theo mẫu) | ✅ | 82 alt trong `media.json` (T02) |
| 8 | Chỉ ghi `en`, `enSource = manual`, không xếp job dịch AI | SPEC:228 | `apply.ts:49` (`WRITE_CONTEXT` có `TRANSLATION_JOB_CONTEXT_KEY`), :52-64 (`enSource: "manual"`), :115/196 `locale: "en"`; `media.ts:96` | ✅ | |
| 9 | Bật `hasEnglish` khi đủ trường bắt buộc | SPEC:228 | `apply.ts:98-99`, :121-127 | ✅ | |
| 10 | Idempotent | SPEC:228 | dry-run thật: không đổi 100 / ghi 0 | ✅ | |
| 11 | Mặc định dry-run; apply cần tham số `apply` + env confirm khớp (`IMPORT_CONFIRM`, `ENGLISH_PACK_CONFIRM`) | SPEC:228 | `pack-plan.ts:10,35-38`; `import-plan.ts:10,13-16`; kiểm trước khi mở DB: `apply-english-pack.ts:16-20`, `import-content.ts:19-30`; kiểm lần hai ở engine `pack.ts:104`, `import.ts:246` | ✅ | Tên env khớp spec, runbook, README |
| 12 | Chạy dev/staging/prod theo runbook (backup → dry-run → duyệt → apply → dry-run lại → kiểm `/vi` `/en`) | SPEC:228 | `docs/runbooks/english-pack.md` §1-4 | ✅ | Runbook có cả rollback và mục "Việc KHÔNG làm" |
| 13 | Giá/số/tên riêng giữ; dự thảo ghi "draft" | SPEC:228; CD acc. 2-3 | T02 VS (quy ước "expected", số liệu); T03 VS; `news.json` có 50 lần "draft", bài Luật KDBĐS mở đầu bằng "This is a draft…, not yet law." | ✅ (dev) | Nguồn vi không có "tỷ"; "triệu đồng" → "million VND" |
| 14 | Không đổi schema, không migration | SPEC:228 | Không có file migration/collection trong danh sách thay đổi | ✅ | |
| 15 | BL-064: `seed:english` chỉ DB dev, chặn production | SPEC:227 | `seed/english/index.ts:24-33` (chặn `APP_ENV=staging`, bỏ `ALLOW_STAGING_SEED`, `checkSeedEnvironment`), :53; `WriteOptions` mặc định `{}` = hành vi cũ (`apply.ts:23-29`) | ✅ vẫn đúng | T01 VS: `seed-english.test.ts` PASS, không sửa |
| 16 | CD acc. 1: 3 dự án EN đủ trường, `hasEnglish`, alt EN | CD:19 | `projects.json` (3 khoá khớp `projects-data.mjs:13,104,201`), `developers.json` (3, khớp :5-7), `media.json`; T02 VS coverage 3/3 | ✅ dev · **pending phase 2** (staging/prod) | |
| 17 | CD acc. 2: 8 tin EN đủ đoạn, draft | CD:20 | `news.json` có 8 khoá khớp đúng 8 `title:` trong `seed/content/2026-10-23/news/*.md`; số ô theo T03 VS | ✅ dev · **pending phase 2** | |
| 18 | CD acc. 3: thuật ngữ thống nhất BL-064 | CD:21 | `categories.json` dùng lại "Apartments" / "Townhouses and villas" của BL-064 | ✅ | |
| 19 | CD acc. 4: `/en` trên staging không lẫn tiếng Việt; chạy lại không đè/nhân đôi | CD:22 | Dev: T02/T03 VS (200, chỉ còn tên riêng/số hiệu/địa chỉ theo BL-065) | **pending phase 2** | Phần idempotent đã có bằng chứng (#10) |
| 20 | CD acc. 5: chốt cách đưa lên production | CD:23 | Đã chốt Q2 = (a) (T01 D6): script nhập + gói EN có confirm + dry-run, runbook | ✅ (quyết định) · thực thi **pending phase 2** | |
| 21 | Scope routes `/en/projects/<slug>`, `/en/news`, `/en/news/<slug EN>` | current.json `screens` | `src/i18n/routing.ts:13-14` (`/du-an` ↔ `/projects`); slug EN dự án = slug vi vì tiêu đề EN giữ nguyên (`projects.json:3,118,231`) | ✅ | Thiếu trang danh sách `/en/projects` → L3 |
| 22 | Version: spec 1.57.0 ↔ scope `specVersion` 1.57.0 / v76; `spec/updates/2026-10-23-new-content-english.md`; CHANGELOG có BL-072 | — | Các file tồn tại và khớp nhau | ✅ | BACKLOG BL-072 `in_progress`, đúng vì phase 2 còn mở |

## Gaps

### [PARTIAL] M1 — MEDIUM — Spec bullet BL-072 thiếu ngoại lệ `categories` khi khớp nhiều bản ghi
- Requirement: SPEC:228 "mỗi khoá khớp đúng 1 bản ghi (trùng ≥ 2 → không ghi)"; `current.json` `impact.direct[1]` "khoá trùng ≥ 2 bản ghi → không ghi".
- As-built: `seed/english/pack-plan.ts:53-56` + `pack.ts:69-77`. Với nhóm `categories`, ≥ 2 bản khớp (cùng tên, khác scope) → áp cho **từng** bản, mỗi bản kiểm không-ghi-đè riêng và in một dòng `<tên> [<scope>]`. Change-request đã quyết định việc này (T01 D3, "Fix round 2 → 3") và ghi vào `seed/english/README.md:100` cùng runbook:40, nhưng **chưa đưa vào spec/scope**.
- Hệ quả: tester đọc spec/scope sẽ coi đây là lỗi, vì "Căn hộ chung cư" (project + rental) sẽ được ghi ở cả 2 bản chứ không bị bỏ qua.
- Đề xuất (cho change-request/spec-publisher, không tự sửa): thêm vào bullet SPEC:228 câu "trừ `categories`: cùng tên ở nhiều scope → áp cho mọi bản khớp, mỗi bản kiểm không-ghi-đè riêng". Cập nhật `impact.direct[1]` trong `current.json`, thêm một dòng acceptance/regression cho trường hợp này.
- Task liên quan: phase-1-task-01 (fix round 3), phase-1-task-02.

### L1 — LOW — `IMPORT_STATUS` không có trong spec
- `scripts/import-content.ts:4,18,24-25` có env tuỳ chọn `IMPORT_STATUS` (`published` mặc định | `draft`), đã ghi ở `seed/content/README.md:8`. Spec và runbook không nhắc tới. Nếu là tham số vận hành chính thức thì nên thêm vào runbook. Không chặn.

### L2 — LOW — Spec viết `seed/content/<đợt>/` như thể dùng chung, nhưng code chỉ chạy được một đợt
- `CONTENT_DATASET = "2026-10-23"` cố định (`import-plan.ts:9`). `import.ts` cũng cố định danh mục tin "Pháp lý & Quy hoạch" (:55), tỉnh `ha-noi`, phường `phuong-phu-thuong` (:141,145). Đợt sau phải sửa code chứ không chỉ thêm thư mục. Spec vẫn đúng với "đợt đầu", nhưng chữ `<đợt>` dễ hiểu nhầm là chỉ cần thêm dữ liệu. Ghi nhận, không chặn phase 1.

### L3 — LOW — Scope `current.json` chưa đủ
- `screens` thiếu trang danh sách `/en/projects`, nơi thẻ 3 dự án hiện bằng EN (T02 đã kiểm trang này).
- `changed.files` thiếu các test mới: `tests/unit/english-pack-plan.test.ts`, `tests/unit/import-content-plan.test.ts`, `tests/integration/english-pack.test.ts`, `tests/integration/import-content.test.ts` (T01 VS:59).

## Pending phase 2 (không phải gap)
- Backup → dry-run → user duyệt → `content:import apply` (nếu DB chưa có) → `english:pack apply` → dry-run lại → kiểm `/vi` `/en` trên staging, rồi production.
- CD acc. 1, 2, 4 trên staging/prod; `current.json acceptance[5]`.

## Residual risk
- Chưa tự chạy lại typecheck/lint/test trong lần validate này. Dựa vào evidence của builder (T01 VS: typecheck/lint PASS, test 436 files / 4588 tests PASS sau fix round 1; T02/T03 chạy vitest đúng phạm vi).
- Nhánh tạo tin của `content:import` chưa có test tích hợp end-to-end (T01 residual). Runbook đã bắt dry-run trên staging trước prod.
- Chưa kiểm thực tế `docker exec`/`docker cp` trên server (thuộc phase 2).
