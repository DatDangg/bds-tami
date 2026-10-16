# Design — Website TAMI (initial build)

- **Ngày:** 16/10/2026 · **Trạng thái:** ✅ đã duyệt 16/10/2026 (`/start` bước 2)
- **Spec:** `SPECIFICATIONS.md` v1.2.1 (spec validation round 2 PASS: `.context/review-reports/spec-validation.md`)
- **Nguồn chi tiết:** `docs/BRD.md` v1.5 · `docs/ARCHITECTURE.md` · `docs/ERD.md` · `docs/PERMISSION.md` · `docs/API_SPEC.md` · `docs/DESIGN.md`

File này **không** lặp lại docs. Nó chốt những quyết định cần duyệt trước khi chia layer và code.

## 1. Mục tiêu và phạm vi

Website thương hiệu TAMI: tạo niềm tin, nhận diện thương hiệu, thu lead cho sale. Song ngữ VI (mặc định) / EN (`/en`), bản EN do Claude API tự dịch. Một app Next.js + Payload CMS 3 gồm website công khai và `/admin`.

**Phạm vi build đầu (chốt 16/10/2026):** toàn bộ FR **Must** + **Should**. **Could** (FR-ADM-16 hẹn giờ xuất bản) xếp layer cuối. Ngoài phạm vi: theo `SPECIFICATIONS.md` § Ngoài phạm vi.

## 2. Phương án kiến trúc đã cân nhắc

| Phương án | Ưu | Nhược | Kết luận |
|---|---|---|---|
| **A. Next.js + Payload 3 trong một app** (Postgres) | Một codebase, một deploy; admin, auth, versions, localization, jobs có sẵn; REST tự sinh có `access` | Phụ thuộc vòng đời Payload 3; cần hiểu hook/access của Payload | ✅ **Chọn** (ARCHITECTURE §3) |
| B. Next.js + headless CMS tách rời (Strapi/Directus) | Tách được frontend/CMS | Hai service, hai lần deploy, đồng bộ type thủ công; tốn RAM trên server dùng chung | Loại |
| C. Next.js + admin tự viết + Prisma | Kiểm soát toàn bộ | Phải tự làm admin, phân quyền, versions, upload, i18n nội dung: gấp nhiều lần khối lượng | Loại |

## 3. Quyết định chính

| # | Quyết định | Lý do / nguồn |
|---|---|---|
| D1 | Một package, `source_roots: [src]`, cấu trúc theo ARCHITECTURE §4 | Không cần monorepo |
| D2 | PostgreSQL + PostGIS + `unaccent` + `pg_trgm`; migration versioned bằng `payload migrate:create`, chạy `payload migrate` khi deploy; cấm `db push` | AGENTS.md Non-negotiables; ERD §1 |
| D3 | Song ngữ: Payload `localization` (`fallback: false`) cho nội dung, `next-intl` cho route `/en` + chuỗi giao diện | BR-07, F12 |
| D4 | AI dịch: job `translate-content` (Payload Jobs) → `TranslationService` (Claude API), chỉ collection công khai, hạn mức tháng qua env | BR-08, ARCHITECTURE §7 |
| D5 | Phân quyền ở tầng collection/field của Payload, hàm chung `src/access/`; Sale không sửa Dịch vụ và trang pháp lý | PERMISSION §2–4 (chốt B2) |
| D6 | Phân công lead: side effect (activity, email, audit) chỉ ở hook `leads.afterChange` | API_SPEC §5 (chốt N7) |
| D7 | Tìm kiếm giai đoạn 1: chỉ Cho thuê, `SearchService` trên Postgres; nút tìm kiếm header → `/cho-thue?q=` | ERD §6 (chốt B4) |
| D8 | UI: Tailwind + shadcn/ui, font EB Garamond + Montserrat, bố cục theo vinhomes.vn, màu/logo TAMI | DESIGN.md; bước `/design` sinh tokens + screen specs |
| D9 | Hạ tầng: Docker Compose trên server dùng chung (bind `127.0.0.1`, tiền tố `tami-`), Nginx host, Cloudflare; staging tách biệt; CI/CD GitHub Actions staging → duyệt tay → production | ARCHITECTURE §6 |
| D10 | Test: unit cho `lib/` (lead, search, translation, slug), integration cho access/hook/endpoint với Postgres test, e2e smoke cho luồng lead | Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` |

## 4. Thứ tự build dự kiến (input cho bước graph)

1. **Nền:** scaffold Next.js + Payload, Docker Compose dev, CI lint/typecheck/test/build, `staff` + `src/access/`, seed tỉnh/phường.
2. **Dữ liệu nội dung:** categories, developers, media/private-files (S3), projects, rentals, property-posts, news, services, job-postings, pages, globals; slug/redirect, versions, xoá mềm, audit log.
3. **Website công khai VI:** layout, header/footer/menu, trang chủ, danh sách/chi tiết từng loại, liên hệ, pháp lý, SEO (meta, sitemap, JSON-LD), nút nổi.
4. **Lead & tuyển dụng:** endpoint công khai (Turnstile, rate limit, chống trùng), phân công, email, nhắc lead, admin lead + xuất Excel, hồ sơ ứng tuyển.
5. **Song ngữ + AI dịch:** `/en`, `hreflang`, `en.json`, job dịch, nút "Dịch lại bằng AI", lọc trạng thái dịch.
6. **Should:** dashboard, redirect 301 UI, trang đích khu vực, khối đối tác. **Could:** hẹn giờ xuất bản.
7. **DevOps:** deploy staging/production, giám sát, backup, kiểm tra CWV.

Bước graph sẽ chia chi tiết, có thể đổi thứ tự theo dependency.

## 5. Rủi ro và việc còn mở

- Server dùng chung: firewall đang tắt, dịch vụ dự án khác mở `0.0.0.0` (ARCHITECTURE §7). Phối hợp trước khi bật firewall.
- Session "8 giờ không hoạt động" cần cơ chế làm mới token Payload (residual risk).
- Câu hỏi mở: `SPECIFICATIONS.md` § Câu hỏi mở (Q1, Q4–Q7, tên miền, các khối homepage của DESIGN). Code dùng dữ liệu mẫu cho tới khi có nội dung thật.
- LOW chưa xử lý (BRD là intent doc, chỉ sửa khi anh duyệt): câu chữ NFR-09 ở BRD/BRIEF ("chỉ mã nguồn mở, tự host" so với dùng gói miễn phí Cloudflare/Brevo/GA4); BR-04 nói mọi nội dung có `author`, nhưng `services`/`pages` không có.

## 6. Config đã chốt

`.context/project-config.md`: `target_branch: staging`, `forbidden_branch: main`, `auto_push_after_pass: false`, `pnpm`, `db_tool: other` + `migration_required: true`, `deploy_platform: docker-vps`, `ci_cd: github-actions`, `monitor_enabled: true`, models builder `sonnet` / reviewer, spec_validator, change_request, builder_strong `opus`.
