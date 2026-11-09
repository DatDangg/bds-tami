Agent: spec-validator

# Spec validation — feature-homepage-partners-block (BL-107, FR-PUB-17) — pre-plan, round 1

- Mode: Spec validation (trước khi builder chạy task)
- Delta: `SPECIFICATIONS.md:152` (working tree, chưa commit)
- Nguồn yêu cầu: `spec/changes/2026-11-05-homepage-partners-block-missing.md:22-23` (Quyết định user 2026-11-09), `docs/BRD.md:153` FR-PUB-17
- Task: `tasks/feature-homepage-partners-block/phase-1-task-01.md`
- Đối chiếu thêm: `SPECIFICATIONS.md:131-156` (F1), `SPECIFICATIONS.md:235,238` (BL-021, BL-065), `docs/BRD.md:192` (BR-07), `.context/design-spec.md:257,276,334-336,359-362`, `docs/ERD.md:243,736,738`, `docs/DESIGN.md:322`, `src/collections/Developers.ts`, `src/globals/Homepage.ts:225-226`, `src/collections/_shared/content-defaults.ts:63-65,216`

## Verdict: FAIL

Lý do: 1 conflict HIGH (C1) và 4 mục ⚠️ (G1–G4). Hai luật FAIL đều chạm: có conflict HIGH, và có từ 3 ⚠️ trở lên. Không có ❌ (mọi ý trong quyết định của user đều đã có trong delta). Các mục cần sửa đều nằm ở câu chữ của delta và task, chưa cần hỏi user lại, trừ C2 và G2 (xem từng mục).

## Ma trận coverage (quyết định user ↔ delta ↔ task)

| Yêu cầu | Nguồn | Delta `SPECIFICATIONS.md:152` | Task | Trạng thái | Ghi chú |
|---|---|---|---|---|---|
| Hiện khối Đối tác: logo + tên | change doc:11,23 | "logo … + tên đối tác; thiếu logo → chỉ tên" | Thiết kế 2-3, AC1 | ✅ | Trái design-spec §6 "chỉ logo" (C1) |
| Dải logo chạy ngang tự động (marquee) | change doc:23 | "dải logo chạy ngang tự động (marquee)" | Thiết kế 3, AC3 | ✅ | Trái design-spec:336 "Không marquee" (C1) |
| Đúng thứ tự `blockOrder` + bật/tắt | change doc:23 | "theo `blockOrder` / `partners.enabled`" | AC1, AC2 | ✅ | Khớp BL-044 `SPECIFICATIONS.md:141` |
| `prefers-reduced-motion` thì dừng | change doc:23 | "reduce → không chạy (dải tĩnh, cuộn ngang được / xuống dòng)" | AC3 | ✅ | |
| Dừng khi hover/focus | change doc:23 | "Dừng chạy khi hover hoặc focus bàn phím" | Thiết kế 3, AC3 | ✅ | Chưa nói gì về người dùng màn cảm ứng (G2) |
| Ẩn khối khi không có đối tác | change doc:23 | "ẩn cả khối" | AC2 | ✅ | |
| Responsive 390/768/1440 | change doc:23 | "không tràn ngang trang" | AC6 | ✅ | |
| Bản EN của tiêu đề | change doc:23 | `partners.title` localized, trống thì i18n "Đối tác"/"Partners" | AC5 | ✅ | |
| Tên đối tác ở `/en` dùng bản VI khi thiếu EN | — (không có trong quyết định) | có | Thiết kế 1, AC8 | ⚠️ | Thêm ngoài quyết định, trái BR-07 (C2) |
| Mục đối tác không phải link | — | "không là link (chưa có quyết định)" | — | ⚠️ | Trái design-spec:335 (C1) |
| Nguồn `developers.showAsPartner`, sắp `sortOrder` rồi tên | ERD:243, Homepage.ts:225 | có | Thiết kế 1 | ✅ | |
| Không đổi schema/migration/API/quyền | — | có | Classification | ✅ | Đúng: các field đều đã có (`Developers.ts:37-48`, `Homepage.ts:226`) |
| Cache/revalidate khi sửa developer | (F1:156 làm mẫu cho rentals/news) | **không có** | Thiết kế 1, AC7 | ⚠️ | G1 |
| Giới hạn số đối tác | — | không có | "vd 24" | ⚠️ | G4 (nhẹ) |
| Ít đối tác, không đủ lấp chiều rộng dải | — | không có | không có | ⚠️ | G3 |
| Không CLS, ảnh lazy | NFR CWV | "ảnh tối ưu, kích thước đồng đều" | Thiết kế 3, AC6 | ✅ | |
| Trình đọc màn hình / Tab chỉ gặp mỗi đối tác 1 lần | — | có (bản nhân đôi `aria-hidden` + không focus) | AC4 | ✅ | Kiểm được bằng test component |

