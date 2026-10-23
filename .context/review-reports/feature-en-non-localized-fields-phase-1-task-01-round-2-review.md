Agent: reviewer

# Review — feature-en-non-localized-fields · phase-1-task-01 · round 2 (BL-065)

- Review level: **STRICT**
- Reason: re-review của task STRICT (DB/schema + migration có backfill 4 bảng, shape REST/GraphQL `rentals`/`projects` thêm trường, view type dùng chung). Fix r2 chỉ đụng comment/doc/help text, nhưng giữ level vì nó đóng finding liên quan tới migration.
- Blast radius (fix r2): `migrations/20261023_030506_floor_distance_normalized.ts` (chỉ khối comment đầu file), `src/lib/units/legacy-parse.ts` (chỉ comment/JSDoc), `docs/ERD.md:250` (đoạn as-built BL-065), `src/collections/Rentals.ts:69,79` + `src/collections/projects/market-blocks.ts:107` (`admin.description` của ô giá trị cũ, chỉ ảnh hưởng chữ trong form admin), task file (Risk + Verification summary). Không đổi SQL, logic backfill, parser, view hay schema, nên không cần chạy lại migration hay generate types. Phạm vi blast radius gốc giữ nguyên như ghi ở round 1.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (`tsc --noEmit` không có output lỗi) |
| `npx eslint src/lib/units src/collections/Rentals.ts src/collections/projects/market-blocks.ts migrations/20261023_030506_floor_distance_normalized.ts` | 0 error, 1 warning "File ignored" cho migration (repo ignore sẵn thư mục này) |
| `npx vitest run src/lib/units src/collections src/lib/rentals src/lib/projects src/components/rentals src/components/projects src/components/detail "src/app/(frontend)/[locale]/cho-thue" src/lib/admin` | 68 file / 731 test PASS (giống round 1, không hồi quy) |

## Đóng finding round 1
| Finding r1 | Trạng thái | Bằng chứng |
|---|---|---|
| **M1** thiếu `HIGH_RISK_MIGRATION` | **Đã đóng** | Migration `:5-8` có nhãn HIGH_RISK_MIGRATION + liệt kê 4 bảng backfill, idempotent, rollback = `down`, bắt buộc verify staging + đo thời gian backfill trước khi promote prod. `docs/ERD.md:250` đã bỏ "không HIGH_RISK", nay ghi "gắn **HIGH_RISK_MIGRATION** chỉ vì backfill 4 bảng … bắt buộc chạy + verify trên staging". Task `:9` Risk có nhãn. Phần còn lại của M1 fix (c): trailer commit `HIGH_RISK_MIGRATION` thuộc bước close-out/commit, primary phải nhớ thêm vào. |
| **m1** migration dùng parser đang sống | **Đã đóng** (chọn phương án comment) | `legacy-parse.ts:4` + JSDoc `:24`, `:35`: "migration … import parser này — KHÔNG đổi hành vi … cần khác thì tạo hàm mới". |
| **m2** residual sai về Payload | **Đã đóng** | Task `:68`: "Payload 3.91 giữ giá trị field có condition=false khi lưu nên giá trị cũ không mất". |
| **m3** help text "rồi xoá ô này" | **Đã đóng** | `Rentals.ts:79`, `market-blocks.ts:107`: "…; ô này tự ẩn sau khi có giá trị mới." Comment `Rentals.ts:69` cũng sửa theo. Grep không thấy test nào assert chuỗi này. |
| **m4** backfill từng dòng | **Đã đóng** (đúng như yêu cầu: ghi chú) | Đã đưa "đo thời gian backfill" vào migration `:8`, ERD `:250`, task Risk `:9`. |

Kiểm hồi quy: thân `up`/`down` và SQL (`:20-103`) khớp nguyên văn với bản đã review ở round 1. Parser (`:8-42`) không đổi regex/logic. File migration chưa track nên không có `git diff`; tôi so sánh bằng cách đọc lại toàn bộ file.

## Responsive Checklist Gate
Fix r2 không đụng UI công khai: chỉ đổi `admin.description` của Payload, không đổi markup/CSS.
- Layout: **N/A** (không đổi CSS/markup).
- Typography/Spacing: **N/A**.
- Media: **N/A**.
- Touch/Interaction: **N/A** (không thêm control).
- Viewport/A11y: **N/A**.
Kết luận của round 1 về `RentalDetail`/`ProjectLocation` (chỉ đổi text) vẫn đúng.

## Skill gates
- aislop: **skip, aislop not installed** (giống r1).
- oxlint (anti-slop): **skip, oxlint not configured**. eslint 0 error.
- open-code-review (ocr): **skip, ocr not installed**.
- AI-readable: **OK**. Comment mới nói WHY (ràng buộc bất biến của migration), không có comment kiểu WHAT, `docs/ERD.md` đã cập nhật. Có 2 nit nhỏ, xem MINOR. Tổng < 3 indicator.
- ai-friendly-web: **N/A** (không đổi gì ở phía public crawl).
- blitzstrike: **N/A** (không đụng auth/input công khai).

## Findings

### [CRITICAL]
Không có.

### [MAJOR]
Không có.

### [MINOR] (không chặn PASS)
- **n1 — Comment đầu `src/lib/units/legacy-parse.ts:3-5` chèn sai chỗ.** Dòng 4 ("LƯU Ý: migration …") bị chèn vào giữa câu: dòng 3 kết thúc "trả `unparsed`" không có dấu chấm, còn dòng 5 "(không đoán, …)" là phần tiếp của câu đó. Cách sửa: chuyển dòng 4 xuống sau dòng 5.
- **n2 — Header migration `:6-7` và `:10-11` nhắc lại ý "ADDITIVE … chỉ ghi cột mới khi còn NULL" hai lần.** Cách sửa: gộp làm một, hoặc để nguyên (chỉ là comment, migration đã apply).
- **n3 — Task file `:9` có "— —" (gạch ngang bị lặp).** Chỉ là lỗi chữ.

## Residual risk
- Chưa chạy `migrate:down`: reviewer không được phép chạy migration, nên `down` chỉ được review bằng cách đọc SQL.
- Thời gian backfill trên staging/prod chưa được đo. Việc này đã thành điều kiện bắt buộc trước khi promote prod, được ghi ở migration, ERD và task.
- Trailer commit `HIGH_RISK_MIGRATION` cần primary thêm khi commit close-out (thuộc M1 fix (c)).
- Không có browser để đo 375/768/1280. Thay đổi UI chỉ là text.
- Không có integration test DB cho migration. Kết quả backfill đã được kiểm trên DB dev ở round 1.

## Verdict
**PASS**. Cả 5 finding round 1 (M1, m1–m4) đã đóng và không có hồi quy (typecheck sạch, eslint 0 error, 731/731 test PASS). Chỉ còn 3 nit MINOR về comment/chữ, không chặn.
