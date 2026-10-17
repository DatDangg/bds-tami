Agent: reviewer

# Review: build/tami-website layer-5-task-07, round 2 (cookie consent banner + GA4 sau đồng ý)

- **Review level:** STRICT
- **Reason:** dữ liệu cá nhân/consent (LGL-03), script bên thứ ba (gtag), shared shell (`ShellView` contract, `PublicShell`/`Footer` trên mọi trang công khai), an toàn cache CDN.
- **Blast radius:** mọi trang công khai vi/en (`PublicShell` → `Footer` + `CookieBanner`); `ShellView.consent` (`shell-data.ts`, `load-shell.ts`, fixture test); cookie `tami_consent`, `_ga*`, cờ `ga-disable-<ID>`; `FloatingContact` (`--floating-bottom-offset`); i18n `layout.consent`; số liệu GA4.
- **Scope reviewed:** toàn bộ diff chưa commit so với HEAD `a614b3d` (cả task, không chỉ phần sửa): `src/lib/consent/*`, `src/components/analytics/GoogleAnalytics.tsx`, `src/components/consent/*`, `Footer.tsx`, `PublicShell.tsx(+test)`, `shell-data.ts`, `load-shell.ts`, `en.json`/`vi.json`, `tasks/tami-website/layer-14-task-01.md`, `.context/progress.json`. Bỏ qua `.claude/launch.json`.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 95 files, 991 tests |
| `pnpm build` | PASS (exit 0). Sau build `git status` không đổi, `importMap.js` ổn định (đã commit ở a614b3d) |

Reviewer không chạy app/browser. Bằng chứng browser lấy từ Run Journal (`.context/runs/build-tami-website-layer-5-task-07.md:29`): builder chạy `next start :3219`.

## Kiểm từng fix của round 1
| Finding R1 | Kết quả | Bằng chứng |
|---|---|---|
| MAJOR-1: hydrate xoá `_ga` | **Đã sửa** | `CookieBanner.tsx:113`: `<GoogleAnalytics>` chỉ mount khi `decided !== undefined`. Ở render hydrate đầu (snapshot server `UNREAD`), component con không mount nên effect `enabled=false` (`GoogleAnalytics.tsx:45-46`) không chạy. Test `CookieBanner.test.tsx:130-157` dùng `renderToString` + `hydrateRoot` trong `act`, có sẵn cookie đồng ý + `_ga`/`_ga_TEST1234`, rồi assert cookie còn nguyên, script được chèn, `ga-disable=false`. Đây đúng là đường hydrate thật. Browser (journal): reload vẫn giữ `_ga`, chỉ 1 request gtag. |
| MINOR-1: nút footer chết khi không có GA ID | **Đã sửa** | `PublicShell.tsx:22-26` tính `showCookieSettings` ở server từ site-settings, không đọc cookie nên vẫn an toàn CDN. `Footer.tsx:73-75` render có điều kiện. Test `PublicShell.test.tsx:89-92`. Điều kiện ẩn nút trùng với điều kiện `CookieBanner` lắng nghe sự kiện (`isValidGaMeasurementId`), nên không còn trạng thái lệch. |
| MINOR-2: focus rơi về body | **Đã sửa** | `CookieBanner.tsx:81-84` lưu `document.activeElement` lúc mở. `:94-99` `onCloseAutoFocus` luôn `preventDefault`, rồi focus nút đã mở dialog nếu nút còn trong DOM, không thì `main#main`. Prop được truyền qua `ConsentPreferences.tsx:15,28`. Test `:208-221` (từ banner → main), `:223-240` (từ footer + Esc → về nút). |
| MINOR-3: note as-built (pv, dialog) | Primary xử lý lúc close-out, không chặn |
| Phán quyết R1 số 5 (CSP cho GA) | **Đã làm** | `layer-14-task-01.md:101-102` có đủ `script-src`/`connect-src`/`img-src` + bước kiểm |
| Phán quyết R1 số 4 (kiểm browser) | **Có evidence** | journal `:29`: 375/768/1280 không cuộn ngang, nút ≥44px, FloatingContact không bị che (offset 238px ở 375); đồng ý → reload giữ `_ga`; từ chối → không gtag/`_ga`; rút lại → xoá `_ga*` + `ga-disable`; focus về đúng chỗ. Server đã tắt, dữ liệu site_settings test đã xoá. |

## Regression check
- Khi `decided` đổi từ `undefined` sang `null` (chưa chọn, hoặc đổi `privacyPolicyVersion`): `GoogleAnalytics enabled=false` mount, đặt cờ disable và xoá `_ga*`. Cách này đúng với privacy: chưa đồng ý với bản chính sách hiện hành thì không giữ cookie phân tích.
- Hydrate HTML: server snapshot vẫn `UNREAD`, chỉ render dialog đóng, không có `<section>` (test `:114-128`). An toàn cache.
- `consent-cookie.ts` được import vào `PublicShell` (server component). File chỉ đụng `document`/`window` bên trong hàm, nên import ở server không lỗi (build PASS).
- Fixture `PublicShell.test.tsx` đã thêm `consent` và mock `matchMedia`. Mock `next/navigation` đổi sang spread `importOriginal`, không ảnh hưởng test khác (991 PASS).

