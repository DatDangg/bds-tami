Agent: spec-validator

# Spec validation — feature-home-featured-projects-container (BL-075, MODIFY) · phase 1 · round 1 (pre-build)

- Mode: Spec validation (trước build)
- Inputs: `spec/changes/2026-10-24-home-featured-projects-container.md`, `git diff SPECIFICATIONS.md .context/design-spec.md` (chưa commit), `spec/updates/2026-10-24-home-featured-projects-container.md` (1.58.0 → 1.59.0), `tasks/feature-home-featured-projects-container/phase-1-task-01.md`, code: `src/components/home/FeaturedProjects.tsx`, `src/components/home/ProjectsSlider.tsx`, `src/components/layout/CardSlider.tsx`, `src/components/layout/use-snap-slider.tsx`, `src/components/detail/SimilarCarousel.tsx`, `src/components/layout/CardSlider.test.tsx`, `src/app/(frontend)/globals.css:130-131`, `package.json:56,76`.

## Verdict: ❌ FAIL

Lý do: có 1 conflict HIGH (design-spec khối "As-built BL-044" được khai là GHI ĐÈ S01.3 và vẫn ghi "~5 thẻ/khung 1440") và 4 mục ⚠️ (vượt ngưỡng 3). Hướng kỹ thuật của task (bọc khung như SimilarCarousel + prop opt-in `justify-content: safe center` + ẩn điều khiển khi `pageCount ≤ 1`) **khả thi và không đổi consumer khác**. Các lỗi đều nằm ở chữ trong spec/task, sửa nhanh được. Không có ❌ nào ở phần phủ requirement.

## Ma trận coverage (acceptance change doc ↔ delta ↔ task ↔ khả thi theo code)

| # | Requirement (change doc) | Spec/design delta | Task | Khả thi theo code | Status |
|---|---|---|---|---|---|
| A1 | ≥ lg mép trái/phải vùng thẻ trùng khung `max-w-container` (change doc:25) | SPEC:136 (đoạn BL-075) "≥ lg mép trái/phải vùng thẻ trùng mép khung"; design-spec:313 | Hướng sửa 1 (task:15), Acceptance (task:28) | Có: bọc `div.mx-auto w-full max-w-container` (mẫu `SimilarCarousel.tsx:41`); `ul` đã có `px-gutter` + `scroll-padding-inline` (`CardSlider.tsx:58`) nên mép nội dung thẻ thẳng với tiêu đề (`FeaturedProjects.tsx:26` dùng `max-w-container px-gutter`) | ⚠️ cách đo trong task mâu thuẫn (G3) |
| A2 | Ít hơn một hàng → căn giữa, không mũi tên/điều khiển thừa (change doc:26) | SPEC:136; design-spec:314 | Hướng sửa 2–4 (task:16-18), Acceptance (task:29) | Có: `safe center` căn giữa khi vừa, rơi về `flex-start` khi tràn. `use-snap-slider.tsx:54-56`: vừa một hàng thì `scrollWidth = clientWidth`, `maxScroll = 0`, `pageCount = 1`, nên `CardSlider.tsx:82` ẩn mũi tên + chấm. Số liệu: gutter `clamp(1rem, 0.6rem + 1.7vw, 2rem)` (globals.css:130), ở 1440 gutter = 32, nội dung 1216 ≥ 4×272+3×16 = 1136 nên vừa 4 thẻ; ở 1024 gutter ≈ 27, nội dung ≈ 970, vừa 3 thẻ (864) | ⚠️ điều khiển nháy khi SSR → hydrate (G4) |
| A3 | Đủ một hàng trở lên → slider như cũ, a11y giữ, < md vuốt (change doc:27) | SPEC:136; design-spec:314 | Acceptance (task:30) | Có: khi tràn, `safe` = start, scroll-snap / `scrollTo` theo offset (`use-snap-slider.tsx:53,87`) giữ nguyên; role/aria ở `CardSlider.tsx:52,61-66` không đổi | ✅ |
| A4 | Không vỡ layout 390/768/1024/1440/1920; `/en` = `/vi` (change doc:28) | — (không cần) | Acceptance (task:31), Verification Plan (task:43) | Có: section `overflow-hidden` (`FeaturedProjects.tsx:25`); wrapper không thêm padding | ✅ |
| A5 | design-spec S01.3 bỏ "tràn viền" + ghi quy tắc căn giữa (change doc:29) | design-spec:313-314, :363 | Doc impact (task:25) | — | ❌→ thành conflict HIGH (G1): khối as-built ghi đè :261 chưa sửa |
| A6 | Blast radius `ProjectsSlider` / CardSlider (change doc:33) | SPEC:136 "Chỉ khối này đổi" | task:9-10, 24, 32 | Có: consumer trực tiếp của CardSlider chỉ có 3: `ProjectsSlider.tsx:28`, `ProjectAmenities.tsx:56`, `SimilarCarousel.tsx:42`. Prop opt-in mặc định `false`, nên class/DOM của consumer khác giữ nguyên | ✅ (lệch nhỏ G7) |
| A7 | Test | — | task:32-34 | `CardSlider.test.tsx`, `ProjectsSlider.test.tsx`, `FeaturedProjects.test.tsx` đều có sẵn | ✅ |
| NF | Spec publish / test-scope | `spec/updates/2026-10-24-home-featured-projects-container.md` (1.59.0), `SPECIFICATIONS.md:9`, `spec/test-scope/current.json` v79 dự kiến | — | — | ✅ |

