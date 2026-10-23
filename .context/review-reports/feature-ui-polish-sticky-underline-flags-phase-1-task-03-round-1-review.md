Agent: reviewer

# Review — feature-ui-polish-sticky-underline-flags · phase-1-task-03 · round 1

- Task: `tasks/feature-ui-polish-sticky-underline-flags/phase-1-task-03.md` (BL-074 mục 3: cờ đổi ngôn ngữ 3:2, nhỏ hơn, ring chọn mảnh hơn)
- Diff: `git diff -- src`, 4 file: `src/components/layout/flag-icons.tsx`, `flag-icons.test.tsx`, `LanguageSwitcher.tsx`, `LanguageSwitcher.test.tsx`

## Review level
STRICT

## Reason
`LanguageSwitcher` là component dùng chung cho header, menu toàn màn hình và footer, nên theo luật thuộc nhóm STRICT. Phạm vi hẹp: chỉ đổi giao diện, không đụng API, schema, i18n, cookie hay href.

## Blast radius
- `LanguageSwitcher` ở header (tone on-light, nền kính), menu toàn màn hình và footer (`on-dark` / `.theme-dark-block`).
- `FlagIcon` chỉ được `LanguageSwitcher` dùng.
- Không thay đổi a11y (`aria-label`, `title`, `lang`, `hreflang`, `aria-current`), đích link (`localeSwitchHref`) và cookie `NEXT_LOCALE`. Diff không có hunk nào ngoài khối class của span/svg và comment.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS, 4592/4592 |

## Kiểm tra theo yêu cầu
- **3:2 / viewBox:** cả hai cờ dùng `viewBox="0 0 30 20"`. Rect nền 30×20. OK.
- **Kích thước hiển thị:** span và svg đều là `h-3.5 w-[21px]`, tức 21×14. 21/14 = 1.5 trùng tỉ lệ viewBox nên không méo hay letterbox. Nhỏ hơn 24×24 cũ. OK.
- **Hình học sao VN (tự tính lại):** tâm (15,10), R = 20/3 ≈ 6.667, r = 0.382R ≈ 2.547, đỉnh hướng lên.
  - Đỉnh ngoài: (15, 3.33), (15+R·cos18°, 10−R·sin18°) = (21.34, 7.94), (15+R·cos54°, 10+R·sin54°) = (18.92, 15.39), đối xứng (11.08, 15.39) và (8.66, 7.94).
  - Đỉnh trong: (16.50, 7.94), (17.42, 10.79), (15, 12.55), (12.58, 10.79), (13.50, 7.94).
  - Khớp toàn bộ 10 điểm trong `STAR_POINTS` (sai lệch ≤ 0.01 do làm tròn). Sao đối xứng qua x = 15 và tâm vòng ngoại tiếp tại (15,10), nên sao nằm giữa.
  - R = 1/3 chiều rộng (cạnh ngắn = 20) đúng với tỉ lệ "đường kính ngoại tiếp = 2/3 chiều rộng" mà builder trích. Task ghi "1/5 chiều dài = 6". Ở 14px hiển thị, hai giá trị chênh khoảng 0.47px, mắt không thấy. Xem MINOR-1.
- **Union Jack:** nền #012169. Chéo trắng 4 / đỏ 1.6, chữ thập trắng 6 / đỏ 3.4, vẽ chéo trước rồi chữ thập. So với cờ thật quy theo chiều cao 20 (chéo trắng 4, đỏ ≈1.33; thập trắng ≈6.67, đỏ 4) thì tỉ lệ hợp lý. Phần nét chéo tràn ra ngoài bị viewBox cắt (svg mặc định overflow hidden, span cũng `overflow-hidden`). Cờ vẫn nhận ra được. Không có counterchange, nhưng đây là giản lược đã ghi rõ trong comment, chấp nhận được. OK.
- **Ring đang chọn:** `ring-[1.5px] ring-accent-text ring-offset-1` thay cho `ring-2 … ring-offset-2`, tức mảnh hơn.
  - Trong Tailwind v4, `ring-[1.5px]` là độ dày (giá trị độ dài).
  - tailwind-merge 3 coi `ring-[1.5px]` là ring-width nên bỏ `ring-1`, và bỏ `ring-black/20` vì có `ring-accent-text`. Hành vi giống trước khi sửa.
  - Không chỉ phân biệt bằng màu: cờ còn lại mờ 60% (class giữ nguyên, test kiểm) và ring có offset tạo khung bao hình học. OK.
