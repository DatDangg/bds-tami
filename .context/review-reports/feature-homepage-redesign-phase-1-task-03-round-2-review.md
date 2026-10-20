Agent: reviewer

# Review — feature-homepage-redesign · phase-1-task-03 · round 2 (BL-044)

- **Review level:** STRICT
- **Reason:** `CtaBanner` (layout) dùng chung cho trang chủ + `/dich-vu/[slug]` + chi tiết dự án (thêm prop `size`); footer là layout dùng chung toàn site; đây là gate cuối acceptance 1 "khớp bố cục mockup" của change doc.
- **Blast radius:** `src/components/layout/CtaBanner.tsx` → `src/components/home/CtaBanner.tsx` (compact), `src/app/(frontend)/[locale]/dich-vu/[slug]/page.tsx:129` + `src/components/projects/ProjectDetail.tsx:134` (mặc định, không truyền `size`); `Footer.tsx` → `PublicShell` (mọi trang công khai) + `SocialLinks` ở trang Liên hệ; `FeaturedProjects.tsx` chỉ dùng ở `HomeBlocks.tsx:21` (trang chủ); `AboutBlock`, `StrengthsBlock`, `ProjectsSlider` (trang chủ); seed sample; docs as-built.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS — 0 error, 2 warning có sẵn ngoài scope (`tools/task-dashboard/server.mjs:64,490`) |
| `pnpm test` (đầy đủ) | **304/305 files PASS, 3183 tests PASS, 20 skipped**. File fail: `tests/integration/media-upload.test.ts` — nguyên văn: `Error: Hook timed out in 10000ms. ... ❯ tests/integration/media-upload.test.ts:87:3 beforeAll(async () => {` (20 test skipped do beforeAll timeout). `tests/integration/jobs-email.test.ts` lần này PASS. |
| `pnpm test tests/integration/media-upload.test.ts` (chạy riêng) | PASS 20/20 (8s) |
| `pnpm build` | Không chạy (dev server dùng chung `.next`, theo chỉ thị) — dựa evidence builder: PASS |

Đánh giá test fail: timeout khởi tạo (DB + SeaweedFS S3 thật) dưới tải song song của full suite; chạy riêng PASS; 2 lần full run khác nhau fail 2 file khác nhau (round-2 builder: jobs-email; reviewer: media-upload), cả hai đều là integration dùng hạ tầng thật. T03 không đụng media/upload/jobs/email/S3 → **không liên quan T03**, là flaky hạ tầng → residual risk, đề xuất task riêng (tăng `hookTimeout` integration hoặc giảm song song cho project `integration`).

## Xác minh các finding round 1
| ID | Kết quả | Bằng chứng |
|---|---|---|
| M1 | **Đã sửa** | `CtaBanner.tsx:20-21,29-41`: `size="compact"` → `min-h-[18rem] py-10`, nút chính thêm `ArrowRight` (`aria-hidden`), chỉ khi compact; `home/CtaBanner.tsx:16` truyền `size="compact"`. Mặc định: vẫn `py-section` + (có ảnh) `min-h-[26rem] supports-[height:1svh]:min-h-[clamp(26rem,60svh,40rem)]` + outline focus → giống hệt trước; `/dich-vu` và `ProjectDetail` không truyền `size`. Test `CtaBanner.test.tsx:43-56` phủ cả 2 nhánh. Ảnh r2-1440: banner cao ≈ 157×1.85 ≈ **290px**, mockup ≈ 179×1.627 ≈ **291px**; nút "NHẬN TƯ VẤN →" có mũi tên. |
| m1 | **Đã sửa** | `docs/DESIGN.md:238` viết lại current-state (chữ trái, khối mặc định Điểm mạnh → Về TAMI → Dự án nổi bật → Banner tư vấn, khối tắt mặc định, prop `align`/`size`); bỏ "câu chính viết thường ở giữa" và danh sách mặc định cũ. Dòng Footer `:278` cũng cập nhật. Không mâu thuẫn còn lại. |
| m2 | **Đã sửa** | `AboutBlock.tsx:81` `bg-primary-subtle` (`#f8f3eb`). Tính lại: `text-muted #6b6b6b` trên `#f8f3eb` ≈ 4.82:1 ≥ 4.5 (AA); `accent-text #8c6733` khớp số builder 4.63:1. Mảng be `primary-soft` sau ảnh phụ vẫn phân biệt được trên ảnh. |
| m3 | **Đã sửa** | `FeaturedProjects.tsx:25` `pt-section pb-10`; chỉ dùng ở `HomeBlocks.tsx:21` → không ảnh hưởng trang khác. Ảnh r2: "Xem tất cả" → banner ≈ 33×1.85 ≈ **61px** (mockup ≈ 39px; yêu cầu ~65px) — đạt. |
| m4 | **Đã sửa** | `Footer.tsx:84` `isCircle ? "gap-1" : "gap-2"`; test `Footer.test.tsx` "SocialLinks: khoảng cách theo variant". Trang Liên hệ giữ `gap-2`. |
| m5 | **Ghi nhận đúng** | Task file bảng so khớp dòng 6 + Verification summary round 2: hoa văn sóng footer không dựng (cần asset/kiểu ngoài tokens) — **cần user quyết**. Lệch trang trí, được chấp nhận theo danh sách của dispatcher. |

