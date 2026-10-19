Agent: reviewer

> Ghi bởi primary (change-request) — guard chặn reviewer ghi vào worktree. Nội dung theo báo cáo reviewer.

# Review: feature-public-ui-market-vinhomes · phase-5-task-02 · round 1

## Review level
**STRICT** — SEO JSON-LD (`FAQPage`), 2 component dùng chung (`LazyMap` prop `markers`, `RentalCard` prop `imageSizes`), view model + section id chi tiết dự án, config collection Payload.

## Blast radius
- `LazyMap` (cho thuê + dự án): `markers` mặc định `[]`, chỉ vẽ khi không `approximate` → caller khác không đổi.
- `RentalCard`: thiếu `imageSizes` → `sizes` cũ (`RentalCard.tsx:33`).
- `json-ld.ts`: chỉ thêm hàm mới.
- `market-blocks.ts`: bỏ `Cell` admin của trường giá trong mảng — không đổi schema (`migrate:create --skip-empty` không sinh file); `importMap.js` chỉ line ending; `VndCell` vẫn dùng ở `Rentals.ts:177`.
- `/du-an/[slug]` + `/en`: thứ tự menu neo đổi, Tài liệu vào trong Pháp lý, mục Pháp lý hiện khi chỉ có tài liệu.

## Verify
| Command | Result |
|---|---|
| `pnpm lint` | 0 error (2 warning ngoài diff) |
| `pnpm typecheck` | PASS |
| `pnpm test src/components/projects src/lib/projects src/lib/seo src/components/media src/components/rentals src/collections tests/integration/projects.test.ts` | 30 files / 369 tests PASS (log có invariant `revalidateTag` ngoài ngữ cảnh Next — chỉ log) |
| build / full test | builder: build PASS, 289 files / 3050 PASS |
| Trình duyệt (primary, dev :3001, dữ liệu mẫu 1 dự án) | 1280: menu neo "Tổng quan\|Nổi bật\|Vị trí\|Tiện ích\|Giá\|Thư viện\|Hỏi đáp", active "Giá" khi cuộn tới bảng giá, JSON-LD BreadcrumbList,FAQPage,RealEstateListing, 3 tab, 1 `#lead-form`; 375 không cuộn ngang, bảng giá cuộn trong (341/640) |

## Kiểm yêu cầu
- Khối ẩn khi trống: `visibleSections` + điều kiện render cùng cờ; Pháp lý hiện khi có richText hoặc tài liệu; Vị trí khi có toạ độ/địa chỉ/tiện ích quanh; có test.
- JSON-LD: `FAQPage` → `mainEntity[]` `Question{name, acceptedAnswer: Answer{text}}`, `inLanguage` hợp lệ; qua `JsonLd`/`serializeJsonLd` escape `<` (test `</script>`); đúng 1 `FAQPage`/trang, không có khi trống; cùng `view.faqs` với accordion hiển thị.
- `/en` không lẫn tiếng Việt: `payload.config.ts:103` `fallback: false`; `toFaqs`/`toHighlights`/`toNearby`/`toPriceRows` bỏ hàng chữ rỗng (có test).
- Carry-over: P4-T02 MINOR-2 `imageSizes` (test), P5-T01 MINOR-2 bỏ `vndRange`, MINOR-4 `areaTo: -1`/`priceTo: -1` → 400 (integration).
- Popup bản đồ: `Popup.setText` + `setAttribute("aria-label")` → chữ CMS không thành HTML. `markersKey` chống mount lại.
- Tablist: role đủ, `aria-controls`/`aria-labelledby`, roving tabindex, ←/→ vòng, Home/End; HTML server có mọi panel (`hidden`); 1 nhóm không tablist.
- Bảng giá: `caption` sr-only, `th scope="col"`, `th scope="row"` loại căn; vùng cuộn có tên + `tabIndex=0`; "Liên hệ", "Từ X"/"Đến X", bằng nhau hiện 1 giá trị.
- Badge AA: warning `#8a5a0a`/`#fbf1e0` ≈ 5.3:1; error `#b42318`/`#fbeae8` ≈ 5.6:1; success token `success-text`.
- `#documents`: mặc định chạy (Pháp lý mở sẵn + handler `anchorIds`); edge case MINOR-2.

## Responsive gate
Không cuộn ngang trang OK (375 trình duyệt; 768 ~720px, 1024 ~584px < 40rem cuộn trong thẻ, 1280 ~784px) · lưới Nổi bật 1/sm2/xl3, tiện ích quanh 1/sm2 OK · token chữ, bảng `min-w-[40rem]` OK · không ảnh mới · tab + FAQ `summary` `min-h-11` OK · bảng mobile vùng cuộn có tên OK · menu neo cuộn ngang OK · không vh mới, `fitBounds duration: 0` OK. **PASS** (768/1024 tính CSS; Tài liệu trong Pháp lý ở xl chưa xem — mẫu không có PDF).

## Skill gates
aislop/oxlint/ocr/blitzstrike skip; AI-readable OK (1 chỉ dấu có sẵn: `ProjectDetail` > 50 dòng); ai-friendly-web N/A.

## Findings
Không CRITICAL/MAJOR.
1. **[MINOR-1]** `src/lib/projects/project-detail-view.ts:746` `numberOrNull` nhận 0 → "Từ 0 ₫" / "0 m²" → dùng helper `positive` (:741), thêm test.
2. **[MINOR-2]** `src/components/projects/LegalPolicy.tsx:82-84` "Tải tài liệu" không tới tài liệu khi Pháp lý đã bị thu gọn (mobile: cuộn tới phần tử `display:none` rồi mới mở; bấm lại cùng hash không có `hashchange`) → sau khi mở gọi `requestAnimationFrame(() => …scrollIntoView())` hoặc `onClick` ở link hero.
3. **[MINOR-3]** `src/components/projects/NearbyTabs.tsx:75-81` panel không `tabIndex={0}` (pattern ARIA khi panel không có phần tử focus được) → `tabIndex={hasTabs ? 0 : undefined}`.
4. **[MINOR-4]** `.context/design-spec.md` S03 (đoạn "Bố cục", mục 10b, 11) còn "dưới Tài liệu"/"sau Tài liệu" → aside < lg nay sau Hỏi đáp / cuối cột chính.
5. **[MINOR-5]** Thiếu test: giá từ == đến, chỉ "đến", giá trị 0; `LazyMap.test.tsx` chưa kiểm `approximate` bỏ `markers`.

Residual: marker bản đồ không focus bàn phím (popup chỉ click/chạm) — tên đã liệt kê trong panel tab, chấp nhận.

## Verdict
**PASS** — MINOR-1..5 xử lý ở close-out Phase 5.