- **Tương phản ring:**
  - Nền sáng: `--color-accent-text` #8c6733 (L≈0.155) so với kính #FAF8F6 (L≈0.94) cho khoảng 4.8:1.
  - Nền tối: `.theme-dark-block` đổi `--color-accent-text` sang `--color-on-dark-accent`, so với #111 cho khoảng 10:1 theo số builder đo. Màu token không đổi so với trước.
  - Cả hai ≥ 3:1. OK.
- **Vùng bấm:** link vẫn `min-h-11 min-w-11` (44×44), `gap-1` giữ nguyên. OK.
- **Bố cục header < sm / sm / xl:** cờ nằm trong link 44×44 nên bề rộng group không đổi (92×44). Thu nhỏ cờ không thể làm tăng bề rộng, nên không có nguy cơ vỡ hàng hay cuộn ngang. OK (lập luận bằng CSS).
- **Test:**
  - `flag-icons.test.tsx` kiểm viewBox 30×20, class kích thước, sao 10 điểm, đỉnh (15,3.33), tâm ngang 15.
  - `LanguageSwitcher.test.tsx` kiểm `ring-[1.5px]`, `ring-offset-1`, `h-3.5 w-[21px]`, `aria-current`, opacity 60%.
  - Các test này kiểm đúng hành vi mới. OK.

## Responsive Checklist Gate
Phạm vi gate: chỉ đổi kích thước icon bên trong vùng bấm cố định 44×44.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang 375/768/1280 | OK | Cờ 21px nhỏ hơn 24px cũ, nằm trong link `min-w-11`, group không rộng thêm. Builder đo được sw=iw=375 |
| Mobile-first / grid / container | N/A | Diff không đổi grid, container hay media query |
| Typography rem / clamp | N/A | Không có chữ (group textContent rỗng) |
| Media: tỉ lệ ảnh | OK | Box 21×14 trùng tỉ lệ viewBox 3:2, không méo |
| Touch target ≥ 44×44 | OK | `min-h-11 min-w-11` giữ nguyên |
| Nav mobile / table | N/A | Không đổi |
| 100vh / reduced-motion / overflow che lỗi | N/A | Không thêm animation. `overflow-hidden` trên span có từ trước, dùng để bo góc cờ, không che lỗi bố cục |

## Skill gates
- aislop: skip, không có trong verify allowlist. Diff nhỏ và rõ ràng, không có dấu hiệu slop.
- oxlint (anti-slop): skip, oxlint chưa được cấu hình (không có `.oxlintrc*`). ESLint PASS.
- ocr (open-code-review): skip, ocr chưa cài.
- AI-readable: OK. Tên rõ ràng, comment giải thích lý do (quy định quốc kỳ, giản lược Union Jack) chứ không mô tả lại code. Toạ độ sao là hằng số có comment nguồn gốc. 0 indicator.
- ai-friendly-web: N/A, chỉ đổi icon trong component.
- blitzstrike: N/A, không có bề mặt bảo mật.

## Findings
- **[MINOR-1]** `src/components/layout/flag-icons.tsx` (comment `STAR_POINTS`): R = 20/3 khác giá trị trong task ("1/5 chiều dài = 6").
  - Builder đã ghi lý do trong Decision log.
  - Reviewer không kiểm chứng được văn bản quy định nào đúng, vì không có quyền tra cứu ngoài.
  - Ở cỡ hiển thị, chênh lệch khoảng 0.47px. Không chặn PASS.
  - Đề xuất: change-request chốt một nguồn khi reconcile design-spec §2.3.
- **[MINOR-2]** `src/components/layout/LanguageSwitcher.tsx:50`: ring 1.5px ở DPR 1 sẽ được khử răng cưa thành khoảng 1–2px, nên trông hơi mờ.
  - Vẫn phân biệt được nhờ offset và opacity 60% của cờ còn lại.
  - Chỉ ghi nhận. Nếu muốn nét sắc thì có thể dùng `ring-1`.
- Không có CRITICAL hay MAJOR.

## Residual risk
- Reviewer không có browser nên không xác minh bằng ảnh. Bố cục, tương phản và độ nét ring dựa trên tính toán CSS/token cùng số đo builder đã báo cáo.
- Ring offset dùng màu kính trong mờ (`ring-offset-glass`, alpha 0.8). Khi header nằm trên ảnh hero, nền thực tế có thể tối hơn #FAF8F6. Đây là hành vi có từ trước, diff không đổi.

## Verdict
PASS
