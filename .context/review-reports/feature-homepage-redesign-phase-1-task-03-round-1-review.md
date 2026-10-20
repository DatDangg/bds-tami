Agent: reviewer

# Review — feature-homepage-redesign · phase-1-task-03 · round 1 (BL-044)

- **Review level:** STRICT
- **Reason:** footer là layout dùng chung mọi trang công khai (shared component, bỏ prop `contact`, đổi `SocialLinks` export dùng ở trang Liên hệ); acceptance "khớp mockup bằng mắt" là gate; seed dữ liệu; doc as-built.
- **Blast radius:** `src/components/layout/Footer.tsx` → `PublicShell` (mọi trang công khai) + `src/components/contact/ContactDetails.tsx` (dùng `SocialLinks` variant mặc định); trang chủ (`AboutBlock`, `ProjectsSlider`, `StrengthsBlock`); `seed/sample/homepage.ts` (chỉ chạy với `--sample`, bị chặn ở production bởi `assertSampleAllowed` `seed/index.ts:110-113`); docs `.context/design-spec.md`, `docs/DESIGN.md`, `docs/ERD.md`, change doc.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (0 lỗi) |
| `pnpm lint` | PASS — 0 error, 2 warning có sẵn ngoài scope (`tools/task-dashboard/server.mjs:64,490`) |
| `pnpm test` (đầy đủ, DB docker) | PASS — **305 files / 3200 tests**, exit 0, chạy 1 lần không fail. Log có stderr `Invariant: static generation store missing in revalidatePath(...)` từ hook revalidate khi seed trong test — là log có sẵn, không làm fail test. Lần fail không tên builder gặp không tái hiện → đánh giá **flaky** (nghi integration DB dùng chung), không phải lỗi thật của T03 |
| `pnpm build` | **Không chạy** (dev server dùng chung `.next`, theo chỉ thị) — dựa vào evidence builder: PASS |

## Bảng so khớp 1→7 của reviewer (mockup `homepage-mockup-desktop.webp` vs `assets/homepage-redesign-1440.png`)
| Phần | Kết luận | Ghi chú |
|---|---|---|
| 1 Hero | Khớp (lệch đã biết) | Chữ trái 2 dòng (dòng 2 vàng), eyebrow, nút "Tìm căn hộ →", mũi tên tròn 2 mép, bộ đếm + thanh tiến trình dưới trái, chú thích + nút cuộn dưới phải. Cao 100svh, bộ đếm canh mép chữ, nút Dừng/Phát = lệch đã biết có lý do |
| 1b Ô tìm kiếm | Khớp | 3 hàng (ô + nút, chip "Dự án được quan tâm", "Tùy chọn khác"), đè đáy hero, vị trí giữa |
| 2 Điểm mạnh | Khớp | 4 mục icon tròn be + tiêu đề + mô tả, 1 hàng ngay dưới ô tìm kiếm |
| 3 Về TAMI | Khớp, lệch nhỏ | Cụm ảnh trái (ảnh phụ + mảng be + thẻ chú thích + nút play), chữ phải, số liệu icon, nút "Tìm hiểu thêm →", ảnh trang trí mép phải. Lệch nhỏ: nền khối trong mockup là kem ấm có hoạ tiết, ảnh chụp nền trắng (MINOR m2) |
| 4 Dự án nổi bật | Khớp | Eyebrow + tiêu đề + mô tả giữa; 5 thẻ trắng (thẻ 5 cắt mép), badge + tim, mũi tên + chấm, "Xem tất cả dự án →" |
| 5 Banner tư vấn | **Lệch — không có lý do** | Ở mockup là dải thấp (~290px ở 1440, tỉ lệ ≈ 1440:290); ảnh chụp cao ~630px (gấp ~2 lần) do `min-h-[clamp(26rem,60svh,40rem)]`. Nút mockup "NHẬN TƯ VẤN →" có mũi tên, bản dựng không có (mọi nút chính khác trên trang đều có →). Builder ghi "Khớp" — không đúng. Xem **M1** |
| 6 Footer | Khớp | Cột trái logo + mô tả + 4 icon tròn; "Khám phá" ~43%, "Về TAMI" ~69% bề rộng như ảnh; hàng cuối bản quyền trái, VI \| EN phải; nút lên đầu = BackToTop nổi (lý do đã biết). Hoạ tiết sóng nền footer trong mockup không có (trang trí, MINOR m3). Footer `/du-an` (`footer-du-an-1440.png`) giống trang chủ → dùng chung OK |
| 7 Thứ tự khối | Khớp | Hero → tìm kiếm → Điểm mạnh → Về TAMI → Dự án nổi bật → Banner → footer; 4 khối ngoài mockup không hiện |

