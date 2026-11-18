# Run Journal — bug/admin-map-gray-tiles · phase-1-task-01

```yaml
workItem: bug/admin-map-gray-tiles
phaseTask: phase-1-task-01
step: done
agent: change-request
status: done
attempt: 1
interrupted: false
updatedAt: 2026-11-18T00:00:00Z
filesTouched: [src/components/media/LazyMap.tsx, src/components/media/LazyMap.test.tsx, SPECIFICATIONS.md, spec/CHANGELOG.md, spec/test-scope/current.json, .context/progress.json, spec/changes/BACKLOG.md (chỉ dòng BL-121; file bẩn sẵn), spec/changes/2026-11-17-admin-map-gray-tiles.md]
filesNew: [tasks/bug-admin-map-gray-tiles/phase-1-task-01.md, spec/updates/2026-11-18-map-openfreemap-basemap.md, .context/review-reports/bug-admin-map-gray-tiles-phase-1-task-01-round-1-review.md, .context/review-reports/assets/bl121-p1t01-local-project-map.jpg]
evidence:
  reportPath: .context/review-reports/bug-admin-map-gray-tiles-phase-1-task-01-round-1-review.md
  round: 1
  verdict: PASS
next: "xong — commit + push staging 2026-11-18 (user test local OK)"
loopSignal: none
approvals:
  - { gate: bug_list_order, at: 2026-11-17, ok: "user: 'Ok, theo thứ tự đó' (40 → 36 → 38+39 → 37)" }
  - { gate: tile_provider, at: 2026-11-18, ok: "user chọn A — OpenFreeMap; KHÔNG commit/push/deploy" }
batchQueue: [BL-122, BL-123, BL-124]
```

## Notes / WIP reasoning

- Working tree bẩn sẵn (snapshot `.context/runs/.bl121-baseline-status.txt`), gồm BL-119 chưa commit (reviewer r2 PASS) — không commit file ngoài task.
- curl tile.openstreetmap.org từ máy dev trả 000 (không kết nối) — chưa kết luận.
- ROOT CAUSE (2026-11-17, đã chứng minh): DNS nhà mạng chặn openstreetmap.org.
  - `nslookup tile.openstreetmap.org` qua DNS mặc định (static.vnpt.vn) → "Non-existent domain"; qua 1.1.1.1 → 151.101.x.91 (Fastly) bình thường; TCP 151.101.1.91:443 → True ⇒ chặn ở tầng DNS ISP, không phải server/CSP/Referer.
  - Browser built-in trên staging mới: fetch no-cors tile.openstreetmap.org / a.tile.openstreetmap.org / www.openstreetmap.org FAIL ~17ms; cùng lúc tile.openstreetmap.de, a.basemaps.cartocdn.com, tiles.openfreemap.org, unpkg, google OK.
  - /du-an/vlasta-premier-phu-hoi (toạ độ 105.8524/21.0285 = QA): bấm "Xem bản đồ" → canvas MapLibre dựng, worker /vendor/maplibre/* 200, 0 request tile nào thành công → chỉ còn nền `bg-surface-muted` (xám) + marker DOM. Console sạch.
  - Loại trừ: Nginx tami-staging-sslip-179.conf không có CSP; Referrer-Policy strict-origin-when-cross-origin (OSM chấp nhận); app không đặt CSP toàn site.
  - Admin KHÔNG có bản đồ: field `location` là `type: "point"` Payload (2 ô số); grep src không có map component admin → bản đồ QA thấy là trang khách cùng toạ độ.
  - Ảnh hưởng: mọi trang dùng LazyMap (ProjectLocation, RentalDetail, PostDetail, OfficeSystem/liên hệ), mọi người xem dùng DNS VNPT (có thể cả nhà mạng VN khác). Không phụ thuộc server mới.
  - Fix bắt buộc đổi nguồn tile → checkpoint user (chi phí/API key/pháp lý bản đồ VN).

## History

- 2026-11-17 journal created; ▶ START [agent: change-request] BL-121
- 2026-11-17 root cause chứng minh (DNS ISP chặn openstreetmap.org); dừng checkpoint chọn nguồn tile — chưa sửa code, chưa task file, chưa commit
- 2026-11-18 user chọn A. OpenFreeMap; chưa commit (user: 'chưa commit'). ▶ START [agent: change-request] fix BL-121
- 2026-11-18 user chọn A (OpenFreeMap), chưa commit; task file tạo; ToS OpenFreeMap đã kiểm; ▶ START [agent: builder]
- 2026-11-18 ✅ DONE [agent: builder] — vitest media 61\/61, typecheck PASS, eslint sạch; red→green (1 fail trước fix). Item 2 (error trước load) skip → residual
- 2026-11-18 browser local PASS (ảnh .context/review-reports/assets/bl121-p1t01-local-project-map.jpg); ▶ START [agent: reviewer] round 1
- 2026-11-18 ✅ DONE [agent: reviewer] STRICT PASS r1 (4 MINOR); ▶ START [agent: spec-publisher]
- 2026-11-18 ✅ DONE [agent: spec-publisher] spec 1.63.3 / scope v120; progress.json (bug awaiting_commit) + BACKLOG BL-121 cập nhật; dừng trước commit theo yêu cầu user