Regression round 2: không thấy. Default `CtaBanner` không đổi class; `StrengthsBlock` key theo index (danh sách tĩnh, hợp lệ); `ProjectsSlider` chỉ thêm `pt-1`; `AboutBlock` chỉ đổi class/thêm div trang trí `aria-hidden`.

## Bảng so khớp 1→7 (mockup `homepage-mockup-desktop.webp` vs `assets/homepage-redesign-r2-1440.png`, `-r2-390.png`)
| Phần | Kết luận | Ghi chú |
|---|---|---|
| 1 Hero + 1b ô tìm kiếm | Khớp (lệch đã chấp nhận) | Eyebrow, tiêu đề 2 dòng (dòng 2 vàng), mô tả, "TÌM CĂN HỘ →", mũi tên tròn 2 mép, bộ đếm + thanh tiến trình dưới trái, chú thích + nút cuộn dưới phải; ô tìm kiếm 3 hàng (tab, ô + nút, chip "Dự án được quan tâm", "Tùy chọn khác") đè đáy hero. Lệch có lý do: hero 100svh, vị trí bộ đếm theo mép chữ, nút Dừng/Phát (WCAG 2.2.2). Ảnh hero là ảnh dev. |
| 2 Điểm mạnh | Khớp | 4 mục icon tròn be + tiêu đề + mô tả trên 1 hàng ngay dưới ô tìm kiếm. |
| 3 Về TAMI | Khớp (lệch nhỏ) | Nền kem ấm, cụm ảnh (ảnh phụ + mảng be + thẻ chú thích + nút play "KHÁM PHÁ TAMI HOMES"), chữ phải, 2 số liệu icon, "TÌM HIỂU THÊM →", ảnh trang trí mép phải. Lệch: hoạ tiết mờ nền không dựng (cần asset); khối cao hơn mockup (~625px vs ~508px) — xem n1. |
| 4 Dự án nổi bật | Khớp | Eyebrow + tiêu đề + mô tả giữa; 5 thẻ trắng (thẻ 5 cắt mép), badge + tim, mũi tên + chấm, "XEM TẤT CẢ DỰ ÁN →". |
| 5 Banner tư vấn | **Khớp** (sửa M1) | Dải thấp ≈290px, chữ trái, nút có mũi tên; scrim đơn sắc (lệch đã chấp nhận). |
| 6 Footer | Khớp (lệch đã chấp nhận) | Logo + mô tả + 4 icon tròn; "Khám phá"/"Về TAMI" đúng vị trí; bản quyền trái, VI \| EN phải. BackToTop nổi (chỉ hiện khi cuộn; vòng tròn "N" góc dưới trái ảnh là chỉ báo Next dev, không phải UI sản phẩm). Hoa văn sóng không dựng — chờ user quyết (m5). |
| 7 Thứ tự khối | Khớp | Hero → tìm kiếm → Điểm mạnh → Về TAMI → Dự án nổi bật → Banner → footer; khối ngoài mockup không hiện. |
| Mobile 390 | Khớp phong cách | Xếp dọc đúng thứ tự, ô tìm kiếm 3 hàng gọn, điểm mạnh 1 cột, thẻ dự án cuộn ngang có chủ đích, footer accordion. Vùng trống dưới footer là khung chụp cố định (không phải DOM). |

**Quyết định acceptance 1 ("khớp bố cục mockup"):** ĐẠT — mọi phần 1→7 đúng bố cục/thứ tự/vị trí thành phần; lệch còn lại đều nằm trong danh sách được chấp nhận (hero 100svh, vị trí bộ đếm, nút Dừng/Phát, scrim đơn sắc, BackToTop nổi, hoa văn sóng footer) hoặc là khoảng cách dọc nhỏ (n1), không đổi bố cục. Việc tick checkbox thuộc dispatcher.

