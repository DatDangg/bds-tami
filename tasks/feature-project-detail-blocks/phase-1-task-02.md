# feature-project-detail-blocks · phase-1-task-02 — Ảnh từng tiện ích (slider thẻ) + ảnh/video "Kết nối hạ tầng" ở khối Vị trí

- Nguồn: BL-058 · change doc `spec/changes/2026-10-22-project-detail-blocks.md` (mục 3 + 4).
- Design: `docs/specs/listing-detail-redesign/detail-du-an.webp` + mô tả user: khối Vị trí = bản đồ + danh sách phút/km + **thẻ ảnh/video "Kết nối hạ tầng" có nút play bên phải**; Tiện ích nổi bật = **slider thẻ ảnh từng tiện ích có tên + mô tả ngắn, nút ←/→**.
- Nhánh/worktree: `claude/bl058-project-detail-blocks-5971d4`; DB `tami_bl058` (`.env.local` worktree — KHÔNG chạy migrate vào DB `tami`); dev server cổng **3058**.
- Phụ thuộc: T01 (cùng nhánh, đã commit trước).

## Classification / Risk
- Type: **MODIFY** (thêm trường + đổi hiển thị 2 khối).
- Risk: **HIGH** — schema + migration (`projects`), view model chi tiết dự án, component khung chi tiết.
- Expected review level: **STRICT** (schema/migration + component dùng chung).
- Blast radius: `src/collections/Projects.ts`, `migrations/<timestamp>_project_detail_blocks.{ts,json}` + `migrations/index.ts`, `src/payload-types.ts` (generate), `src/lib/projects/project-detail-view.ts` (+ test), `src/components/projects/ProjectAmenities.tsx`, `src/components/projects/ProjectLocation.tsx`, component slider/thẻ mới trong `src/components/projects/` hoặc `src/components/detail/`, `src/i18n/messages/{vi,en}.json`, query depth/select của trang `/du-an/[slug]` nếu cần populate ảnh, admin labels.

## Quyết định (theo design, tự quyết)
1. **Schema** (`Projects.ts`):
   - `amenitiesField.fields` thêm `mediaUpload("image", "Ảnh tiện ích (tuỳ chọn)", imageMimeType)` (dùng helper sẵn có như `amenitiesImage`), admin description: "Có ảnh thì khối Tiện ích hiện dạng slider thẻ ảnh".
   - Tab chứa `location` thêm group `locationMedia` (label "Thẻ Kết nối hạ tầng (khối Vị trí)"): `title` text localized tuỳ chọn (placeholder "Kết nối hạ tầng"), `image` upload ảnh tuỳ chọn, `videoUrl` text tuỳ chọn `validate: validateVideoUrl` + `hooks.beforeValidate: [trimText]` (như `videoUrl` dự án). Đặt ngay sau `location`/`address`.
   - Không `required`, không default → không backfill.
2. **Migration**: `pnpm payload migrate:create project_detail_blocks` chạy với DB `tami_bl058` (DB đã ở migration mới nhất của staging); inspect SQL: chỉ `ADD COLUMN` nullable + FK `media` `ON DELETE SET NULL` + index (nếu Payload sinh) — **SAFE_ADDITIVE**. Nếu SQL sinh ra có gì khác (DROP/ALTER TYPE/SET NOT NULL/đụng bảng khác) → DỪNG, ghi lại, không chạy. `pnpm payload migrate` vào `tami_bl058`. Generate `payload-types` + importmap nếu cần.
   - Lưu ý merge: BL-054 trên `staging` có thể thêm migration mới cùng lúc; migration này phải độc lập (chỉ đụng bảng `projects_amenities` + `projects`/`_projects_v*` nếu có versions). Ghi tên bảng/cột vào § Verification summary.
