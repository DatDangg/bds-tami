Agent: reviewer

# Review: feature-public-ui-market-vinhomes · phase-2-task-05 · round 1 (CTA ảnh nền + 2 nút, ServiceCard kính mờ, About, Đối tác)
> Report do primary lưu (guard chặn reviewer ghi `.context/review-reports/**` trong worktree).

- **Review level:** STRICT
- **Reason:** `layout/CtaBanner` dùng chung với `/dich-vu/[slug]`; `ServiceCard` dùng chung với "Dịch vụ khác" ở `/dich-vu/[slug]`; đổi view model + hình dạng truy vấn loader trang chủ (bài học P2-T04); task khẳng định phủ acceptance #1–#11.
- **Blast radius:** `src/components/layout/CtaBanner.tsx` (khối 7 trang chủ + `/dich-vu/[slug]`); `src/components/services/ServiceCard.tsx` (mọi khung bento + "Dịch vụ khác"); `src/components/home/CtaBanner.tsx`, `AboutBlock.tsx`; `src/lib/home/home-view.ts` (`CtaBannerView.secondary`, ảnh `image` → fallback `backgroundImage`); docs. Không đổi schema/migration/API/khoá i18n.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (0 error, 2 warning cũ) |
| `pnpm typecheck` | PASS |
| `pnpm vitest run src/components src/lib src/i18n src/app src/hooks` | PASS 192 files, 1868 tests |
| **Primary:** build sạch `build-p2t05` | PASS, bảng route không đổi |
| **Primary:** runtime (DB dev: đặt `ctaBanner.image`, nút 2 "Gọi tư vấn" → `rentals`) | CTA có ảnh nền (lazy, `sizes=100vw`) + 2 nút ("Nhận tư vấn" → `/lien-he`, "Gọi tư vấn" → `/cho-thue`), cao 480px; 0 `MISSING_MESSAGE`; 5 h2 trang chủ |

File cấm không đụng; `importMap.js` CRLF.

## Kiểm yêu cầu
- Loader trả `ctaBanner.image` đã populate: `readPublicGlobal` (`src/lib/content/read-global.ts:13`) `findGlobal` không `select`, `depth: 1`, `overrideAccess: false`; `read-global.test.ts` assert đúng tham số gọi thật ✅
- Fallback `image` → `backgroundImage`, id trần/không phải ảnh → `null` (test, decision log, design-spec S01.7) ✅
- Scrim `--color-banner-scrim` `rgb(10 12 16 / 0.6)` trên ảnh trắng ≈ `#6c6d70` → chữ trắng ≈ **5.17:1** (tiêu đề, mô tả `text-on-dark`, nhãn chip); nút primary độc lập ảnh ✅
- Chip trên khối tối + scrim đúng ràng buộc P1 ✅; nút 2 qua `resolveNavLink`, chỉ hiện khi đủ nhãn + link hợp lệ (test `javascript:`, `/en`) ✅
- Không CLS (ảnh `absolute inset-0`, chiều cao do nội dung + `min-h-[clamp(26rem,60svh,40rem)]`) ✅
- `/dich-vu/[slug]` CTA y như cũ (test) ✅; ServiceCard kính mờ chỉ `--color-text`, bỏ `theme-dark-block` đúng ✅; AboutBlock ảnh `rounded-xl` ✅; Đối tác không render (FR-PUB-17 Should), ghi S01.6 ✅

## Responsive gate (tính CSS)
Không cuộn ngang; min-width; chữ token; ảnh cover + `sizes`; chạm ≥ 44px; `svh` trong `clamp()`; reduced-motion OK.

## Skill gates
aislop skip · oxlint skip · ocr skip · AI-readable OK · ai-friendly-web N/A · blitzstrike N/A.

## Findings
- **[MAJOR-1]** `.context/design-spec.md` S01 "Đối chiếu #1–#11" ghi "Đủ #1–#11", nhưng change doc #3 còn "**slider banner ưu đãi**" — không task nào dựng (plan P2-T02 chỉ có thanh thông báo, hero, ô tìm kiếm, chip). Không được khẳng định đủ; chọn (a) dựng, (b) map sang khối có sẵn nếu user chấp nhận, (c) ghi gap/loại khỏi phạm vi chờ user.
- **[MINOR-1]** `src/components/layout/CtaBanner.tsx:30` vòng focus `#e0bf89` trên scrim/ảnh trắng ≈ **2.95:1** < 3:1 → khi có ảnh dùng `outline-on-dark` (≈ 5.2:1) + test.
- **[MINOR-2]** `src/globals/Homepage.ts:203-204` hai field ảnh CTA ("Ảnh nền", "Ảnh minh hoạ") gây nhầm → thêm mô tả admin.
- **[MINOR-3]** `docs/DESIGN.md:238` còn ghi "→ Đối tác (dải logo) →" trong luồng trang chủ → ghi "(chưa dựng giao diện)".
- **[MINOR-4]** thiếu fallback khi trình duyệt không hỗ trợ `svh` → thêm `min-h-[26rem]`.

## Residual risk
375/768/1280/1440 chưa kiểm đủ; khung kính thẻ dịch vụ 4:3 mobile che ~65–80% ảnh với tiêu đề 2 dòng.

## Verdict: FAIL (MAJOR-1)
Primary chọn: không dựng thêm, ghi rõ gap "slider banner ưu đãi" (#3) chờ user quyết ở checkpoint Phase 2; sửa kèm MINOR-1..4.