## Conflicts

### C1 — HIGH: delta trái `.context/design-spec.md` §S01 khối 6 mà không ghi là thay thế
Thiết kế đã chốt cho khối này ở `.context/design-spec.md:334-336` (và bảng `:276`, breakpoint `:359-362`):
- "Lưới logo **chỉ logo** (không chữ dưới logo) … grayscale + opacity 0.7, hover/focus về màu gốc"
- "Logo có link `website` (tab mới) nếu có, `alt` = tên chủ đầu tư"
- "< sm 2 cột · sm 3 · md 4 · lg 6. **Không marquee**."

Code cũng đã được viết theo hướng có link: `src/collections/Developers.ts:8` ghi "khối đối tác render giá trị này thành liên kết" (lý do validate `website` chỉ nhận http(s)).

Delta `SPECIFICATIONS.md:152`:
- marquee, có tên kèm logo: user đã quyết rõ, nên được phép thay design-spec. Tuy vậy delta **không ghi** là thay mục nào, khác với BL-044 (`SPECIFICATIONS.md:134` ghi "thay các điểm bố cục tương ứng của BL-020").
- "Mục đối tác không là link (**chưa có quyết định**)" là câu sai sự thật: design-spec đã có quyết định (link `website`, tab mới). Delta bỏ một hành vi đã được đặc tả mà không có quyết định của user, tức là thêm yêu cầu ngoài phạm vi.
- grayscale/opacity, nền `--color-bg`, tiêu đề `--text-h2` căn giữa: delta không nói giữ hay bỏ. Builder sẽ không biết nên theo design-spec hay không.

Hậu quả: builder và reviewer đọc hai nguồn mâu thuẫn nhau, nên reviewer có thể FAIL vì "thiếu link website" hoặc "có marquee".

### C2 — MEDIUM: luật lấy tên VI cho `/en` thêm ngoài quyết định và trái BR-07
Câu trong delta: "`/en`: tên đối tác là tên riêng — dùng bản EN nếu có, thiếu thì bản VI (không ẩn đối tác vì thiếu EN)".
- `docs/BRD.md:192` BR-07 (intent): nội dung chưa có bản EN thì "**không** hiện ở `/en` (không lấy chữ tiếng Việt thay vào)". Chủ đầu tư là collection nội dung có `hasEnglish` (`Developers.ts:53` `englishRequiredFields: ["name","slug"]`, qua `withContentDefaults`).
- `SPECIFICATIONS.md:235` (BL-021): đọc `locale=en` "không fallback".
- Ngoại lệ "tên riêng" hiện chỉ có cho **địa chỉ / tỉnh / phường** (`SPECIFICATIONS.md:238` BL-065, `project-queries.ts:68`); không có ngoại lệ cho chủ đầu tư. Chi tiết dự án ở `/en` đọc `developer.name` theo locale và trả `null` khi thiếu (`src/lib/projects/project-detail-view.ts:238`). Vậy nếu giữ fallback thì khối Đối tác sẽ hành xử khác trang chi tiết dự án.
- Quyết định của user chỉ nói "bản EN **tiêu đề**", không nói gì về tên đối tác.

Đây là thay đổi luật intent mà user chưa duyệt.

## Gaps

- **G1 [PARTIAL] ⚠️ Cache/revalidate khi sửa chủ đầu tư.** Delta không nói gì. `Developers` khai `route: null` (`Developers.ts:54`), mà theo `content-defaults.ts:63-65,216` thì `route: null` nghĩa là **không có hook revalidate**. Hiện tại bật/tắt `showAsPartner` hoặc đổi logo/tên/`sortOrder` sẽ không làm mới trang chủ. Task AC7 cho hai lựa chọn ("revalidate hoặc ghi rõ ISR"), và task cấm sửa `src/lib/revalidate/internal-revalidate.ts` (file đang bẩn). Spec cần chốt hành vi để kiểm được. F1 `:156` đã có mẫu cho rentals/news.
- **G2 [PARTIAL] ⚠️ WCAG 2.2.2 (Pause, Stop, Hide) trên màn cảm ứng.** Dải chạy liên tục quá 5 giây. Hover/focus không có trên mobile 390 khi không dùng bàn phím, và reduced-motion chỉ giúp người đã bật tuỳ chọn hệ thống. Spec đã có tiền lệ cho hero: nút Dừng/Phát "(WCAG 2.2.2)" (`SPECIFICATIONS.md:135`). Delta và task chưa nói marquee có cần cơ chế dừng riêng hay không. Không tự thêm yêu cầu; cần primary hoặc user chốt.
- **G3 [MISSING] ⚠️ Trường hợp ít đối tác.** Khi tổng chiều rộng các mục nhỏ hơn khung (ví dụ 1–3 đối tác ở 1440), marquee lặp sẽ có khoảng trống hoặc nhân bản lộ rõ. Spec chưa nêu hành vi (đứng yên căn giữa, hay lặp tới khi đủ rộng).
- **G4 [PARTIAL] ⚠️ (nhẹ) Giới hạn số đối tác.** Task tự đặt "vd 24", spec không có. Nên chốt trong spec (hoặc ghi "tất cả, tối đa N") để AC kiểm được.