3. **View model** (`project-detail-view.ts`): `AmenityView` thêm `image: MediaImage | null` (qua `renderableImage`, alt fallback tên tiện ích); view thêm `locationMedia: { title: string | null; image: MediaImage | null; videoUrl: string | null } | null` (null khi không có ảnh lẫn video hợp lệ — video qua `parseVideoUrl` không parse được thì coi như không có). Đảm bảo query trang chi tiết populate được upload lồng trong array/group (depth).
4. **Tiện ích** (`ProjectAmenities.tsx`):
   - Có ≥ 1 mục có ảnh → chế độ slider: dùng **`CardSlider` dùng chung** (`arrows="sides"` hoặc `below` theo design ←/→ — chọn `sides` cho đồng bộ "Dự án tương tự"; nhãn ARIA i18n mới), mỗi thẻ: ảnh tỉ lệ cố định (4:3 hoặc 3:4 theo design; dùng `ResponsiveImage`, `sizes` hợp lý) + `h3` tên + mô tả (line-clamp 3). Mục không ảnh trong chế độ slider: thẻ cùng kích thước với ô placeholder nền `surface-muted` + icon tích (không vỡ hàng). `amenitiesImage` chung không dùng trong chế độ slider.
   - Không mục nào có ảnh → giữ y nguyên hiện tại (`DetailFeatureList` + `amenitiesImage`).
   - Heading/eyebrow/`DetailSection` giữ nguyên.
5. **Vị trí** (`ProjectLocation.tsx`): có `locationMedia` → ≥ lg lưới 3 phần: bản đồ (~5–6 cột) · danh sách khoảng cách (~3–4 cột) · thẻ media (~3 cột) bên phải — builder chỉnh tỉ lệ để bản đồ không quá hẹp ở 1280–1440; < lg xếp dọc (bản đồ → danh sách → thẻ). Thẻ: tiêu đề (`title` hoặc i18n mặc định "Kết nối hạ tầng" / "Infrastructure connections") + video → `VideoFacade` (poster = ảnh `image` nếu có; nút play; iframe chỉ sau khi bấm) / chỉ ảnh → `ResponsiveImage` bo góc. Thiếu bản đồ hoặc thiếu danh sách → thẻ chiếm chỗ còn lại hợp lý (không ô trống). Không `locationMedia` → layout như hiện tại (không đổi DOM cũ).
6. Không đổi `DetailFeatureList`, `DetailDistanceList` dùng chung (nếu buộc phải đổi → giữ hành vi cũ cho Cho thuê/Tin BĐS, có test).
7. i18n VI/EN cho mọi nhãn mới (namespace `page.projectDetail.v2`).

## Scope
1. Schema + migration + types theo §1–2.
2. View model + component theo §3–7.
3. Test vitest: view model (ảnh tiện ích, alt fallback, `locationMedia` null khi rỗng/video sai), `ProjectAmenities` (slider khi có ảnh, kiểu cũ khi không ảnh, mục không ảnh trong slider), `ProjectLocation` (có/không thẻ media, video → facade không iframe trước khi bấm, chỉ ảnh), schema test nếu repo có test collection fields. Cập nhật test cũ bị ảnh hưởng.
4. Doc as-built: `.context/design-spec.md` (khối Vị trí + Tiện ích khung chi tiết Dự án), `docs/DESIGN.md` nếu có mô tả. **KHÔNG** sửa `docs/ERD.md`/`SPECIFICATIONS.md`/`spec/**` — hoãn tới lúc merge (change doc § Spec delta).
5. Kiểm trình duyệt (cổng 3058) sau khi primary seed ảnh mẫu.

## Acceptance (từ change doc)
- [ ] `amenities[].image` + `locationMedia` (title/image/videoUrl) trong admin, migration versioned SAFE_ADDITIVE, đã migrate `tami_bl058`.
- [ ] Có ảnh tiện ích → slider thẻ ảnh (ảnh + tên + mô tả, ←/→ ≥ md, vuốt mobile); không ảnh → kiểu cũ.
- [ ] Có ảnh/video Vị trí → thẻ bên phải cạnh bản đồ + danh sách; video qua facade; thiếu → layout cũ.
- [ ] VI/EN; 1440 + 390 không tràn ngang.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary
(điền sau review)
