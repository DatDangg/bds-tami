Agent: reviewer

# Review: feature-public-ui-market-vinhomes · phase-2-task-05 · round 2
> Report do primary lưu (guard chặn reviewer ghi `.context/review-reports/**` trong worktree).

- **Review level:** STRICT
- **Reason:** `layout/CtaBanner` dùng chung `/dich-vu/[slug]`, `ServiceCard` dùng chung "Dịch vụ khác"; đổi cấu hình admin global `Homepage` (types sinh lại); view model trang chủ; task khẳng định phủ acceptance #1–#11.
- **Blast radius:** `src/components/layout/CtaBanner.tsx` (trang dịch vụ không truyền ảnh → như cũ); `src/components/services/ServiceCard.tsx`; `src/components/home/CtaBanner.tsx`, `AboutBlock.tsx`; `src/lib/home/home-view.ts`; `src/globals/Homepage.ts` (chỉ `admin.description`); `src/payload-types.ts` (chỉ chú thích); docs. Không đổi schema DB/migration/API/khoá i18n.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (0 error, 2 warning cũ) |
| `pnpm typecheck` | PASS |
| `pnpm vitest run src/components src/lib src/i18n src/app src/hooks src/globals` (reviewer chạy đủ bộ) | PASS 192 files, 1869 tests |
| `pnpm vitest run tests/integration/homepage.test.ts` (`tami_wt_bl020`) | PASS 27 tests (log có WARN "không xếp được job dịch" — test vẫn PASS, chưa điều tra có mới không) |
| `git diff src/payload-types.ts` | +6 dòng JSDoc, không đổi kiểu → không migration |
| **Primary:** build sạch `build-p2t05r2` | PASS, bảng route không đổi |
| **Primary:** runtime (round 1 code, `build-p2t05`) | CTA ảnh nền + 2 nút, 0 `MISSING_MESSAGE` |

## Đóng finding round 1
| Finding | Trạng thái | Bằng chứng |
|---|---|---|
| MAJOR-1 khẳng định "Đủ #1–#11" | CLOSED | design-spec S01 "Đối chiếu #1–#11": bỏ "Đủ", ghi **GAP MỞ** #3 "slider banner ưu đãi" với lựa chọn (a)/(b)/(c) chờ user ở checkpoint Phase 2; acceptance trong task vẫn `[ ]` |
| MINOR-1 vòng focus 2.95:1 | CLOSED | `CtaBanner.tsx:29` `[&_a:focus-visible]:outline-on-dark` chỉ khi có ảnh (utilities layer đè base `:focus-visible` `globals.css:311`); mọi phần tử tương tác trong banner là `<a>`; trắng trên scrim/ảnh trắng ≈ 5.17:1 |
| MINOR-2 mô tả admin 2 field ảnh | CLOSED | `Homepage.ts:78-86` `imageUpload` thêm `description` tuỳ chọn; `:206-207` mô tả đúng thứ tự ưu tiên (`image` thắng `backgroundImage`, khớp `toCta`) |
| MINOR-3 DESIGN.md Đối tác | CLOSED | `docs/DESIGN.md:238` "Đối tác (dải logo; chưa dựng giao diện)" |
| MINOR-4 fallback `svh` | CLOSED | `min-h-[26rem] supports-[height:1svh]:min-h-[clamp(26rem,60svh,40rem)]` (2 variant khác nhau nên tailwind-merge giữ cả hai) |

## Responsive gate (tính CSS)
Không cuộn ngang; min-width; `max-w-container`/`px-gutter`; chữ token; ảnh `sizes="100vw"` cover; nút `size="lg"` 52px; `svh` trong `clamp()` + fallback; reduced-motion OK.

## Skill gates
aislop skip · oxlint skip · ocr skip · AI-readable OK (1 chỉ báo: helper lặp — N-2) · ai-friendly-web N/A · blitzstrike N/A.

## Findings (MINOR, không chặn)
- **N-1** `src/lib/contrast.test.ts:200-209` + design-spec S01 mục 7 dùng nhầm token vòng focus (`--color-focus-ring` #8c6733; trong `.theme-dark-block` thực tế là `--color-on-dark-accent`) → assert `< 4.5` luôn đúng, không chứng minh vòng mặc định < 3:1. → **Primary đã sửa:** assert `contrast(--color-on-dark-accent, scrim/ảnh trắng) < 3`, sửa ghi chú design-spec thành `--color-on-dark-accent` #E0BF89.
- **N-2** `contrast.test.ts` lặp code blend scrim → **Primary đã tách** `scrimOverWhite()`.
- **N-3** assert chuỗi nguồn (`outline-on-dark`, `min-h-[26rem]`) giòn khi đổi tên class — chấp nhận làm guard.
(Sau sửa N-1/N-2: `pnpm vitest run src/lib/contrast.test.ts` 44/44 PASS, `pnpm lint` + `tsc --noEmit` PASS.)

## Residual risk
Chưa nhìn trình duyệt khung kính ServiceCard 21:9 (md) / 4:3 (mobile), CTA 2 nút ở min 26rem; **GAP #3 "slider banner ưu đãi" phải đưa ra user ở checkpoint Phase 2**; WARN job dịch trong log integration chưa điều tra.

## Verdict: PASS