## Gaps / Conflicts

### G1 — [CONFLICT HIGH] Khối "As-built BL-044" của design-spec (được khai là ghi đè S01.3) vẫn ghi ~5 thẻ/khung 1440
- `.context/design-spec.md:256` ghi: "As-built BL-044 … — **GHI ĐÈ bảng/mục bên dưới khi mâu thuẫn**".
- `.context/design-spec.md:261` (cùng khối đó) vẫn ghi: "~5 thẻ/khung 1440 (272px ≥ lg)".
- Delta mới `.context/design-spec.md:314` ghi "vừa 4 thẻ/hàng (trước đây tràn viền ≈ 5)". Theo quy tắc ở :256, dòng :261 thắng :314. Kết quả là design-spec đang yêu cầu ~5 thẻ, ngược với quyết định ở task:52.
- Đề xuất: sửa :261 thành "≥ lg 4 thẻ/khung 1280 (272px), trong `max-w-container`; ít thẻ thì căn giữa (BL-075)", hoặc thêm vào khối as-built một ghi chú "BL-075 thay thế mục 3 về khung/số thẻ". Đồng thời rà :261 để không còn chỗ nào mâu thuẫn với "tràn viền"/"trong khung".

### G2 — [CONFLICT MEDIUM, ⚠️] SPECIFICATIONS bullet Dự án nổi bật tự mâu thuẫn
- `SPECIFICATIONS.md:136` (phần BL-044 còn giữ): "**Thẻ** (≈ 5 thẻ/khung 1440, rộng ~272px ≥ lg, 82% < sm)". Cùng bullet đó, phần BL-075 mới đặt vùng thẻ vào `max-w-container`, trong khung này chỉ vừa 4 thẻ.
- Đề xuất: đổi thành "(≥ lg rộng ~272px, khung 1280 vừa 4 thẻ — BL-075; 82% < sm)". Đây là intent doc, sửa qua chính change-request này (user đã duyệt yêu cầu bỏ tràn viền; số thẻ là hệ quả đã ghi ở task:52). Nếu cần user xác nhận riêng "4 thay vì 5" thì hỏi ở checkpoint duyệt plan.
- Phụ (LOW, không chặn): comment `src/components/layout/CardSlider.tsx:29` "~5 thẻ/khung desktop" và `FeaturedProjects.tsx:19` "slider tràn viền". Builder sửa comment FeaturedProjects (task:15 đã có); comment CardSlider nên chỉnh thành "≈ 4–5 thẻ tuỳ khung" khi thêm prop.

### G3 — [CONTRADICTION MEDIUM, ⚠️] Acceptance task:28 không đo được khi đang căn giữa, và lệch mép phải khi đang tràn
- `tasks/.../phase-1-task-01.md:28`: "≥ lg (1024 / 1440 / 1920): **mép trái thẻ đầu** và mép phải vùng thẻ trùng mép nội dung khung … ±1px". `task:29` lại yêu cầu 3 dự án ở ≥ lg **căn giữa**. Khi căn giữa thì thẻ đầu không thể nằm ở mép nội dung, nên hai acceptance loại trừ nhau với dữ liệu prod (3 dự án).
- Trường hợp tràn (6 dự án ở 1440): `ul` có `overflow-x: auto` nên thẻ bị cắt ở mép padding-box của `ul` (= mép ngoài `max-w-container`), không phải mép nội dung (trong 32px). Vì vậy ở scroll 0, "mép phải vùng thẻ" lệch mép nội dung khoảng 32px. Hành vi này giống `SimilarCarousel` và chấp nhận được, nhưng acceptance ±1px như đang viết sẽ FAIL.
- Liên quan: `.context/design-spec.md:313` ghi vô điều kiện "thẻ đầu/cuối thẳng mép `px-gutter`", mâu thuẫn với :314 (căn giữa khi ít thẻ).
- Đề xuất viết lại:
  - (a) ≥ lg: rect của `ul` (vùng cuộn) trùng rect `max-w-container` của đầu khối / Về TAMI (±1px).
  - (b) Khi tràn: mép trái thẻ đầu (scroll 0) = mép nội dung khung (rect container + gutter, ±1px); cuộn hết thì mép phải thẻ cuối = mép nội dung.
  - (c) Khi vừa một hàng: khoảng trống trái ≈ phải (±1px), không mũi tên/chấm.
  - design-spec:313 thêm "khi tràn" vào cụm "thẻ đầu/cuối thẳng mép".

