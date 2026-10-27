Agent: reviewer

# Review — bug-admin-upload-oversize-toast · phase-1-task-01 · round 2 (BL-088)

- **Review level:** STRICT
- **Reason:** Same as round 1. The task touches upload and file access, adds a shared admin provider that intercepts every `change`/`drop`/`paste` (now `paste` too) on `document` in `/admin`, and changes server error formatting (`reject()`) for media and private-files. This round is a focused re-review of attempt 2 (`UploadSizeGuard.tsx`, `UploadSizeGuard.test.tsx`, task Residual risk) plus a regression check.
- **Blast radius:** Every file input, Payload `Dropzone` (drop + paste) and Lexical drop/paste inside `/admin`. The REST error text of `inspectUpload` for `media` and `private-files`. The public site is not affected.

## Round-1 findings: resolution check

| R1 finding | Status | Evidence |
|---|---|---|
| MAJOR-1: dropzone stuck in `dragging` | **Resolved** | `UploadSizeGuard.tsx:82-86`: the guard now always replays the drop, even when `accepted` is empty. Checked against `node_modules/@payloadcms/ui/dist/elements/Dropzone/index.js:47-61`. `handleDrop` calls `setDragging(false)` on line 50 before anything else. `addFiles` only runs when `dataTransfer.files.length > 0` (line 51). So an empty replay clears `dragging` and adds nothing. Test `drop chỉ có tệp quá cỡ…` has a listener shaped like the Dropzone (dragenter sets the flag, drop clears it and records files) and expects `dragging === false`, `uploads === []` and `defaultPrevented`. That test would FAIL on the round-1 code, because there was no replay. Browser evidence on the prod build: `bl088-after-drop-big.png` and `bl088-after-drop-field-click.png` show a dashed border with no green `.dragging` style, plus 1 Vietnamese toast. The task log says "Chọn tệp" still opens the file chooser. |
| Replay loop guard | OK | `REDISPATCHED` is defined on the replay (`:71`) before `dispatchEvent` (`:72`). `handleDrop` checks it first (`:76`), and the capture listener on `document` sees the replay. A synthetic event has no default action. The original trusted drop is `preventDefault`-ed (`:84`), so the browser does not navigate to the file. |
| MINOR-1: paste | **Resolved** | `handlePaste` (`:90-96`) is registered in capture and removed on cleanup. If any file is too large, it blocks the whole paste with 1 toast. Payload `handlePaste` (Dropzone:30-36) does not run, so there is no 413. A valid paste passes through (test `paste tệp quá cỡ…`). |
| MINOR-2: coordinates and modifiers | **Resolved** | `:67-69` copy `clientX/Y`, `screenX/Y`, `ctrl/shift/alt/metaKey` into `DragEventInit`. The jsdom fallback is `legacyDropEvent`. There is a test for it. |
| MINOR-3: residual 413 paths | **Documented** | The task file's "Residual risk" section covers MIME vs magic bytes, avif with empty MIME, and the `private-files` 5 MB limit. |
| MINOR-4: rounding | **Resolved** | `:23` rounds up to 0.1 MB. A file is rejected only when `size > limit`, and the limits are whole MB, so `ceil(x*10)/10 > limit` always holds and the shown size can never equal the limit. Check: 10 MB + 1 B gives 100.0000095, which rounds up to 10,1. There is a test for it. |

## Regression check
- A valid drop passes through exactly once with no toast. A mixed drop replays only the valid files. Both are tested.
- `change` handling is unchanged from round 1, apart from the rounding.
- A drop outside any Dropzone that contains only oversized files now gets an empty replay instead of being swallowed. This has no effect, because no listener acts on empty files and a synthetic event has no default action.
- File size is 115 lines, and every function is under 50 lines.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (no errors) |
| `pnpm exec vitest run src/lib/upload src/components/admin/UploadSizeGuard.test.tsx` | PASS: 5 files, 30 tests |
| `pnpm exec eslint` on UploadSizeGuard.tsx/.test.tsx, media-limits.ts, validate-file.ts, validate-file-prod-name.test.ts, payload.config.ts | PASS, exit 0 |
| `pnpm build` / full `pnpm test` | Not rerun by the reviewer. The builder reports build PASS. The change is limited to one client component, and its typecheck and tests PASS. |

## Responsive Checklist Gate
N/A. No layout/CSS/route change. The provider only renders `children`. The only UI is a Payload toast.

## Skill gates
- aislop: skip, not installed.
- oxlint (anti-slop): skip, oxlint not configured. eslint PASS instead.
- ocr: skip, not installed.
- AI-readable: OK. 0 indicators. Names are clear, functions are short, and comments explain WHY (Dropzone only clears dragging in its drop handler).
- ai-friendly-web: N/A (admin only).
- blitzstrike: skip, not installed. The client guard is UX only, and the server stays authoritative (magic bytes + size).

## Findings
No CRITICAL or MAJOR findings.

### [MINOR-1] Paste of text is blocked if the clipboard also carries an oversized image
- `UploadSizeGuard.tsx:90-96`: the listener runs on every `paste` in `/admin`, including text fields and Lexical. If the clipboard holds both text and an image file over 10 MB (rare, for example a large spreadsheet range copied as an image + text), the text paste is also cancelled and a toast appears. Not blocking. An optional future fix is to block only when the target is inside a `.dropzone`, or when the clipboard has no `text/plain`.

### [MINOR-2] Browser drop evidence uses a synthetic DragEvent
- The task log says the drop on the prod build was a synthetic `DragEvent`, not a real OS drag. A trusted drop goes through the same listener path, so the risk is low. Record it as residual risk. No code change is needed.

## Verdict
**PASS.** MAJOR-1 is fixed, and the fix matches Payload's Dropzone source: an empty replay clears `dragging` and does not call `addFiles`. It is covered by a test that would fail on the round-1 code, and by prod-build browser evidence. MINOR-1, MINOR-2 and MINOR-4 from round 1 are fixed, and MINOR-3 is documented as residual risk. The original repro (file picker, prod build) was already PASS with evidence in round 1. Remember to stage only the 2 `UploadSizeGuard` lines of `importMap.js` (the WardField lines belong to BL-077).
