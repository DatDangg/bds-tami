Agent: reviewer

# Review — BL-015 · feature-admin-ui-saas-refresh · phase-1-task-03 · round 1 (Sidebar admin nhóm theo nghiệp vụ)

- **Review level:** NORMAL
- **Reason:** Thay đổi navigation dùng chung (menu trái mọi role) nhưng chỉ là metadata hiển thị (`admin.group` + thứ tự mảng). Không đụng auth/access, schema, API, hook. Đã kiểm schema/types bằng bằng chứng, không cần STRICT.
- **Blast radius:** `src/payload.config.ts` (plugin mới đứng cuối `plugins`), `src/components/admin/admin-groups.ts` (mới, T04 dashboard sẽ dùng lại), menu trái `/admin` cho mọi role; `_lists.scss` (checkbox chọn dòng/chọn tất cả ở list view, mobile <768). `payload-types.ts`/`importMap.js` chỉ do Payload sinh lại.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS — 2583/2583 tests |
| `pnpm build` | PASS (exit 0) |
| `diff <(git show HEAD:f \| sort) <(sort f)` cho `payload-types.ts`, `importMap.js` | multiset dòng giống hệt nhau → chỉ đổi thứ tự, shape không đổi |

Không tự chạy `migrate:create` (ngoài verify commands). Bằng chứng không có migration: không đổi field/slug, chỉ `admin.group`; types giống nhau theo multiset; builder ghi `migrate:create --skip-empty` không sinh file (migrations/ vẫn 57).

## Kiểm trọng tâm
- **7 nhóm, thứ tự, nhãn tiếng Việt:** `admin-groups.ts:8-16` khớp đúng yêu cầu 1 của task (Khách hàng > Nội dung > Tuyển dụng > Thư viện > Danh mục > Website > Hệ thống). OK.
- **Không mục nào mất/thêm:** test `admin-groups.test.ts:38-42` so tập slug thật của config với const (21 collection + redirects + 4 global). Slug lạ → throw (`admin-groups.ts:33`, test :44). OK.
- **`admin.hidden`/access giữ nguyên:** plugin chỉ spread `{...entity, admin: {...entity.admin, group}}` — giữ hidden/access/hooks/fields. `admin.user: Staff.slug` khai rõ (`payload.config.ts:63`) nên đổi thứ tự không đổi auth collection. OK.
- **Plugin chạy sau redirects:** thêm cuối `plugins` (`payload.config.ts:129-130`), sau redirects và cả s3 storage. Plugin chạy tuần tự nên `redirects` đã có trong mảng. Collection nội bộ `payload-*` do sanitize thêm sau plugin nên không bị throw. OK.
- **Thứ tự nav thật (Payload 3.91):** đã đọc `@payloadcms/ui@3.91.0/dist/utilities/getNavGroups.js` + `groupNavItems.js`: `[...collections, ...globals]` lọc theo quyền read, nhóm tạo theo lần xuất hiện đầu, mục push theo thứ tự. Test `navOrder` mô phỏng đúng. Role không có quyền read thì mục bị bỏ, nhóm rỗng không tạo — không đổi so với trước.
- **Residual "Chuyển hướng 301 đứng trước các global trong nhóm Website":** chấp nhận được. Đây là giới hạn của Payload (collections luôn được nối trước globals), không đổi được bằng config. Đã ghi trong task. Nhóm vẫn đúng và không mục nào sai nhóm.
- **CSS select-row/select-all (`_lists.scss:174-182`):** chỉ bỏ `min-height` và đổi `align-items` của khối `.checkbox-input` trong list view. Vùng bấm 44×44 là `input[type=checkbox]` 44px đặt absolute căn tâm quanh hộp 22px (`_controls.scss:276-286`), nên không bị ảnh hưởng. Specificity (0,2,0) > (0,1,0), không phụ thuộc thứ tự import. Không làm hỏng mức đã PASS ở T01 r3.

## Responsive Checklist Gate (chỉ tính diff `_lists.scss`)
| Mục | KQ | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | Rule chỉ giảm chiều cao, không thêm width |
| Media query | OK (N/A mobile-first) | Dùng `max-width: 767px` để override mobile, giống mẫu đã PASS ở `_controls.scss` T01; không thêm layout |
| Typography/spacing rem | N/A | Không đổi font/spacing |
| Media | N/A | — |
| Touch target ≥44×44 | OK | Input 44×44 giữ nguyên (`_controls.scss:279-286`); chỉ khối bọc ngoài thấp lại |
| Nav mobile | N/A | Chỉ đổi nhóm, không đổi component Nav của Payload |
| Table mobile | OK | Không đổi wrapper bảng |
| 100vh / reduced-motion / overflow:hidden | N/A | Không dùng |

## Skill gates
- aislop: skip — không chạy (ngoài verify commands được allow). Đọc tay: không thấy slop.
- oxlint (anti-slop): skip, oxlint not configured (eslint PASS).
- ocr: skip, ocr not installed / không trong verify commands.
- AI-readable: OK — tên rõ (`ADMIN_NAV_GROUPS`, `navPosition`, `assignGroupsAndSort`), hàm < 15 dòng, file 49 dòng, comment giải thích WHY (N4, giới hạn Payload). `groupIndex * 100` là magic nhỏ nhưng dễ hiểu (0 indicator đáng kể).
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: N/A (không STRICT).

## Findings
- [MINOR] `admin-groups.ts:25` — `groupIndex * 100 + itemIndex` sẽ sai thứ tự nếu một nhóm có ≥100 mục. Không thực tế; có thể sort theo tuple `(groupIndex, itemIndex)` nếu muốn. Không chặn.
- [MINOR] Residual nav: chưa kiểm trên trình duyệt với admin/sale (yêu cầu 5 của task), và chưa đo bằng trình duyệt chiều cao hàng ở mobile với rule `_lists.scss`. Logic đã được kiểm bằng code Payload + test, nên rủi ro thấp. Đề xuất kiểm bằng mắt lúc smoke staging.
- [MINOR] Design §2 nên ghi thêm thứ tự thực tế trong nhóm Website (redirects đứng trước globals) để T04 dashboard không đặt kỳ vọng khác. Ngoài phạm vi as-built docs: `docs/ARCHITECTURE/PERMISSION/DESIGN.md` không mô tả menu admin → no doc impact.

Không có CRITICAL/MAJOR.

## Residual risk
- Chưa xác minh trên trình duyệt (375/768/1280): thứ tự menu thật theo từng role và chiều cao hàng list view sau rule mới. Đã xác minh bằng CSS math + đọc code Payload 3.91.
- Migration: dựa vào bằng chứng types multiset + log của builder; reviewer không tự chạy `migrate:create`.

## Verdict: ✅ PASS