### G4 — [EDGE CASE, ⚠️] Điều khiển nháy SSR → hydrate trong trường hợp ít thẻ
- `use-snap-slider.tsx:25`: chưa đo thì `pageCount = count`. SSR / lần render đầu với 3 dự án vẽ 3 chấm + 2 mũi tên (`CardSlider.tsx:82-104`, hàng `mt-6` + 44px). Sau `measure()` (useEffect) chúng mới bị ẩn, làm nút "Xem tất cả" và khối dưới dịch lên khoảng 68px. Không có JS thì điều khiển thừa hiện mãi.
- Lỗi này đã có từ trước (prod 1880px tràn viền với 3 thẻ cũng `pageCount = 1`), không do BL-075 sinh ra. Nhưng lý do "không nháy/CLS" ở task:16,51 chỉ đúng cho phần căn giữa. Acceptance change doc:26 "không hiện điều khiển thừa" chỉ đạt sau hydrate.
- Đề xuất: ghi rõ vào task là residual risk / ngoài phạm vi (khối thường nằm dưới màn đầu nên CLS thấp), **hoặc** nếu user muốn chặt thì builder ẩn hàng điều khiển cho tới khi đo xong (`measuredPages === null` thì `invisible`/`hidden` có giữ chỗ). Cách này chạm CardSlider dùng chung nên phải để opt-in và ghi Decision log. Không tự mở rộng scope khi chưa chốt.

### G5 — [NON-FUNCTIONAL, ⚠️] Hỗ trợ trình duyệt cho `safe`
- `safe` trong flex layout: Chrome/Edge ≥ 115, Firefox ≥ 63, Safari mới. Tailwind đang cài `^4.3.3` (`package.json:76`), có utility `justify-center-safe` (từ v4.1).
- Trình duyệt không hiểu `safe` sẽ bỏ cả khai báo và rơi về `flex-start` (căn trái). Đây là xuống cấp an toàn: không cắt thẻ, không mất cuộn như `center` thường. Đề xuất builder ghi rõ fallback này vào Decision log và **cấm** dùng `justify-center` thường làm fallback (với scroll container sẽ làm thẻ đầu không cuộn tới được).

### G6 — [OK, ghi nhận] `docs/DESIGN.md:292` "slider/hero tràn viền"
- Là as-built, task:25 đã hẹn reconcile ở close-out ("hero tràn viền; slider dự án nổi bật trong khung"). Không chặn build.

### G7 — [LOW] Danh sách consumer trong task chưa chính xác
- task:10, 24 liệt kê `RelatedPosts`, `SimilarRentals`, `ProjectDetail` như consumer của CardSlider. Grep `<CardSlider` chỉ ra 3 chỗ dùng trực tiếp: `ProjectsSlider.tsx:28`, `ProjectAmenities.tsx:56`, `SimilarCarousel.tsx:42`. Các khối còn lại dùng gián tiếp qua SimilarCarousel. Không ảnh hưởng hướng sửa (opt-in), chỉ cần chỉnh lại cho reviewer đo đúng blast radius.

## Kiểm hướng sửa (khả thi, không đổi consumer khác)
- Bọc khung không thêm `px-gutter`: đúng. Thêm `px-gutter` ở wrapper sẽ đệm đôi với `CardSlider.tsx:58`. Hàng chấm (`CardSlider.tsx:83`) đã có `max-w-container px-gutter` nên vẫn đúng vị trí trong wrapper.
- `safe center` + `pageCount` khớp nhau vì cùng một điều kiện (`scrollWidth ≤ clientWidth`). Thẻ đều 272px nên không có trường hợp sát 1px ở các breakpoint chuẩn (dư ≥ 80px ở 1440, ≈ 106px ở 1024 với 3 thẻ). Việc builder kiểm lệch 1px (task:18) vẫn nên giữ.
- Ảnh hưởng tới `ProjectAmenities` (`ProjectAmenities.tsx:55` đặt lại `--spacing-gutter`) và `SimilarCarousel`: không có, vì prop mặc định `false`.
- Quy tắc BL-038 (SPEC:136, `CardSlider.tsx:39`, chỉ hiện điều khiển khi `pageCount > 1`): giữ nguyên, không mâu thuẫn.

## Việc cần làm trước khi build (cho change-request)
1. G1: sửa `.context/design-spec.md:261`.
2. G2: sửa `SPECIFICATIONS.md:136` "≈ 5 thẻ/khung 1440".
3. G3: viết lại `tasks/.../phase-1-task-01.md:28-29` theo (a)/(b)/(c); thêm "khi tràn" vào design-spec:313.
4. G4: ghi residual risk hoặc chốt với user có ẩn điều khiển trước khi đo hay không.
5. G5: ghi fallback `safe` vào task (Decision log / ràng buộc cho builder).
6. G7 (tuỳ chọn): sửa danh sách consumer.

Sau khi sửa 1–5 thì chạy lại spec-validator (round 2). Dự kiến PASS vì không còn gap phủ requirement.