Ghi chú ảnh: vùng trống sáng dưới footer ở cả 3 ảnh (homepage 1440/390 và `/du-an`) là do khung chụp cố định chiều cao lớn hơn trang (không phải phần tử DOM) — residual risk, không tính lỗi.

## Kiểm thêm theo yêu cầu
- `FooterContact`/prop `contact` bỏ: không còn nơi nào truyền `contact` vào `<Footer>` (chỉ `PublicShell.tsx:30`); `FooterContactView` vẫn dùng ở `Header.tsx:26`, `MobileMenu.tsx:21,147`, `ContactDetails.tsx:7`, `contact-view.ts:16` → Header/MobileMenu còn contact. OK.
- Grid `--footer-cols`: `repeat(var(--footer-cols),minmax(0,1fr))` là CSS hợp lệ (var trong số lặp được thay ở computed-value time); `< md` `grid-cols-1` + `FooterLinkColumn` accordion giữ. OK. Residual: nếu admin có 4 cột link, ở 768px mỗi cột ~100px (chữ xuống dòng, không tràn vì `minmax(0,…)`).
- `SocialLinks` variant mặc định `plain` → trang Liên hệ vẫn icon trần 24px; nhưng `ul` đổi `gap-2` → `gap-1` cho cả 2 variant (MINOR m4).
- Seed: chỉ qua `--sample`, production bị chặn (`seed/index.ts:110-113`); icon seed ⊂ `STRENGTH_ICONS` (`src/globals/homepage/blocks.ts:19`). OK.
- Intent docs: BRD/PRD/SPECIFICATIONS không đổi (git status). As-built ERD §4.15 + design-spec §2.4/S01 khớp code. OK (DESIGN.md xem m1).
- Hướng dẫn admin staging/prod: rõ, 3 bước (task file mục "Hướng dẫn admin") + design-spec S01. OK.
- 1 `h1`, vùng chạm ≥ 44px (`size-11` link MXH, test `Footer.test.tsx`), không hex mới (`bg-primary-soft`, `border-dark-border` là token). AA: chữ footer giữ token cũ. OK.

## Responsive Checklist Gate (diff đụng UI; 375/768/1280 + 390 theo task)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không tràn ngang | OK | Builder đo `scrollWidth`=390; ảnh 390 không có phần tràn ngoài slider cuộn có chủ đích |
| Mobile-first `min-width` | OK | Class `md:`/`lg:`/`sm:` (Tailwind min-width) |
| Grid auto-fit/minmax | OK (có lý do) | Footer dùng `repeat(var(--footer-cols),minmax(0,1fr))` thay auto-fit vì auto-fit + fr không hợp lệ; `< md` 1 cột |
| Container không fixed px | OK | `max-w-container`, `%` cho cụm ảnh |
| Font rem / heading fluid | OK | Token typography có sẵn, không px mới |
| Media max-width/aspect-ratio | OK | Mảng be `aspect-square w-[34%]`, ảnh qua `ResponsiveImage` |
| Touch ≥ 44px | OK | MXH `size-11`, cookie `min-h-11`, accordion 44px |
| Nav mobile | OK | Không đổi (header/menu di động) |
| Table | N/A | Không có bảng |
| 100vh | OK | Banner dùng `svh` với fallback `min-h-[26rem]` |
| prefers-reduced-motion | OK | Không thêm animation; slider giữ `motion-reduce:scroll-auto` |
| Không che lỗi bằng overflow:hidden | OK | Không thêm `overflow-hidden` mới |
Chưa xác minh trực tiếp bằng trình duyệt (reviewer không chạy app): 768/1280 — dựa trên CSS math + ảnh 390/1440.

