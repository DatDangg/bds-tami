# docs/ — Index

> `/spec-init` auto-scan và classify file trong `docs/`. File này phân loại rõ
> **canonical** (dùng để validate) vs **historical** (tham khảo, không dùng để chặn).

## Canonical (source of truth — dùng để validate)

| File | Loại | Ghi chú |
|------|------|---------|
| `BRD.md` | business_requirements | Yêu cầu nghiệp vụ **v1.5** (website thương hiệu TAMI, song ngữ Việt – Anh, AI tự dịch) — intent doc, chỉ đổi qua Change Request |
| `ARCHITECTURE.md` | architecture | Kiến trúc hệ thống, deploy, bảo mật, backup, lộ trình mở rộng |
| `ERD.md` | database_schema | Thiết kế dữ liệu (collection, trường, index). Khi có code → **pointer** tới `src/collections/` + `migrations/`, code thắng |
| `PERMISSION.md` | business_rules | Vai trò `admin`/`sale` + ma trận quyền + guard order, **sync với `src/access/` khi có code** |
| `API_SPEC.md` | api_spec | Endpoint tuỳ biến + quy ước. Khi có code → pointer tới `src/endpoints/` + `src/shared/types/api.ts` |
| `DESIGN.md` | design_spec | Design spec / brand — đã điền màu, logo, font, bố cục theo vinhomes.vn; screen spec chi tiết ở `.context/design-spec.md` (bước `/design`) |
| `generated/` | generated | Sinh tự động bằng `check_commands.docs_inventory` — **không sửa tay** |

Tóm tắt phạm vi cho agent: `../BRIEF.md`. Spec tổng hợp: `../SPECIFICATIONS.md`.

## Historical (tham khảo — không dùng để validate)

| File | Ghi chú |
|------|---------|
| `archive/BRD-v1.2-san-bds.md` | BRD bản cũ theo hướng **sàn BĐS** (bdstanlong.vn). Đã thay bằng `BRD.md` từ v1.3 — **không dùng để validate** |
| `diagrams/` | Diagram minh họa (archify) — verify với code trước khi tin |

## Optional: manual classification hint

```yaml
- BRD.md: brd
- ARCHITECTURE.md: architecture
- ERD.md: erd
- PERMISSION.md: other
- API_SPEC.md: api_spec
- DESIGN.md: design
- archive/BRD-v1.2-san-bds.md: other
```

## Quy tắc

- **Không nhúng code/schema tay** vào docs canonical sau khi đã có code → dùng pointer + `docs/generated/`.
- Mọi thay đổi code/config/docs/schema → commit-first tracking là source of truth.
