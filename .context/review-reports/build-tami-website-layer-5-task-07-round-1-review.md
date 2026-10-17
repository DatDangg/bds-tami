Agent: reviewer

# Review: build/tami-website layer-5-task-07, round 1 (cookie consent banner + GA4 sau đồng ý)

- **Review level:** STRICT
- **Reason:** dữ liệu cá nhân/consent (LGL-03), script bên thứ ba (gtag), thay đổi shared shell (`ShellView`, `PublicShell` trên mọi trang công khai), an toàn cache CDN.
- **Blast radius:** mọi trang công khai (vi/en) qua `PublicShell` → `CookieBanner`; `ShellView` contract (`shell-data.ts`, `load-shell.ts`, test fixture); cookie `tami_consent`, `_ga*` trên domain; `FloatingContact` (biến `--floating-bottom-offset`); footer `CookieSettingsButton`; i18n `layout.consent`; Payload admin (`importMap.js`); số liệu GA4.
- **Scope reviewed:** uncommitted diff vs HEAD `2f9c5f7` (bỏ qua `.claude/launch.json`).

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm lint` | PASS (0 lỗi) |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS — 95 files, 987 tests |
| `pnpm build` | PASS; không sinh thêm thay đổi ngoài `importMap.js` đã có trong diff |

Không chạy app/browser (ngoài quyền reviewer) → xem Residual risk.

## Acceptance Criteria
| AC | Kết quả | Bằng chứng |
|---|---|---|
| Chưa chọn/từ chối → không gtag, không `_ga` | OK | `GoogleAnalytics.tsx:41-46` chỉ `loadGtag` khi `enabled`; test `CookieBanner.test.tsx:49-64` |
| Đồng ý → gtag đúng ID; không ID → không banner | OK (chức năng) / xem MAJOR-1 về dữ liệu | `CookieBanner.tsx:71,95,98`; test `:66-72,106-112` |
| Đổi `privacyPolicyVersion` → hỏi lại | OK | `consent-cookie.ts:41-43`; test `:92-97` |
| Rút lại (footer) → xoá `_ga*`, lần sau không GA4 | OK | `GoogleAnalytics.tsx:45-46`, `consent-cookie.ts:85-96`; test `:156-177` |
| Banner client sau hydrate, overlay fixed, không bẫy focus; dialog modal chuẩn | OK | `CookieBanner.tsx:72` (server snapshot `UNREAD`), `:117` `fixed`; Radix Dialog; test Esc `:179-190` |
| HTML không đổi theo cookie | OK | server snapshot luôn `UNREAD` → null; test `:114-128`; `buildConsent` chỉ đọc site-settings |
| Follow-up `--floating-bottom-offset` | OK | `CookieBanner.tsx:35-55`, `FloatingContact.tsx:46`; test `:138-152` |
| Tests cần viết (RTL từ chối/đồng ý; parse cookie hỏng) | OK | `CookieBanner.test.tsx`, `consent-cookie.test.tsx` |

## Findings

### [MAJOR-1] Khách đã đồng ý bị xoá `_ga`/`_ga_<ID>` ở MỌI lần tải trang đầy đủ → GA4 tạo client_id/session mới mỗi lần tải (số liệu users/sessions hỏng)
- `src/components/consent/CookieBanner.tsx:72-77,98` + `src/components/analytics/GoogleAnalytics.tsx:39-47`.
- Khi hydrate, `useSyncExternalStore` dùng `getServerSnapshot` (`UNREAD`) → `decided === undefined` → `<GoogleAnalytics enabled={false}>` được commit. Passive effect của con chạy trước effect `updateStoreInstance` của `useSyncExternalStore` ở cha, nên nhánh `enabled=false` chạy: đặt `ga-disable-<ID>=true` và **`clearGoogleAnalyticsCookies()`**. Ngay sau đó React re-render với snapshot thật → `enabled=true` → `loadGtag` → gtag.js không còn `_ga` → sinh client_id mới. Hệ quả: mỗi lần tải trang đầy đủ = một "user" mới, session mới; `generate_lead` (design-spec §3.5) không gắn được với hành trình.
- Test không bắt được vì `renderWithIntl` là client render (không hydrate) nên đọc snapshot client ngay.
- **Fix:** tách trạng thái "chưa biết" khỏi "không đồng ý": chỉ render `<GoogleAnalytics>` khi `decided !== undefined` (hoặc truyền `enabled: boolean | undefined` và bỏ qua khi `undefined`). Thêm test hydrate (`renderToString` + `hydrateRoot` trong `act`, có sẵn `tami_consent` analytics=true và `_ga=...`) assert `_ga` còn nguyên và script được chèn.

### [MINOR-1] Nút footer "Cài đặt cookie" hiện nhưng không làm gì khi chưa cấu hình GA ID
- `src/components/consent/CookieBanner.tsx:80-85` (chỉ lắng nghe khi `hasAnalytics`) + `src/components/layout/Footer.tsx:71` (luôn render). Control chết với người dùng/screen reader.
- **Fix:** truyền `hasAnalytics` (lấy từ `site-settings`, không phụ thuộc cookie nên vẫn an toàn CDN) xuống Footer để ẩn nút, hoặc vẫn mở dialog chỉ có mục "Cần thiết".

### [MINOR-2] Focus bị rơi về `<body>` sau khi Lưu dialog mở từ banner
- `CookieBanner.tsx:99-100`: lưu xong `decided` thành boolean → `Banner` unmount → Radix trả focus về nút "Tuỳ chọn" không còn tồn tại. Người dùng bàn phím mất vị trí.
- **Fix:** `onCloseAutoFocus` trên `DialogContent` → `preventDefault()` + focus `main#main` (hoặc phần tử ổn định) khi trigger không còn trong DOM.

