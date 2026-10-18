Agent: reviewer

# Review: feature-legal-en-edit-requires-reapproval, phase-1-task-01, round 1

- **Review level:** STRICT
- **Reason:** Thay đổi quyết định ẩn/hiện nội dung công khai `/en`; hook ghi `hasEnglish` (trường chỉ admin được ghi) của `pages`; hook dùng chung với luồng duyệt (`guardEnglishApproval`/`approveEnglish`), `detectManualEnglish` và job dịch.
- **Blast radius:** `pages` beforeChange (mọi ghi: admin form, REST PATCH, Local API, bulk update, restoreVersion); `/en` trang privacy/terms, sitemap EN, `/api/locale-counterpart`; lệnh duyệt `POST /api/admin/translations/pages/:id/approve`; job `translate-content` (ghi `pages`); nút `ApproveEnglishButton` trong admin. Không đổi schema, migration hay API shape.

## Diff đã review
- `src/hooks/pages/approve-english.ts`: thêm `englishBeforeAfter` và `revokeEnglishOnManualEdit`
- `src/collections/Pages.ts`: `beforeChange: [revokeEnglishOnManualEdit, guardEnglishApproval]`
- `tests/integration/retranslate.test.ts`: thêm 4 test BR-08
- Spec delta: `SPECIFICATIONS.md` (1.3.0, F12), `docs/BRD.md` (v1.6, BR-08), `spec/CHANGELOG.md`, `spec/updates/2026-10-19-legal-en-edit-requires-reapproval.md`, `spec/test-scope/current.json` (scopeVersion 2)

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm vitest run --project integration` | PASS: 51 file, 698/698 test (gồm 4 test BR-08 mới). Log `revalidateTag ... static generation store missing` là log có sẵn, không phải test fail |
| `pnpm test` | 2428 pass / 1 fail. Fail duy nhất là `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn ... -> 400". Lỗi này có sẵn, phụ thuộc ngày, ngoài scope |
| `pnpm build` | Không chạy lại. Builder báo PASS; diff chỉ đụng hook phía server và typecheck/lint đã PASS. Ghi ở residual risk |

## Phân tích điểm cần soi
1. **Thứ tự hook:** chuỗi hiệu lực là `detectManualEnglish` (content-defaults.ts:166) → `revokeEnglishOnManualEdit` → `guardEnglishApproval`. Hook revoke dùng `data.translation`, tức object `detectManualEnglish` vừa dựng từ `originalDoc.translation` cộng `enSource: manual`. Vì vậy `enSource=manual` được giữ và `status` thành `pending_review`. Test 1 và test 2 assert `{status: pending_review, enSource: manual}`. Sau đó guard gặp `data.hasEnglish = false` nên trả nguyên. Cờ `hasEnglish: true` cũ trong form không bật lại được (test 1 lưu lại form cũ vẫn ra false). OK.
2. **Hai hook dùng cùng tiêu chí:** locale `en` dùng cùng `hasManualEnglishEdit(leavesOfDoc(originalDoc), leavesOfDoc(data), data)` với `detectManualEnglish`. Hai hook luôn cùng kích hoạt hoặc cùng bỏ qua, nên `isFilled` (BL-012) và PATCH một phần (kiểm xoá theo `path[0] in data`) giữ nguyên ngữ nghĩa. OK.
3. **`approveEnglish` afterChange:** hàm này gọi `payload.update` nội bộ với `context.translationJob = true`, nên revoke bỏ qua theo cờ. Ngay cả khi không có cờ thì `{translation}` cũng không tạo leaf EN. Riêng endpoint duyệt chạy khi `originalDoc.hasEnglish = false`, nên revoke dừng ở điều kiện đầu. Test 1 duyệt lại ra `true + done` với đúng 2 audit. OK.
4. **Job dịch:** revoke bỏ qua khi có `TRANSLATION_JOB_CONTEXT_KEY`. Job tự đặt `hasEnglish:false` cho `pages` (`translate-content-save.ts:25`) và không bị ảnh hưởng. Test "sửa bản Việt -> pending_review" có sẵn vẫn PASS. OK.
5. **Locale:** `vi` trả `null`, không hạ (test 4 dùng `saveForm` VI). `en` so `originalDoc` (bản en) với `data`. `all` lấy nhánh `.en` rồi đọc bản `en` đã lưu (`fallbackLocale:false`, `trash:true`). Test 3 kiểm cả trường hợp nhánh en giữ nguyên lẫn nhánh en đổi. OK.
6. **Trường không dịch:** `version` và `effectiveDate` không có trong leaves, nên không hạ duyệt. Test 4 kiểm cả qua Local API lẫn REST. OK.
7. **Cache:** `revalidatePage.afterChange` làm mới đường dẫn vi và en khi trang đang hoặc vừa ở trạng thái `published`. Lần ghi hạ duyệt nằm trong cùng update nên được làm mới. Trang chưa xuất bản thì không công khai, nên không cần làm mới. OK.
8. **Trash:** `guardTrashedEdit` (beforeValidate) chặn sửa trang đã xoá mềm trước khi tới hook. OK.
9. **Admin UI:** sau khi lưu, form nhận lại doc từ server có `hasEnglish=false`, nên `ApproveEnglishButton` (dựa vào `useFormFields hasEnglish`) hiện lại. Đây cùng cơ chế với luồng job dịch đã có. Chưa kiểm bằng browser, ghi ở residual risk.

