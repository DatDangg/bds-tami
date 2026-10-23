# seed/content — bộ nội dung thật nhập vào DB (BL-072)

`pnpm content:import [apply]` (`scripts/import-content.ts`, engine `import.ts`, phần thuần `import-plan.ts`) nhập **3 dự án** (Maison Privée, Astor 1, The Windsor Collection), 3 chủ đầu tư và **8 tin pháp lý** của bộ `2026-10-23` (đã duyệt 2026-10-23).

- **Chỉ tạo mới, chỉ locale `vi`.** Bản ghi đã có (khớp theo slug dự án/tin, tên chủ đầu tư/danh mục, alt ảnh) được bỏ qua, không cập nhật/xoá. EN → gói EN (`seed/english/README.md` § "Gói EN").
- **Mặc định dry-run:** chỉ đọc DB, in `sẽ tạo` / `đã có, bỏ qua`, kiểm đủ file ảnh dưới `IMPORT_IMG_DIR`, đủ ảnh bìa, không còn `[CẦN KIỂM TRA]`, đủ danh mục/tỉnh/admin; exit 1 nếu còn lỗi.
- **Ghi thật:** `pnpm content:import apply` với env `IMPORT_CONFIRM=2026-10-23` (= tên thư mục bộ dữ liệu). Chạy được ở dev/staging/production (không còn chặn `APP_ENV=production` cứng); `apply` dry-run lại trước và dừng nếu còn lỗi. Quy trình staging/prod: `docs/runbooks/english-pack.md`.
- Env khác: `IMPORT_IMG_DIR` (bắt buộc), `IMPORT_STATUS` (`published` mặc định | `draft`).

## Dữ liệu trong `2026-10-23/`

- `projects-data.mjs` — `DEVELOPERS`, `PROJECTS` (rich text viết markdown, script đổi sang Lexical). Tên loại sản phẩm (`products[].type`) đã là tên rút gọn cuối cùng (bước đổi tên của `fix-data.ts` cũ đã gộp vào đây, để `vi` trên DB mới = `vi` trên staging).
- `news/*.md` — 8 tin (frontmatter + markdown). Đây là **nguồn duy nhất** của tin trong repo (`docs/content-intake/` chỉ là bản nháp ngoài repo, không dùng khi chạy).
- `news-covers.json` — `{ "<slug tin>": { file, alt } }` ảnh bìa; đường dẫn tính từ `IMPORT_IMG_DIR`.

## Ảnh (không commit, 184 MB)

`IMPORT_IMG_DIR` = thư mục ảnh, chứa `manifest.json` (`{ "<slug dự án>": { gallery, floorPlans, documents, amenitiesImage, locationImage } }`). Đường dẫn trong `manifest.json` và `news-covers.json` tính từ thư mục đó; tiền tố `img/` của bản cũ (`img/astor-1/x.jpg`) được bỏ qua nên thư mục `.import-tmp/img` hiện có dùng trực tiếp: `IMPORT_IMG_DIR=.import-tmp/img`. Ảnh được tải lên theo `alt` (đã có alt đó thì dùng lại, không tải trùng). `.import-tmp/` đã nằm trong `.gitignore`.

Chạy trong container: `docker cp <thư-mục-ảnh>/. <app>:/tmp/import-img` rồi `docker exec -e IMPORT_IMG_DIR=/tmp/import-img <app> pnpm content:import`.

Test: `tests/unit/import-content-plan.test.ts` (confirm, markdown, frontmatter, kế hoạch tin), `tests/integration/import-content.test.ts` (DB tạm: dry-run không ghi, thiếu confirm bị từ chối, apply tạo đúng, chạy lại `đã có`; tin không nằm trong test tích hợp vì config test không có collection `news`).