### [MINOR-3] Ghi lại sai lệch so với design-spec §3.10 (cookie shape có `pv`; footer mở dialog thay vì banner)
- `consent-cookie.ts:2-5` đã chú thích trong code, nhưng task file (Doc/Decision Impact) và design-spec chưa ghi. **Fix:** ghi vào `Doc / Decision Impact` của task + note as-built ở §3.10 (không phải đổi intent).

### [MINOR-4] `importMap.js` lệch từ L5-T02/T03, chưa có gate bắt
- Đề xuất CI/verify kiểm `payload generate:importmap` không tạo diff (task riêng, không chặn task này).

Không có CRITICAL.

## Phán quyết các sai lệch builder khai báo
1. **Cookie `{v:1, analytics, ts, pv}`** — **Chấp nhận.** Thêm trường; không bỏ trường nào của spec; là cách duy nhất làm được "đổi version → hỏi lại". Cookie cũ thiếu `pv` coi là `""` nên vẫn hỏi lại khi đã có version. Không cần user quyết; ghi note as-built (MINOR-3).
2. **Footer mở dialog Tuỳ chọn thay vì banner** — **Chấp nhận.** Dialog cho thấy lựa chọn hiện tại và cho cả bật lẫn tắt Phân tích, đáp ứng ý định "mở lại để chọn lại / rút lại" của §3.10 và AC rút lại đồng ý. Ghi lại như decision/as-built note (MINOR-3); không cần spec delta.
3. **Sau khi rút lại, gtag đã tải chỉ bị tắt bằng `ga-disable-<ID>` tới lần tải lại** — **Chấp nhận.** Đây là cơ chế opt-out chính thức của Google, cờ được bật trước khi xoá cookie; lần tải sau không chèn script. Đạt AC.
4. **Builder chưa kiểm trên browser thật** — **Chưa đạt yêu cầu; reviewer cũng không chạy được** (không có quyền chạy app). MAJOR-1 là đúng loại lỗi mà kiểm trên browser (DevTools → Application → Cookies, tải lại trang) sẽ thấy. Round 2: builder phải kiểm trên browser (375/768/1280 + giữ `_ga` qua các lần tải lại) và ghi evidence vào task file.
5. **Chưa có CSP** — **Chấp nhận, hoãn sang L14-T01.** Nhưng `tasks/tami-website/layer-14-task-01.md` chưa nêu nguồn GA. Thêm vào AC của L14-T01: `script-src https://www.googletagmanager.com`, `connect-src https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com`, `img-src https://*.google-analytics.com https://*.googletagmanager.com`.

## Phán quyết `src/app/(payload)/admin/importMap.js`
Payload `pnpm build` sinh lại file này. 23 entry Lexical client/RSC là bắt buộc cho các trường richText của `services`/`news` (L5-T02/T03). Nếu thiếu, trình soạn thảo/ô Lexical trong admin báo lỗi không tìm thấy component trong import map. **Phải commit**, nhưng là drift từ L5-T02/T03, không thuộc task này. Nên commit riêng (`fix(build-tami-website): regen payload importMap cho Lexical (drift L5-T02/T03)`) trước hoặc sau commit task. Nếu gộp chung thì phải ghi rõ lý do trong commit body. Bản thân file không có lỗi (tự sinh, khớp output build).