## Skill gates
- aislop: skip — lệnh không nằm trong verify commands được phép của reviewer.
- oxlint (anti-slop): skip — không xác minh được config (Glob timeout); ESLint PASS 0 error.
- ocr (open-code-review): skip, ocr không trong verify commands/không xác minh được cài đặt.
- AI-readable: OK — 0–1 indicator (`Footer.tsx` 108 dòng, hàm < 50 dòng, comment giải thích WHY, docs đã reconcile).
- ai-friendly-web: N/A — task không đổi robots/sitemap/llms.
- blitzstrike: N/A — không đụng auth/API/input.

## Findings
### [MAJOR]
- **M1 — Banner tư vấn lệch tỉ lệ + thiếu mũi tên so với mockup, bảng so khớp ghi sai "Khớp".** `src/components/layout/CtaBanner.tsx:31` (`min-h-[clamp(26rem,60svh,40rem)]` + `py-section`) cho dải cao ~540–640px ở 1440 trong khi mockup là dải thấp ~290px; nút `CtaBanner.tsx:47` không có icon → trong khi mockup "NHẬN TƯ VẤN →". Đây là lệch tỉ lệ thấy rõ bằng mắt ở phần 5, không nằm trong danh sách lệch đã biết. Đề xuất: cho biến thể trang chủ (`align="start"` hoặc prop `size="compact"` mới, chỉ dùng từ `src/components/home/` ) chiều cao thấp (vd `min-h-[18rem]` + `py-section-tight`) và thêm `ArrowRight` như các nút chính khác của trang chủ; giữ nguyên mặc định `center` cho `/dich-vu/[slug]` và chi tiết dự án (kiểm `CtaBanner.test.tsx`). Cập nhật bảng so khớp + design-spec S01 mục 7 sau khi sửa. Nếu user muốn giữ chiều cao hiện tại → ghi rõ là lệch đã chấp nhận.

### [MINOR]
- **m1** `docs/DESIGN.md:238` — đoạn BL-044 chèn đầu nhưng giữ nguyên mô tả cũ mâu thuẫn ("câu chính viết thường ở giữa", "mặc định: Giới thiệu, Dự án nổi bật, Dịch vụ, Ưu đãi…"). Đề xuất viết lại dòng as-built theo current-state, bỏ phần cũ đã sai (doc as-built không phải intent).
- **m2** Về TAMI: mockup nền kem ấm có hoạ tiết mờ, bản dựng nền trắng/`bg` — lệch nhỏ, nên dùng token nền ấm có sẵn (vd `bg-primary-subtle`) hoặc ghi lý do trong bảng.
- **m3** Khoảng trống giữa Dự án nổi bật và banner ở ảnh chụp ~200px so với ~65px trong mockup (padding section cộng dồn) — rà lại `py-section` của khối dự án khi sửa M1.
- **m4** `src/components/layout/Footer.tsx:84` — `ul` đổi `gap-2` → `gap-1` áp dụng cả variant `plain` → trang Liên hệ (`ContactDetails.tsx:63`) đổi khoảng cách icon (drive-by). Đề xuất chỉ dùng `gap-1` khi `isCircle`.
- **m5** Footer mockup có hoạ tiết sóng nền — không dựng (trang trí). Ghi vào bảng là lệch chấp nhận được, hoặc hỏi user.

## Verdict
❌ **FAIL** — 1 MAJOR (M1: banner tư vấn phần 5 lệch tỉ lệ/thiếu mũi tên so với mockup, gate acceptance mục 1 chưa đạt). Code footer, test (305/3200 PASS), typecheck, lint đều đạt; sau khi sửa M1 (+ m1, m4 khuyến nghị) có thể PASS ở round 2.
