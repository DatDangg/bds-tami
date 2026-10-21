---
id: BL-053
title: URL gốc (canonical / sitemap / OG / JSON-LD) ra http://localhost:3000 trên server
class: BUG
status: done
created: 2026-10-21
---

# BUG — URL gốc bị nhúng placeholder lúc build

## Hiện tượng
Sau khi gắn tên miền `https://tami.genieplatform.cloud` (staging, 2026-10-21), container có
`NEXT_PUBLIC_SITE_URL=https://tami.genieplatform.cloud` nhưng:
- `https://tami.genieplatform.cloud/` → `<link rel="canonical" href="http://localhost:3000"/>`
- `https://tami.genieplatform.cloud/sitemap.xml` → mọi `<loc>` là `http://localhost:3000/sitemaps/...`

Có từ trước (khi chạy sslip.io cũng vậy), không do đổi tên miền.

## Root cause (đã xác minh trên bundle đang chạy)
`src/lib/seo/site-url.ts` đọc `process.env[SITE_URL_KEY]` với `const SITE_URL_KEY = "NEXT_PUBLIC_SITE_URL"` để tránh bị nhúng lúc build.
Compiler vẫn gập hằng: chunk `/app/.next/server/chunks/*.js` chứa
`let e="http://localhost:3000".trim();` (placeholder `NEXT_PUBLIC_SITE_URL` trong `docker/Dockerfile:34`).

## Expected
Canonical / hreflang / OG url / JSON-LD / sitemap dùng giá trị `NEXT_PUBLIC_SITE_URL` lúc chạy của từng môi trường.

## Hướng sửa gợi ý
Đọc URL qua biến KHÔNG có tiền tố `NEXT_PUBLIC_` ở server (vd `SITE_URL`, fallback `NEXT_PUBLIC_SITE_URL`) hoặc truy cập
không gập được hằng; thêm test/kiểm bundle không chứa placeholder. Kiểm các chỗ khác dùng `NEXT_PUBLIC_*` theo cùng mẫu.