## Kiểm thêm
- 1 `h1` (hero); không hex mới trong diff (`bg-primary-subtle`, `bg-primary-soft`, `border-dark-border` là token có sẵn `globals.css`); vùng chạm MXH `size-11`.
- Intent docs (BRD/PRD/SPECIFICATIONS) không đổi trong diff. As-built ERD/design-spec/DESIGN reconcile.
- Change doc: builder đã tick acceptance 2–6; mục 6 có "build PASS" — reviewer không chạy build (theo chỉ thị), dựa evidence builder (residual).

## Responsive Checklist Gate (diff đụng UI; 375/768/1280 + 390)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không tràn ngang | OK | Ảnh 390 không phần tràn ngoài slider cuộn có chủ đích; builder đo `scrollWidth`=390 |
| Mobile-first `min-width` | OK | Chỉ dùng tiền tố `sm:`/`md:`/`lg:`/`xl:` (min-width) |
| Grid auto-fit/minmax | OK (có lý do) | Footer `minmax(0,…)` + `--footer-cols`; StrengthsBlock 1/2/4 cột theo mốc, không cố định px |
| Container không fixed px | OK | `max-w-container`, `%` cho cụm ảnh; banner compact `min-h-[18rem]` là chiều cao tối thiểu (nội dung dài vẫn giãn) |
| Font rem / heading fluid | OK | Token typography sẵn có, không thêm px font |
| Media max-width/aspect-ratio | OK | `ResponsiveImage` + `aspect-square` mảng trang trí |
| Touch ≥ 44px | OK | MXH `size-11`; nút banner `size="lg"`; cookie `min-h-11` |
| Nav mobile | OK | Không đổi |
| Table | N/A | Không có bảng |
| 100vh | OK | Banner compact không dùng vh; default giữ `svh` + fallback |
| prefers-reduced-motion | OK | Không thêm animation |
| Không che lỗi bằng overflow:hidden | OK | Không thêm `overflow-hidden` mới (section đã có sẵn) |
Chưa xác minh trực tiếp ở 768/1280 bằng trình duyệt — CSS math + ảnh 390/1440 (residual).

## Skill gates
- aislop: skip — không nằm trong verify commands được phép của reviewer.
- oxlint (anti-slop): skip, oxlint not configured trong verify commands; ESLint 0 error.
- ocr (open-code-review): skip, ocr not installed / không trong verify commands.
- AI-readable: OK — 0 indicator mới (hàm < 50 dòng, `CtaBanner.tsx` ~70 dòng, `Footer.tsx` ~110 dòng; comment nêu WHY; docs cập nhật).
- ai-friendly-web: N/A — không đổi robots/sitemap/llms.
- blitzstrike: N/A — không đụng auth/API/input.

## Findings
### [CRITICAL]
Không có.
### [MAJOR]
Không có.
### [MINOR]
- **n1** Khoảng cách dọc Về TAMI → Dự án nổi bật: ảnh r2 ≈ 128px (đáy khối Về TAMI → eyebrow), mockup ≈ 42px; khối Về TAMI cao ≈ 625px vs ≈ 508px (`AboutBlock.tsx:81` `py-section` + `FeaturedProjects.tsx:25` `pt-section`). Không đổi bố cục/thứ tự/vị trí — không chặn. Đề xuất nếu user muốn sát ảnh: `FeaturedProjects` `pt-10`/`pt-section-tight` (chỉ trang chủ).
- **n2** Full suite `pnpm test` không ổn định: timeout `beforeAll` 10s ở integration dùng hạ tầng thật (`tests/integration/media-upload.test.ts:87`, trước đó `jobs-email.test.ts`), chạy riêng PASS. Ngoài scope T03 — đề xuất task riêng (tăng `hookTimeout` cho project integration hoặc giới hạn song song).
- **n3** (ghi nhận, không phải lỗi) Hoa văn sóng footer + hoạ tiết nền Về TAMI chưa dựng — chờ user quyết (m5).

## Residual risk
- `pnpm build` không chạy bởi reviewer (dựa evidence builder).
- 768/1280 chưa kiểm trực tiếp bằng trình duyệt.
- Flaky integration (n2).

## Verdict
✅ **PASS** — M1 và m1–m4 đã sửa, m5 ghi đúng là điểm chờ user quyết; không regression; typecheck/lint PASS; test 304/305 file PASS, file fail là flaky hạ tầng không liên quan T03 (chạy riêng PASS). Acceptance 1 của change doc "khớp bố cục mockup": **ĐẠT** (dispatcher tick).
