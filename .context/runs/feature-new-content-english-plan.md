# Run Journal — feature/new-content-english · plan (BL-072)

```yaml
workItem: feature/new-content-english
phaseTask: done
step: done
agent: change-request
status: done
attempt: 0
interrupted: false
updatedAt: 2026-10-23T22:40:00+07:00
filesTouched: []
filesNew: [spec/changes/2026-10-23-new-content-english.md, tasks/feature-new-content-english/phase-1-task-01.md, tasks/feature-new-content-english/phase-1-task-02.md, tasks/feature-new-content-english/phase-1-task-03.md, tasks/feature-new-content-english/phase-2-task-01.md, tasks/feature-new-content-english/phase-2-task-02.md]
evidence:
  reportPath: .context/review-reports/feature-new-content-english-phase-1-task-03-round-1-review.md
  round: 1
  verdict: PASS
next: "none — BL-072 done"
loopSignal: none
approvals: [{gate: phase_plan, at: 2026-10-23T16:01:39+07:00, ok: true, choice: "Q1 commit script nhập, Q2 (a) prod có confirm + dry-run, duyệt plan"}]
batchQueue: [BL-071, BL-072]
```

## History

- 2026-10-23T15:55:11+07:00 journal created; /change bl71, bl72 — planning song song, dừng ở checkpoint duyệt plan
- 2026-10-23T16:00:07+07:00 change-request plan xong: English pack có kiểm soát, 5 task; chờ duyệt
- 2026-10-23T16:01:39+07:00 user duyệt plan BL-072 (Q1 yes, Q2 a)
- 2026-10-23T16:30:25+07:00 p1-T01 reviewer STRICT PASS round 1 (6 MINOR); dừng trước close-out
- 2026-10-23T16:42:47+07:00 resume change-request: MINOR fix + close-out T01
- 2026-10-23T17:28:33+07:00 phase 1 done: adff25a, 2d24916, fa4c519; spec 1.57.0 / scope 76; dừng trước phase 2
- 2026-10-23T17:34:15+07:00 user: chưa push, dừng ở đây
- 2026-10-23T21:03+07:00 user ok push+deploy staging; push 8128947..fa4c519; CI 39966342294 PASS; deploy 39969173031 fail (runner SSH timeout cổng 22) → rerun PASS
- 2026-10-23T21:40+07:00 p2-T01 dry-run staging (APP_ENV=staging, postgres:5432/tami): sẽ ghi 98 (categories 2, developers 3, projects 3, news 8, media 82), không đổi 2, bỏ qua 0, thiếu bản vi 0, exit 0
- 2026-10-23T21:40+07:00 backup /opt/tami/backups/staging-manual/tami-pre-english-pack-2026-10-23-1440.dump (1.6 MB, 155 TABLE DATA); dừng chờ user ok apply
- 2026-10-23T21:50+07:00 user ok apply staging: đã ghi 98 exit 0 (warn revalidate ngoài Next); dry-run lại không đổi 100; /en staging (187-52-119-50.sslip.io) 8 tin + 3 dự án EN → p2-T01 done
- 2026-10-23T21:50+07:00 user ok deploy prod + backup + dry-run (dừng trước mỗi lần ghi); deploy-production 39972700485 fa4c519 PASS (digest 240ceb22 = staging); không migration (8128947..fa4c519 chỉ Staff.ts admin.condition)
- 2026-10-23T21:52+07:00 backup prod pg_dump /opt/tami/backups/production-manual/tami-pre-content-2026-10-23-1450.dump (1.0 MB, 155 TABLE DATA) + pgBackRest full (chạy nền); ảnh /opt/tami/import/2026-10-23-img (184M, 83 file) → tami-app:/tmp/import-img
- 2026-10-23T22:00+07:00 dry-run content:import prod: 13 sẽ tạo (3 CĐT, 1 news-category, 8 tin, 8 ảnh bìa), 3 LỖI: 3 dự án thiếu danh mục project (prod chỉ có categories rental/property_post/news); exit 0 dù có LỖI (runbook nói ≠0 → residual). Chưa ghi gì prod
- 2026-10-23T22:10+07:00 user "tạo luôn" danh mục dự án: script one-off tami-app:/app/scripts/_bl072-project-categories.ts (dry-run → apply) tạo 4 project categories (Căn hộ chung cư, Nhà phố biệt thự = vi, EN để gói; Khu đô thị/Urban areas, Nghỉ dưỡng/Resorts có EN); chạy lại → 4 đã có
- 2026-10-23T22:12+07:00 dry-run content:import prod lần 2: 16 sẽ tạo (3 CĐT, 3 dự án, 1 news-category, 8 tin), 90 ảnh tải lên, 0 lỗi, exit 0. tami-seaweedfs mem 256m (BL-070 rủi ro OOM) → tạm 768m khi apply
- 2026-10-23T21:59+07:00 pgBackRest full prod 20261023-215037F OK (74.2MB, R2 tami-prod-backup)
- 2026-10-23T22:01+07:00 user ok nhập prod: tami-seaweedfs 768m; apply lần 1 EXIT 137 — script node trong tami-app OOM-kill (cgroup 1g, anon-rss ~847MB); đã ghi một phần (3 CĐT, maison-privee, 56 media, 0 tin); app web vẫn healthy
- 2026-10-23T22:05+07:00 tạm tami-app 2g → apply lần 2: 12 đã tạo, 4 đã có, 0 lỗi, exit 0; dry-run lại 0 sẽ tạo/16 đã có; prod khớp staging (rels 14/15/15, 8 tin, 82 media); trả tami-app 1g/swap 2g, tami-seaweedfs 256m/swap 512m — seaweedfs bị kill khi hạ (đang ~263MB) và tự restart, healthy sau ~20s; 82/82 file ảnh /api/media 200
- 2026-10-23T22:20+07:00 english:pack dry-run prod: sẽ ghi 100 (categories 4, developers 3, projects 3, news 8, media 82), bỏ qua 0, thiếu bản vi 0, exit 0; dừng chờ user ok apply
- 2026-10-23T22:35+07:00 user ok ghi EN prod: đã ghi 100 exit 0; dry-run lại không đổi 100; /en prod 8 tin + 3 dự án EN; dọn ảnh tạm + script one-off; close-out BL-072 done
