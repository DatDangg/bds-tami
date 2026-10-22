# feature-news-careers-contact-redesign · phase-2-task-04 — Chi tiết tuyển dụng `/tuyen-dung/[slug]` theo design

- Nguồn: BL-054 Quyết định 10; design `docs/specs/listing-detail-redesign/chi-tiet-tuyen-dung.webp`. Spec 1.47.0 khối BL-054 mục "Chi tiết tuyển dụng".
- Plan: phase 2 wave B (song song P2-T02).
- Phụ thuộc: P1-T01 (`isUrgent`), P2-T03 (`job-view` / badge / helper lương-hạn).

## Classification / Risk
- Type: **MODIFY**. Risk: **HIGH** — form ứng tuyển (upload CV, Turnstile, consent) phải giữ nguyên hành vi; tin hết hạn (noindex, ẩn form, JSON-LD). Review: **STRICT**.
- Blast radius: `src/app/(frontend)/[locale]/tuyen-dung/[slug]/*`, `src/components/careers/JobDetail.tsx`, `src/components/careers/ApplyForm.tsx` / `ApplyFormSlot.tsx` / `CvPicker.tsx` (chỉ trình bày: thẻ tệp đã chọn + nút xoá; không đổi payload gửi), `src/components/careers/*` mới (`JobDetailHero`, `OtherJobs`), `src/lib/careers/job-queries.ts` (việc khác ưu tiên cùng danh mục), i18n namespace `page.jobDetail.v2`, `.context/design-spec.md`, `docs/DESIGN.md`.
- Doc impact: `.context/design-spec.md` (Chi tiết tuyển dụng), `docs/DESIGN.md`.

## Files to Create/Modify
- `src/app/(frontend)/[locale]/tuyen-dung/[slug]/`
- `src/components/careers/JobDetail.tsx`
- `src/components/careers/ApplyForm.tsx`
- `src/components/careers/CvPicker.tsx`
- `src/components/careers/JobDetailHero.tsx`
- `src/components/careers/OtherJobs.tsx`

## Scope (theo spec — xem ảnh design)
1. Hero ảnh nhạt (ảnh Tuyển dụng sẵn có + scrim sáng token): breadcrumb → phòng ban + badge "Tuyển gấp" → tiêu đề 2 dòng (dòng 2 màu nhấn; tách tiêu đề theo quy tắc hiển thị — vd cụm cuối / sau dấu "–" — không thêm trường; không tách được → 1 dòng) → mô tả ngắn (đoạn đầu `description`, ≤ 2 dòng) → hàng thông tin có icon (tỉnh/thành · hình thức · mức lương · "Hạn nộp: …" — `/en` MM/DD/YYYY) → nút "Ứng tuyển ngay" (neo tới form) + "Chia sẻ" (`DetailShareButton` BL-052 nếu hợp).
2. Cột trái thẻ trắng: "Mô tả công việc", "Yêu cầu", "Quyền lợi" (`description` / `requirements` / `benefits`), danh sách dấu chấm tròn màu nhấn (style chỉ ở trang này); `benefits` trống → ẩn mục.
3. Cột phải dính ≥ lg: "Ứng tuyển vị trí này" + "Phản hồi trong 3 ngày làm việc" (i18n) + form hiện có: Họ tên, SĐT, Email, CV kéo-thả + **thẻ tệp đã chọn** (tên, dung lượng, nút xoá có `aria-label`), ô "Lời nhắn" tuỳ chọn (giữ), đồng ý chính sách, "Gửi hồ sơ" (giữ % tiến trình). < lg: form sau nội dung + thanh dính đáy như hiện tại. Payload gửi / validate / Turnstile **không đổi**.
4. "Vị trí khác": 4 thẻ (phòng ban, tên, tỉnh/thành, lương, nút mũi tên; tin còn hạn khác, cùng danh mục trước rồi mới nhất, cùng ngôn ngữ) + "Xem tất cả vị trí" → `/tuyen-dung`. Rỗng → ẩn. → banner tư vấn (**giữ** như hiện tại dù design không vẽ — spec-validation F6).
5. Tin hết hạn: băng + ẩn form + `noindex` + bỏ JSON-LD như hiện tại. JSON-LD `JobPosting` giữ.
6. Responsive 375 / 768 / 1280 / 1440.
7. Test: component (hero badge gấp, tách tiêu đề, thẻ tệp xoá được, benefits rỗng ẩn, việc khác), regression form (ApplyForm test hiện có PASS), hết hạn; chụp 1440 + 390 lưu `.context/review-reports/assets/bl054-p2t04-*`.

## Acceptance
- [ ] Bố cục khớp `chi-tiet-tuyen-dung.webp` ở desktop; mobile hợp lý.
- [ ] Nộp CV hoạt động như cũ (test + thử tay trên DB worktree); hết hạn đúng hành vi cũ.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

## Quy ước song song
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- `src/payload-types.ts` là file sinh: regen bằng `pnpm generate:types` (primary regen lại khi merge nếu xung đột).
- Không sửa file thuộc task song song cùng wave; cần thì ghi vào báo cáo để primary chuyển.
- Tái dùng component BL-052 (`src/components/listing/*`, `src/components/detail/*`, `Pagination`, `ConsultBanner`, `SectionHeading`, Button/Badge/chip sẵn có); token màu theo `no-raw-colors.test`; không thêm màu / kiểu nút mới.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`. Migration phát sinh thao tác phá huỷ → DỪNG, gắn `HIGH_RISK_MIGRATION`, báo primary.

## Quyết định (builder)

## Verification summary (Builder)

## Review

## Doc impact
