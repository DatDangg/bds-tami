Agent: spec-validator

# Spec validation — feature-home-featured-projects-container (BL-075, MODIFY) · phase 1 · round 2 (pre-build)

- Mode: Spec validation (trước build), kiểm lại sau round 1 FAIL (`.context/review-reports/spec-validation-feature-home-featured-projects-container-phase-1.md`).
- Inputs: `git diff SPECIFICATIONS.md .context/design-spec.md` (chưa commit), `tasks/feature-home-featured-projects-container/phase-1-task-01.md` (bản sửa), change doc `spec/changes/2026-10-24-home-featured-projects-container.md`. Code tham chiếu giữ nguyên như round 1.

## Verdict: ✅ PASS

Không còn ❌ hay conflict HIGH. Chỉ còn 1 mục LOW, là chữ cosmetic, không chặn build.

## Kiểm từng gap của round 1

| Gap | Round 1 | Bằng chứng round 2 | Status |
|---|---|---|---|
| G1 HIGH: khối as-built BL-044 ghi "~5 thẻ/khung 1440" | `.context/design-spec.md:261` | `:261` nay ghi "thẻ 272px ≥ lg trong khung `max-w-container` — khung 1280 vừa 4 thẻ/hàng (*BL-075 thay "~5 thẻ/khung 1440" tràn viền*; ít thẻ hơn một hàng → căn giữa…)". Khối ghi đè (`:256`) đã khớp S01.3 (`:313-314`) | ✅ Resolved |
| G2 MEDIUM: SPEC "≈ 5 thẻ/khung 1440" | `SPECIFICATIONS.md:136` | `:136` "khung 1280 vừa 4 thẻ/hàng — BL-075 thay…". Comment `CardSlider.tsx:29` đã thành acceptance ở task:35 | ✅ Resolved |
| G3 MEDIUM: acceptance đo mâu thuẫn (căn giữa với thẻ đầu thẳng mép; mép phải khi tràn) | task:28-29, design-spec:313 | task:28-31 tách (a) rect `ul` = khung, (b) khi tràn và scrollLeft = 0 thì thẻ đầu = mép nội dung, (c) khi vừa một hàng thì hai bên trống bằng nhau. design-spec:313 có "khi tràn (slider), thẻ đầu…". SPEC:136 có "vùng cuộn trùng khung…; khi tràn, thẻ đầu…". Ba nguồn nhất quán | ✅ Resolved |
| G4: điều khiển nháy SSR → hydrate | `use-snap-slider.tsx:25` | Đã ghi residual (có từ trước, BL-038) ở design-spec:314 và task:49-50 (ngoài phạm vi, builder không mở rộng). task:32 đổi thành "sau hydrate không mũi tên / chấm", khớp hành vi thực | ✅ Accepted residual |
| G5: fallback `safe` | task:16 | task:16 cấm `justify-center` thường (kể cả làm fallback), dùng `justify-center-safe`, builder xác minh CSS sinh ra; trình duyệt không hỗ trợ thì căn trái. Đã ghi ở design-spec:314 và SPEC:136 | ✅ Resolved |
| G6: `docs/DESIGN.md:292` | close-out | Giữ nguyên kế hoạch reconcile as-built (task:25) | ✅ |
| G7 LOW: danh sách consumer | task:10 | task:10 đã sửa đúng: 3 chỗ dùng trực tiếp, còn lại đi qua SimilarCarousel | ✅ (xem L1) |

## Ma trận coverage (acceptance change doc ↔ delta ↔ task)

| Acceptance change doc | Spec / design | Task | Status |
|---|---|---|---|
| :25 ≥ lg vùng thẻ trùng khung | SPEC:136, design-spec:313 | task:28-31 (a)(b)(c) | ✅ |
| :26 ít thẻ thì căn giữa, không điều khiển | SPEC:136, design-spec:261/:314 | task:16, 18, 32 (+ residual task:50) | ✅ |
| :27 nhiều thẻ thì slider như cũ, a11y, vuốt < md | SPEC:136, design-spec:314 | task:33 | ✅ |
| :28 390–1920 không vỡ, `/en` = `/vi` | — | task:34, 46 | ✅ |
| :29 design-spec S01.3 cập nhật | design-spec:261, :313-314, :363 | task:25 | ✅ |
| :33 blast radius | SPEC:136 "chỉ khối này đổi" | task:10, 16, 24, 35-36 (prop opt-in mặc định tắt, có test mặc định) | ✅ |

## Còn lại (không chặn)
- **L1 [LOW, cosmetic]:** task:16 và task:56 vẫn ghi "4 consumer khác", trong khi task:10 đã ghi đúng 2 consumer trực tiếp còn lại (`SimilarCarousel`, `ProjectAmenities`). task:24 vẫn liệt kê `RelatedPosts` / `SimilarRentals` trong blast radius; hai khối này đi qua SimilarCarousel nên vẫn đúng về phạm vi kiểm. Không ảnh hưởng hướng sửa, sửa khi tiện.

## Kết luận
Spec delta, design-spec và task đã nhất quán và phủ đủ acceptance của change doc. Hướng sửa khả thi theo code: bọc khung theo mẫu `SimilarCarousel.tsx:41`, prop opt-in `justify-center-safe`, ẩn điều khiển khi `pageCount ≤ 1` (`CardSlider.tsx:82`). Mặc định của CardSlider không đổi. Có thể sang checkpoint duyệt plan / builder.
