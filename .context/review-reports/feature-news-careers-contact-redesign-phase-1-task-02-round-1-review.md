Agent: reviewer

# Review — feature-news-careers-contact-redesign · phase-1-task-02 · round 1

Task: Khối mới trong trình soạn bài Tin tức + render web (BL-054 Quyết định 3)
Code: worktree `.worktrees/feature-news-careers-contact-redesign__phase-1__task-02` (chưa commit, base staging 1272255)

## Review level
**STRICT**

## Reason
`RichText` là renderer dùng chung cho mọi trang chi tiết (rủi ro XSS / danh sách cho phép), editor admin (`rich-text-editor.ts` dùng chung), bộ dịch tự động (`translation/lexical.ts`, kiểm khung cây), truy vấn công khai dự án (`project-queries.ts`, có thể lộ dữ liệu nháp), CSS admin toàn cục.

## Blast radius
- `src/components/content/RichText.tsx` (9 nơi dùng: tin tức, dự án, dịch vụ, việc làm, pháp lý, AboutBlock, DetailOverviewIntro...): thêm nhánh `case "block"` → `renderNewsBlock` (lọc theo `blockType`). Nơi khác không truyền `mentionedProjects` và editor của chúng không có BlocksFeature.
- `src/lib/admin/rich-text-editor.ts`: thêm tham số `blocks` tuỳ chọn, mặc định `[]` → editor toàn cục không đổi (integration test xác nhận `resolvedFeatureMap` toàn cục không có `blocks`).
- `src/collections/News.ts`: chỉ `content` dùng editor có khối. Không migration (dữ liệu trong JSON lexical).
- `src/lib/translation/lexical.ts`: gom chữ / ghép / skeleton → mọi collection có richText được dịch.
- `src/lib/projects/project-queries.ts`: `cardsByIds` được export và đổi tên, không đổi logic (`findPublicList` + `limit: ids.length`).
- `src/lib/news/read-time.ts`, `src/components/admin/styles/_forms.scss`, i18n `newsBlocks`, `payload-types.ts`, `importMap.js`, fixture test news.

## Verify commands + result (chạy trong worktree)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS: 0 lỗi, 2 warning có sẵn ở `tools/task-dashboard/server.mjs`, không thuộc task |
| `pnpm vitest run src/blocks src/components/content src/lib/translation src/lib/news tests/integration/news.test.ts` | PASS: 13 file / 175 test. Integration có chạy với DB worktree (có log "Pulling schema from database", không bị skip) |
| `pnpm build` | không chạy lại. Builder báo PASS. Typecheck + test đủ phủ diff này; build còn lại là residual risk thấp |

## Kiểm trọng tâm
- **Escape / không HTML thô:** OK. Mọi chữ của khối render qua React text (`StatHighlights`, `ImageText` `<p>{text}</p>`, `ProjectMention`). Không có `dangerouslySetInnerHTML`. Test `NewsBlock.test.tsx:63-64` đưa `<b>`/`<img onerror>` vào và kiểm chúng bị escape. `href` của thẻ dự án lấy từ `toProjectCardData` (dữ liệu dựng phía server), không lấy từ JSON bài.
- **Khối lạ bị bỏ:** OK. Trong `NewsBlock.tsx:43-60` các nhánh `switch` khác đều về `default: return null`; `fields` không phải object → null. Có test ở `NewsBlock.test.tsx:132`.
- **Dự án nháp / không có bản EN ở `/en`:** OK. `loadMentionedProjects` luôn tải qua `findPublicProjectCardsByIds` → `findPublicList` (`publicWhere`: published, chưa xoá mềm, `/en` thì `hasEnglish = true`). Chỉ nhận UUID, tối đa 20 id, 1 truy vấn chạy trong `Promise.all`. Trường `project` đặt `maxDepth: 0` nên REST/GraphQL của `news` chỉ trả id, không populate dữ liệu dự án nháp.
- **Dịch không hỏng khung cây:** OK. `walkSlots` chỉ đi qua ô chữ khai trong `NEWS_BLOCK_TEXT_FIELDS`. `skeletonOf` che đúng các ô đó nên id / `blockType` / `project` / `image` / `imagePosition` khác nhau thì vẫn ra `invalid_output`. Test end-to-end `translation-service.test.ts` xác nhận không gửi id dự án hay `imagePosition` và bài dịch giữ nguyên cấu trúc.
- **Read-time:** OK. Có đếm chữ trong khối, không đếm `projectMention` và khối lạ (`news-view.test.ts`).
- **Editor collection khác:** OK. Có integration test.
- **CSS admin:** OK. Luật mới chỉ áp trong `.rich-text-lexical__wrap` của trường `tami-required` và `.toolbar-popup__dropdown-blocks`, mà dropdown này chỉ có khi bật BlocksFeature.
- **Spec coverage:** đủ (a)(b)(c), nhãn admin tiếng Việt, chữ khối localized, dịch đi qua chữ khối, renderer dùng danh sách cho phép, không đổi bảng DB. Lệch so với scope §2 ("dùng dữ liệu populate nếu có"): builder ghi rõ trong task và có lý do hợp lệ (populate không lọc `hasEnglish`). Cách này chặt hơn spec nên chấp nhận.