## Responsive Checklist Gate (diff có đụng UI; kiểm bằng CSS math, không có browser)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll 375 | OK (CSS math) | `fixed inset-x-2` → rộng 359px; 2 nút `flex-1` khoảng 157px mỗi nút, nhãn ngắn; `md:w-[420px]` chỉ áp từ 768 (420+16 < 768) |
| Mobile-first `min-width` | OK | chỉ dùng prefix `md:` của Tailwind (min-width); `matchMedia("(min-width: 768px)")` |
| Grid auto-fit | N/A | không có grid |
| Container không fixed px | OK | `w-[420px]` là kích thước hộp desktop theo §3.10, không phải container trang |
| Font rem | OK | token `text-small`/`text-body` |
| Heading fluid | N/A | |
| Media | N/A | |
| Touch ≥44×44 | OK | Button `h-11` (test `:74-82`); link chính sách và "Tuỳ chọn" `min-h-11`; switch 28px + `after:-inset-y-2` → 44px; nút footer `min-h-11` |
| Nav mobile / table | N/A | |
| Không `100vh` | OK | không dùng |
| reduced-motion | OK | chỉ có `transition-*` của switch; theo token toàn cục |
| Không che lỗi bằng overflow:hidden | OK | |
| Layout 375/768/1280 | OK (CSS math) | <768: toàn chiều rộng, cách đáy `max(0.5rem, safe-area)`, FloatingContact được đẩy lên bằng biến offset; ≥768: hộp 420px góc dưới trái, không đụng nút nổi bên phải |
| In ấn | OK | `print:hidden` (§S16) |

## A11y / privacy / security / i18n gates
- Region: `<section aria-label="Cookie">` = landmark region (§3.10 OK). Không bẫy focus; nằm cuối DOM (`PublicShell.tsx:23`) → OK.
- Dialog: Radix bẫy focus, Esc (đã test), có nhãn/mô tả; switch có `label htmlFor` + `aria-describedby` → OK. Xem MINOR-2.
- Từ chối/Đồng ý ngang hàng: cùng size, `flex-1`, Outline/Dark đúng §3.10 → OK.
- Consent cookie: `Path=/; Max-Age=31536000; SameSite=Lax; Secure` (khi https); parse từ chối bản ghi > 12 tháng/ts tương lai; cookie hỏng/URI lỗi → null → OK.
- Rút lại: xoá `_ga`, `_ga_*`, `_gid`, `_gat*` trên host + các domain cha → OK.
- GA ID: regex `^G-[A-Z0-9]{4,}$` + `encodeURIComponent` → không chèn được script; không dùng `dangerouslySetInnerHTML` → OK.
- Cache CDN: không đọc `cookies()` ở server; HTML server cho banner luôn rỗng → OK.
- /en không có chữ tiếng Việt: test `:130-136`; `en.json` dịch đủ 14 key → OK.

## Skill gates
- aislop: skip, chưa cài `aislop` (`command -v aislop` không thấy).
- oxlint (anti-slop): skip, chưa cấu hình oxlint (không có `.oxlintrc.json`/`oxlint.json`). ESLint PASS.
- ocr (open-code-review): skip, chưa cài `ocr`.
- AI-readable: OK, 0 indicator. Tên rõ; hàm ≤ 50 dòng; file ≤ 150 dòng; hằng số có tên (`CONSENT_MAX_AGE_SECONDS`, `OFFSET_GAP_PX`); comment giải thích WHY.
- ai-friendly-web: N/A (task không thêm route/crawl surface).
- blitzstrike: skip, không cài/không có môi trường được phép. Đã soát thủ công: không có input server, GA ID được kiểm.
- ponytail/karpathy (surgical diff): OK. Mọi dòng đều trace về task/follow-up; `importMap.js` là drift được phán quyết ở trên.

## Residual risk
- Không kiểm trên browser thật (cả builder lẫn reviewer). Responsive chỉ kiểm bằng CSS math. MAJOR-1 suy ra từ thứ tự passive effect khi hydrate với `useSyncExternalStore`; cần builder xác nhận trên browser sau khi sửa.
- Đồng ý lại trong cùng trang sau khi rút lại: `loadGtag` chỉ bỏ cờ disable (script đã có), không gọi lại `config`. Page view tiếp theo dựa vào enhanced measurement (history change). Chấp nhận được.
- CSP (L14-T01) phải cho phép nguồn GA (sai lệch 5).

## Verdict
**FAIL**: 1 MAJOR (MAJOR-1). Sửa MAJOR-1 kèm test hydrate; nên sửa luôn MINOR-1/2 và ghi MINOR-3 vào task file; builder bổ sung evidence kiểm trên browser.