## Acceptance Criteria (cả task)
| AC | Kết quả |
|---|---|
| Chưa chọn/từ chối → không gtag, không `_ga` | OK (test `:49-64` + browser) |
| Đồng ý → gtag đúng ID; không ID → không banner | OK (`:66-72`, `:106-112`) |
| Đổi `privacyPolicyVersion` → hỏi lại | OK (`:92-97`) |
| Rút lại → xoá `_ga*`, lần sau không GA4 | OK (`:185-206` + browser) |
| Banner render client sau hydrate, fixed, không bẫy focus; dialog modal chuẩn | OK |
| HTML không đổi theo cookie | OK |
| Follow-up `--floating-bottom-offset` | OK (`:167-181` + browser 238px) |

## Findings

Không có CRITICAL hoặc MAJOR.

### [MINOR-A] Focus rơi về `<body>` sau khi bấm "Từ chối"/"Đồng ý" trên banner
- `src/components/consent/CookieBanner.tsx:114,150-155`: chọn xong thì `Banner` unmount ngay, nút đang có focus biến mất. Lỗi này cùng loại với MINOR-2 nhưng ở đường banner, không qua dialog. Không chặn vì banner không phải modal và §3.10 không quy định đích focus.
- **Fix đề xuất (tuỳ chọn):** trong `choose`, nếu `document.activeElement` nằm trong banner thì focus `main#main` sau khi ghi cookie.

### [MINOR-B] Task file chưa ghi evidence round 2
- `tasks/tami-website/layer-5-task-07.md:54-68` vẫn ghi `Attempt: 0`, Feature Verification/Doc Impact còn `pending`. Evidence browser hiện chỉ có trong Run Journal. Primary cần chép evidence browser, attempt=2 và note as-built (MINOR-3) vào task file lúc close-out.

## Responsive Checklist Gate (diff đụng UI)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll 375/768/1280 | OK | Browser (journal :29) + CSS math: `fixed inset-x-2`, `md:w-[420px]` (436px < 768px) |
| Mobile-first `min-width` | OK | chỉ prefix `md:`; `matchMedia("(min-width: 768px)")` |
| Grid auto-fit | N/A | không có grid |
| Container không fixed px | OK | 420px là hộp banner desktop theo §3.10, không phải container trang |
| Font rem / heading fluid | OK / N/A | token `text-small`/`text-body` |
| Media | N/A | |
| Touch ≥44×44 | OK | `h-11`, `min-h-11`, switch `after:-inset-y-2`; browser xác nhận ≥44px |
| Nav mobile / table | N/A | |
| Không `100vh` | OK | không dùng |
| reduced-motion | OK | chỉ có transition của switch theo token toàn cục |
| Không che lỗi bằng overflow:hidden | OK | |
| FloatingContact không bị đè | OK | offset 238px ở 375 (browser); gỡ biến khi ≥md/đóng banner |

## Skill gates
- aislop: skip, chưa cài `aislop`.
- oxlint (anti-slop): skip, chưa cấu hình oxlint. ESLint PASS.
- ocr (open-code-review): skip, chưa cài `ocr`.
- AI-readable: OK, 0 indicator. Tên rõ; hàm ≤50 dòng (`CookieBanner` ≈55 dòng tính cả JSX/comment, logic tách hook/hàm con, chấp nhận); file ≤170 dòng; hằng số có tên; comment giải thích WHY (`:92-93`, `:112`).
- ai-friendly-web: N/A (không thêm route/crawl surface).
- blitzstrike: skip, không có môi trường được phép. Soát tay: không có input server; GA ID kiểm regex + `encodeURIComponent`; không dùng `dangerouslySetInnerHTML`.
- Surgical diff (karpathy): OK. Mọi thay đổi trace về task/finding R1. Thay đổi `progress.json` (inProgressTask + decision) là tracking hợp lệ.

## Residual risk
- Reviewer không tự kiểm browser. Kết quả responsive và hành vi `_ga` qua reload dựa vào evidence builder ghi trong journal + test hydrate.
- Không tự xác minh được việc test hydrate fail khi bỏ guard, vì reviewer không được sửa source. Builder khai đã xác nhận; theo phân tích thứ tự effect, khai báo này hợp lý.
- CSP cho GA phụ thuộc L14-T01 (đã ghi AC).

## Verdict
**PASS**: MAJOR-1, MINOR-1, MINOR-2 đã sửa, có test. Verify commands PASS. Không còn CRITICAL/MAJOR. MINOR-A tuỳ chọn; MINOR-B/MINOR-3 primary xử lý lúc close-out.
