# Run Journal — feature/en-non-localized-fields · intake

```yaml
workItem: feature/en-non-localized-fields
phaseTask: intake
step: done
agent: change-request
status: done
attempt: 0
interrupted: false
updatedAt: 2026-10-23T00:00:00+07:00
filesTouched: [spec/changes/BACKLOG.md, spec/changes/2026-10-23-en-non-localized-fields.md]
filesNew: []
evidence:
  reportPath: null
  round: 0
  verdict: null
next: "xong — chờ user: push / chạy migration staging"
loopSignal: none
approvals: [{gate: approach, at: 2026-10-23, ok: true, note: "user chọn cách (c)"}]
batchQueue: []
```

## Notes / WIP reasoning

User 2026-10-23 chọn (c): giữ địa chỉ tiếng Việt ở /en; `rentals.floor` → select mức (cao/trung/thấp) + số tầng tuỳ chọn; `projects.nearbyAmenities.distance` → số + đơn vị (phút/km); hiện theo i18n; migration chuyển dữ liệu cũ, giá trị không parse được → liệt kê, không đoán.
Working tree đang có thay đổi chưa commit KHÔNG thuộc BL-065 (.claude/*, CLAUDE.md, opencode.jsonc, .context/project-config.md, importMap.js, ảnh review-reports) — không đụng / không stage.

## History

- 2026-10-23 journal created; ▶ START change-request BL-065 (cancel sẽ redo bước này)
- 2026-10-23 ✅ DONE change-request BL-065: commits bf0b410 + 7bffaa9 (chưa push); STRICT FAIL r1 → PASS r2; spec-validation PASS; spec 1.56.0 / scope v73; HIGH_RISK_MIGRATION (backfill) → chạy staging trước prod; rental 741438bf… floor "3.4.5.6" cần admin sửa tay