## Responsive Checklist Gate (diff đụng UI: 3 component khối)
Không chạy được trình duyệt. Xác minh bằng CSS math; builder có bằng chứng trình duyệt ở 1440 và 375.
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | Wrapper `RichText` có `break-words [overflow-wrap:anywhere]`. Ô số có `min-w-0`. `ImageText` có `min-w-0 flex-1`. `ProjectMention` có `min-w-0 flex-1` |
| Mobile-first | OK | Base `flex-col` / `grid-cols-2`, lên `sm:`/`md:` theo `min-width` |
| Grid | OK | Stat: 1–4 mục → base 1–2 cột, `md:` 3–4 cột. Số cột theo số mục (1–4), không cố định px |
| Container không fixed px | OK | Chỉ `sm:w-40` cho ảnh thẻ khi ≥ 640px. `md:w-5/12` là tỉ lệ |
| Typography | OK | Token `text-h2` / `text-h4` / `text-body` / `text-small` / `text-eyebrow` của design system |
| Media | OK | `ResponsiveImage` có `sizes` + `aspectRatio="4/3"` / `aspect-[4/3]` |
| Touch target | OK | Cả thẻ dự án là một link (thẻ lớn, padding `p-3`/`p-4`) |
| Nav / table | N/A | Diff không đụng nav hay bảng |
| 100vh / reduced-motion / overflow:hidden che lỗi | OK / N/A | Không dùng `vh`. Hiệu ứng zoom là `CARD_IMAGE_ZOOM` dùng chung (ngoài scope). `overflow-hidden` chỉ để bo góc ảnh |
| 768 | OK (CSS math) | Ở `md` (≥ 768): ImageText chuyển sang hàng ngang; stat 4 mục ra 4 cột trong khung `max-w-[68ch]`, giá trị tối đa 16 ký tự xuống dòng nhờ `overflow-wrap:anywhere` |

## Skill gates
- aislop: skip, chưa cấu hình trong `.context/project-config.md` nên lệnh chưa nằm trong danh sách verify được phép
- oxlint (anti-slop): skip, oxlint chưa cấu hình. Thay bằng `pnpm lint` (eslint): 0 lỗi
- ocr (open-code-review): skip, ocr chưa cài
- AI-readable: OK. Tên rõ, hàm ngắn (< 50 dòng), file nhỏ, hằng số có tên (`STAT_HIGHLIGHTS_MAX`, `MAX_MENTIONED_PROJECTS`, `UUID_PATTERN`). Comment dài nhưng giải thích WHY. Có 1 comment lỗi thời (MINOR-1). Dưới 3 indicator
- ai-friendly-web: N/A, không thêm route hay trang public mới (chỉ thêm khối trong trang đã có)
- blitzstrike: skip, chưa cài hoặc không có môi trường được phép. Đã review XSS thủ công như trên

## Findings
### [CRITICAL]
Không có.

### [MAJOR]
Không có.

### [MINOR]
1. `src/blocks/news/index.ts:6`: comment ghi "phải thêm vào `BLOCK_TEXT_FIELDS` của bộ dịch", nhưng tên thật là `NEWS_BLOCK_TEXT_FIELDS` và nằm ở `src/blocks/news/text-fields.ts`, không ở bộ dịch. Fix: sửa comment trỏ đúng tên và file.
2. `src/blocks/news/index.ts:35-36` + `src/lib/translation/lexical.ts`: `value` (≤ 16) và `label` (≤ 80) được gửi đi dịch. Nếu bản EN vượt `maxLength`, job dịch ném `ValidationError` (`src/jobs/translate-content.ts:143-144`) và cả bài dịch bị `failed`, không chỉ khối đó. Đây là cơ chế có sẵn cho mọi trường có `maxLength` và rủi ro thấp (VI→EN thường ngắn hơn). Đề xuất (không chặn): ghi residual risk vào task hoặc dặn prompt giữ nguyên số liệu ngắn.
3. `src/components/admin/styles/_forms.scss:119`: chữ "Chèn khối" viết cứng trong CSS `content`. Admin chỉ có tiếng Việt và có tiền lệ "Thêm mới", nên chấp nhận được. Chỉ ghi lại.

## Residual risk
- `pnpm build` không được reviewer chạy lại (builder báo PASS).
- Không có trình duyệt để xem admin toolbar "Chèn khối" và render ở 768px. Phần này chỉ xác minh bằng CSS math và bằng chứng builder ghi trong task.
- Doc impact (`docs/DESIGN.md`, `docs/ERD.md` §4.8) đã hoãn sang close-out của primary. Primary phải reconcile trước khi commit.

## Verdict
**PASS**. Không có CRITICAL hay MAJOR. 3 MINOR không chặn.
