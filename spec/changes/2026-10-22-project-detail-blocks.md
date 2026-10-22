---
id: project-detail-blocks
type: feature
status: in_progress
created: 2026-10-22
---

# BL-060 — Chi tiết Dự án: bản đồ Vị trí, thẻ "Kết nối hạ tầng", slider Tiện ích, nền "Dự án tương tự"

## Yêu cầu
Chi tiết Dự án (BL-052, design `docs/specs/listing-detail-redesign/detail-du-an.webp` + mô tả design của user) còn 4 điểm:

1. **BUG — bản đồ trống.** Khối Vị trí chỉ hiện ô xám, không thấy bản đồ dù tile OSM tải 200 và có marker.
2. **Nền "Dự án tương tự"** trắng (`bg-surface`) liền với các dải Vị trí / Tiện ích phía trên → đổi sang tông vàng nhạt (token có sẵn) để tách khối. Dùng chung cho Cho thuê / Tin BĐS.
3. **Tiện ích nổi bật** — design: slider thẻ ảnh, mỗi tiện ích 1 ảnh + tên + mô tả ngắn, nút ←/→. Hiện dữ liệu chỉ có tên/icon/mô tả + 1 ảnh chung `amenitiesImage`.
4. **Khối Vị trí** — design: bản đồ + danh sách phút/km + thẻ ảnh/video "Kết nối hạ tầng" (nút play) bên phải. Hiện chưa có trường ảnh/video.

## Bối cảnh / tái hiện (bug mục 1)
- Màn/route/role: `/du-an/<slug>` (khách), khối Vị trí; `LazyMap` dùng chung ở `/cho-thue/<slug>`, `/tin-bds/<slug>`, `/lien-he`.
- Bước tái hiện: mở chi tiết dự án có toạ độ → cuộn tới Vị trí → bản đồ tự tải.
- Expected: bản đồ phủ kín khung tỉ lệ 4:3.
- Actual: khung xám, canvas MapLibre cao 0px.
- Root cause (đã xác định): `src/components/media/LazyMap.tsx:202` — container map `<div className="absolute inset-0">`; MapLibre gắn class `.maplibregl-map { position: relative }` lên chính container, CSS `maplibre-gl.css` import động **sau** Tailwind nên thắng `.absolute` cùng độ đặc hiệu → container thành `relative`, không có chiều cao → canvas 0px.

## Acceptance (bắt buộc)
- [ ] Bản đồ phủ kín khung aspect-ratio ở mọi nơi dùng `LazyMap` (Dự án, Cho thuê, Tin BĐS, Liên hệ), bất kể thứ tự nạp CSS MapLibre; có test chống tái phát.
- [ ] Dải "… tương tự" nền `--color-primary-subtle` (class `bg-primary-subtle`, không hex) ở cả 3 màn chi tiết; tương phản chữ/link đạt AA (accent-text 4.63:1).
- [ ] Mỗi mục `amenities[]` có trường ảnh tuỳ chọn (upload `media`, ảnh); migration versioned SAFE_ADDITIVE (chỉ thêm cột nullable + FK).
- [ ] Có ≥ 1 tiện ích có ảnh → khối Tiện ích là slider thẻ ảnh (ảnh + tên + mô tả), nút ←/→ ≥ md, vuốt mobile; mục không ảnh vẫn hiện (thẻ không ảnh, không vỡ layout). Không mục nào có ảnh → giữ kiểu hiện tại (`amenitiesImage` + danh sách tích).
- [ ] Khối Vị trí có trường ảnh tuỳ chọn + link video tuỳ chọn (YouTube/TikTok, `validateVideoUrl`) + tiêu đề thẻ tuỳ chọn (mặc định "Kết nối hạ tầng"); có ảnh hoặc video → thẻ bên phải cạnh bản đồ + danh sách khoảng cách, video mở bằng facade sẵn có (nút play, không tải iframe trước khi bấm). Thiếu dữ liệu → layout như hiện tại.
- [ ] VI/EN; 1440 + 390 không tràn ngang; `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

## Spec delta (MODIFY — hoãn bump version tới lúc merge)
- Collection `projects` (ERD §4.5): `amenities[].image` (upload → `media`, ảnh, tuỳ chọn); trường mới tab Vị trí: `locationMedia` (group: `image` upload ảnh tuỳ chọn, `videoUrl` text tuỳ chọn + `validateVideoUrl`, `title` text localized tuỳ chọn). Tên trường cuối cùng theo task file nếu builder phải đổi.
- Màn chi tiết Dự án (design-spec khung chi tiết BL-052): khối Vị trí 3 phần (bản đồ · khoảng cách · thẻ media) khi có media; khối Tiện ích 2 chế độ (slider thẻ ảnh / ảnh chung + danh sách).
- Khung chi tiết dùng chung: dải "… tương tự" nền `primary-subtle`.
- `LazyMap`: bug fix, không đổi API.
- **Hoãn tới lúc merge vào `staging` (sau BL-054 bump 1.47.0):** bump `spec_version` (MINOR, 1.48.0 dự kiến), `SPECIFICATIONS.md`, `spec/CHANGELOG.md`, `spec/updates/`, `spec/test-scope/current.json`, `.context/progress.json`, `docs/ERD.md`, archive change doc.

## Ghi chú
- Dữ liệu mẫu (ảnh tiện ích / ảnh Vị trí) chỉ seed vào DB worktree `tami_bl058`, không phải dữ liệu thật.
- Nhánh: `claude/bl058-project-detail-blocks-5971d4` (worktree), không push / không merge cho tới khi BL-054 commit xong.