## Ghi chú (không chặn)

- N1: Delta ghi "MINOR 1.63.0" nhưng header vẫn là `spec_version: 1.62.6` (`SPECIFICATIONS.md:9`). Đúng thứ tự nếu spec-publisher chạy sau; chỉ cần kiểm lại ở bước publish.
- N2: Không mâu thuẫn với BL-044 `:141`. `partners` vẫn nằm ngoài `blockOrder` mặc định (`docs/ERD.md:738`, `docs/DESIGN.md:322`, design-spec:257), và bản ghi đang có không tự migrate. Tuy vậy, bản ghi staging/prod nào đang có `partners` trong "Thứ tự khối" với `enabled` = true sẽ **tự hiện khối ngay sau deploy** (trước đó bị bỏ qua). Nên ghi một câu cho rõ để phần vận hành biết.
- N3: Doc impact (task tự ghi). `.context/design-spec.md:276,334-336,359-362` phải reconcile theo C1. `docs/DESIGN.md:322` nên thêm mô tả khối. `src/collections/Developers.ts:8` có comment "render thành liên kết" cần khớp với quyết định link.
- N4: Các AC trong task đều kiểm được bằng test hoặc ảnh, trừ AC7 (vì hai lựa chọn mở, xem G1) và AC3 về pause trên cảm ứng (xem G2).

## Đề xuất sửa câu chữ (delta `SPECIFICATIONS.md:152`)

1. **(C1)** Thêm vào đầu gạch đầu dòng: "*Thay thiết kế khối 6 trong `.context/design-spec.md` S01 (lưới logo, chỉ logo, không marquee); các điểm khác giữ: tiêu đề `SectionHeading` `--text-h2` căn giữa, nền `--color-bg`, `alt` = tên chủ đầu tư; grayscale/opacity: [giữ | bỏ].*"
   Thay câu "Mục đối tác không là link (chưa có quyết định)" bằng **một** trong hai câu sau:
   - (a) giữ thiết kế đã chốt: "Mục có `website` hợp lệ là link mở tab mới (`rel="noopener"`); bản nhân đôi không focus được"; hoặc
   - (b) bỏ link: "Mục đối tác không là link (BL-107 bỏ link `website` của design-spec S01 khối 6)". Phương án (b) cần user xác nhận vì bỏ một hành vi đã đặc tả.
2. **(C2)** Chọn một:
   - (a) theo BR-07: "`/en`: chỉ hiện đối tác có tên EN (`hasEnglish`), không lấy tên VI thay vào; không còn đối tác nào → ẩn khối"; hoặc
   - (b) giữ fallback nhưng ghi rõ "ngoại lệ BR-07 cho tên chủ đầu tư trên khối Đối tác (tên riêng, như BL-065)" **và cần user duyệt**, kèm ghi chú lệch với trang chi tiết dự án.
3. **(G1)** Thêm: "Lưu / xoá / khôi phục chủ đầu tư có hoặc vừa bỏ `showAsPartner` làm mới trang chủ `/vi` `/en` (không làm mới toàn site), như quy tắc ở `:156`." Hoặc nếu không làm: "Không có revalidate; trang chủ cập nhật sau ISR `<N>` giây". Nếu chọn revalidate mà phải sửa `internal-revalidate.ts` (đang bẩn) thì task phải ghi rõ cách xử lý.
4. **(G2)** Ghi quyết định: "[có nút Dừng/Phát như hero (WCAG 2.2.2) | chỉ dừng khi hover/focus + reduced-motion — chấp nhận rủi ro trên cảm ứng]".
5. **(G3)** Thêm: "Danh sách không đủ lấp chiều rộng dải → không chạy, căn giữa (không nhân đôi)", hoặc hành vi khác mà primary/user chọn.
6. **(G4)** Thêm: "Hiện tối đa `<N>` đối tác đầu tiên theo thứ tự" (hoặc ghi "tất cả").

Validate lại (round 2) sau khi sửa delta và task.