## Findings
- **[CRITICAL]** Không có.
- **[MAJOR]** Không có.
- **[MINOR] Restore version đi vòng qua revoke**
  - Vị trí: `src/hooks/pages/approve-english.ts:20-21`, hàm `englishBeforeAfter`.
  - Vấn đề: `restoreVersion` của Payload 3.91 vẫn chạy collection beforeChange, nhưng dữ liệu được hoist về defaultLocale `vi` trong khi version lưu đủ mọi locale. Khi admin khôi phục từ locale `vi` một version cũ có `hasEnglish=true` và EN khác bản hiện tại, hook trả `null` nên không hạ duyệt. Mức rủi ro thấp: version có `hasEnglish=true` thường là EN đã duyệt tại thời điểm đó. Ngoại lệ là version cũ có từ trước thay đổi này.
  - Đề xuất: ghi vào residual risk. Nếu muốn chặt hơn, mở task riêng: xét thêm `operation`/restore, hoặc so bản `en` đã lưu với bản sau ghi ở afterChange.
- **[MINOR] Ngày trong bảng thông tin BRD chưa cập nhật**
  - Vị trí: `docs/BRD.md:7`.
  - Vấn đề: dòng "Ngày" vẫn là 16/10/2026 trong khi phiên bản đã lên 1.6 (19/10).
  - Đề xuất: sửa khi close-out.
- **[MINOR] Doc as-built chưa reconcile**
  - Vị trí: `docs/API_SPEC.md`, `docs/ARCHITECTURE.md`.
  - Vấn đề: chưa ghi rằng sửa tay EN của trang đã duyệt sẽ hạ duyệt. Task đã ghi việc này để làm ở close-out. Cần làm trước commit.
  - Đề xuất: reconcile khi close-out.
- **[MINOR] Danh sách file trong test-scope còn là dự kiến**
  - Vị trí: `spec/test-scope/current.json`.
  - Vấn đề: `changed.filesNote` vẫn ghi "dự kiến".
  - Đề xuất: chốt danh sách file khi close-out (khớp với diff hiện tại).

## Responsive Checklist Gate
N/A. Diff không đụng UI (route/component/CSS). Chỉ có hook server, config collection và test.

## Skill gates
| Gate | Kết quả |
|---|---|
| aislop | skip, `aislop` chưa cài |
| oxlint (anti-slop) | skip, oxlint not configured (không có `.oxlintrc.json`); `pnpm lint` (eslint) PASS |
| open-code-review | skip, ocr not installed |
| AI-readable | OK: tên rõ (`revokeEnglishOnManualEdit`, `englishBeforeAfter`); mỗi hàm ≤ 15 dòng; indirection ≤ 2; không có magic number; comment giải thích WHY/quy tắc nghiệp vụ. 0 indicator |
| ai-friendly-web | N/A, thay đổi nằm ở hook admin/server, không phải trang public mới |
| blitzstrike | skip, không có môi trường được phép. Revoke chỉ có thể hạ quyền hiển thị, không leo thang (không cấp `hasEnglish=true`) |

## Surgical diff
Mọi dòng trong diff đều trace về BL-013/BR-08. Không có refactor ngoài scope. Tiêu chí sửa tay EN dùng lại `hasManualEnglishEdit` + `leavesOfDoc`, không viết lại logic so sánh.

## Acceptance
- [x] Sửa EN (title/content) qua form, REST hoặc Local API (en/all) → `hasEnglish=false`, `pending_review` (test 1-3). Ẩn `/en`, sitemap và counterpart theo `hasEnglish` có sẵn.
- [x] Lưu không đổi EN (y nguyên / version / effectiveDate / chỉ VI) → giữ `true` và `done` (test 4).
- [x] Lệnh duyệt duyệt lại được; form cũ không tự duyệt (test 1).
- [x] Job dịch và lệnh duyệt không bị hạ duyệt nhầm (theo cờ context; test có sẵn PASS).
- [x] Có test hồi quy integration.
- [x] lint / typecheck / test / integration PASS (build: theo kết quả builder).

## Residual risk
- `pnpm build` chưa chạy lại trong vòng review này.
- UI admin (nút Duyệt hiện lại sau khi lưu) chưa kiểm bằng browser; suy ra từ cơ chế form reset với doc server trả về.
- Restore version từ locale `vi` (xem MINOR đầu tiên).

## Verdict
PASS (không có CRITICAL/MAJOR). 4 MINOR xử lý ở close-out hoặc task riêng.
