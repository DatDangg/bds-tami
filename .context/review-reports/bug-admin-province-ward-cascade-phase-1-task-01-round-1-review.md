Agent: reviewer

# Review — bug-admin-province-ward-cascade · phase-1-task-01 · round 1 (BL-077)

- Review level: **STRICT**
- Reason: shared field + validator server dùng chung 3 collection (Projects, Rentals, PropertyPosts), shared admin component mới, đổi thứ tự validate (đường chặn API/seed).
- Blast radius: admin create/edit Dự án / Cho thuê / Tin BĐS (ô Phường/xã); REST/Local API create/update 3 collection qua `validateWardInProvince` / `validateWardWithOptionalProvince`; admin `importMap.js`. Không đổi schema/DB (chỉ `admin.components.Field` + logic validate) → không cần migration. 3 collection không bật `versions`/drafts/autosave → rủi ro version-restore/autosave N/A.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 (không output lỗi) |
| `pnpm test` | 454 files / 4760 tests PASS (272s) |
| `E2E_BASE_URL=http://localhost:3100 pnpm exec playwright test tests/e2e/admin/location-ward.spec.ts --project=admin-content` | 11 passed (2 setup + 3 test × 3 collection) |

## Responsive Checklist Gate
N/A — chỉ Payload admin field component (dùng lại `RelationshipInput` của Payload, không CSS/layout mới); không đụng UI public.

## Skill gates
- aislop: skip, `aislop` không cài.
- oxlint (anti-slop): skip, oxlint not configured (eslint toàn repo PASS).
- ocr: skip, ocr not installed.
- AI-readable: OK — tên rõ (`provincePathOf`, `wardFilterForProvince`, `shouldResetWard`), hàm < 50 dòng (WardField ~60 dòng gồm JSX props — chấp nhận, 1 component), file < 100 dòng, comment nêu WHY. 0–1 indicator.
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: skip (không phải auth/public input mới).

## Kiểm tra trọng tâm
1. **Validator** (`src/fields/ward-in-province.ts:22-39`): có ward + province → findByID trước, trả câu tiếng Việt (không id) cho sai tỉnh / không tồn tại; sau đó `relationship()` mặc định vẫn chạy (required, existence, filterOptions — đến đây ward đã thuộc tỉnh nên filterOptions pass). Thiếu ward → không tra DB, required vẫn báo. `validateWardWithOptionalProvince` gọi lại hàm này nên hưởng thứ tự mới. Field single, không hasMany → OK.
2. **WardField** so với `@payloadcms/ui@3.91.0/dist/fields/Relationship/index.js`: giữ label/required/description/Description/Error/Label/BeforeInput/AfterInput/readOnly||disabled/allowCreate/allowEdit/isSortable/localized/placeholder/className/maxResultsPerRequest/formatDisplayedOptions/showError; `memoizedValidate` + `handleChange` (`setValue(v, disableModifyingForm)`) tương đương `handleChangeSingle` non-polymorphic. `Input.js` tự import `index.scss`. Thiếu: `withCondition`, `style` (mergeFieldStyles: admin.width/style), `sortOptions`, `appearance` cấu hình — hiện cả 3 field đều không khai các thuộc tính này → không mất hành vi hiện tại (xem MINOR-1).
   Reset: `useRef(provinceId)` khởi tạo bằng tỉnh của form state ban đầu (Payload dựng form state server trước render) → nạp bản ghi không xoá; null→A không xoá; A→B / A→null xoá. Province không localized → đổi locale không đổi id. Không có code nào khác tự set province/ward ở client (grep `src/components/admin`). `provincePathOf` thay hậu tố `ward` → đúng với 3 collection (ward/province cùng `formRow` trong tab không tên → path phẳng `ward`/`province`).
3. **Collections**: chỉ thêm `admin: { components: { Field: WARD_FIELD_COMPONENT } }`; `formRow` không gán `admin` nên không bị ghi đè. importMap +1 import +1 entry đúng key `/components/admin/WardField#WardField`.
4. **Test**: unit validator 7 test (thứ tự, không UUID, required, sửa riêng tỉnh, optional province); helper component 3 test. E2E 11/11 PASS.

## Findings
- [MINOR-1] `src/components/admin/WardField.tsx:34-35,70,92` — không bọc `withCondition`, `style={undefined}` thay vì `mergeFieldStyles(field)`, bỏ `sortOptions`, hard-code `appearance="select"`. Hiện không field nào dùng → không lỗi, nhưng nếu sau này thêm `admin.width/condition/sortOptions/appearance` cho ô ward sẽ bị lờ đi im lặng. Đề xuất: bọc `withCondition` (export từ `@payloadcms/ui`), truyền `style`/`sortOptions`/`appearance` từ `field.admin` như field mặc định, hoặc ghi chú giới hạn.
- [MINOR-2] `src/fields/ward-in-province.ts:38` + `:46` — PropertyPosts: ward **không tồn tại** mà **không có province** (chỉ qua API) → `relationship()` mặc định vẫn trả câu "invalid selection: <id>" trước câu "Chọn tỉnh/thành trước…". Đường hiếm, không thuộc acceptance (acceptance là sai tỉnh). Đề xuất (tuỳ chọn): trong `validateWardWithOptionalProvince` kiểm `wardId && !provinceId` trước khi gọi `validateWardInProvince`.
- [MINOR-3] `src/components/admin/WardField.test.tsx` — chỉ test hàm thuần; hành vi "không xoá khi nạp bản ghi" (useRef khởi tạo) chỉ được chứng minh bằng probe e2e tạm đã xoá (change-request) + lập luận code. E2E test 1/3 pass yếu (ghi nhận trong brief). Đề xuất task riêng: bổ sung assertion e2e mở bản ghi có ward → ward giữ nguyên, và test 1 chờ danh sách tải xong rồi assert non-empty.
- [MINOR-4] Residual (đã ghi Decision log): điều hướng giữa 2 bản ghi mà component không remount có thể coi đổi tỉnh do nạp là người dùng đổi → xoá ward. Payload remount theo doc id; không kiểm chứng tự động.

Không có CRITICAL/MAJOR.

## Residual risk
- Không có probe e2e lưu lại cho kịch bản "mở bản ghi có sẵn giữ ward" (MINOR-3/4).

## Verdict
✅ **PASS**
