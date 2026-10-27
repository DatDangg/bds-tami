Agent: reviewer

# Review — bug-admin-upload-oversize-toast · phase-1-task-01 · round 1 (BL-088)

- **Review level:** STRICT
- **Reason:** upload/file access + new shared admin provider (`admin.components.providers`) that intercepts every `change`/`drop` in `/admin`; server error formatting (`reject()`) used by media + private-files.
- **Blast radius:** every file input / Payload `Dropzone` in `/admin` (Upload field, bulk-upload drawer "Thêm tệp", media create, Lexical upload drops, staff avatar); any file drop anywhere in the admin document; REST error text of `inspectUpload` (413/415/400) for `media` and `private-files`. Public site (CV form) not affected — the provider only renders inside the Payload admin root.

## Root cause check
- Confirmed `node_modules/payload/dist/utilities/formatErrors.js`: APIError with `data` null skips branch 1, then `if (incoming.name)` → empty name in minified build falls to `'An unknown error occurred.'`. The `reject()` fix (`error.name = "APIError"`) addresses it correctly, and only `validate-file.ts` `reject()` changed (no other `new APIError` touched — diff verified).
- The 413 → getFormState → "Successfully saved" path (FormsManager) was not re-read line by line; the fix avoids that path by blocking on the client, which is consistent with the stated root cause. Browser evidence (`bl088-before-prod-toasts.png`, `bl088-after-gallery-big.png`) matches.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, no output) |
| `pnpm exec vitest run src/lib/upload src/components/admin/UploadSizeGuard.test.tsx` | PASS — 5 files / 27 tests |
| `pnpm exec eslint` (media-limits.ts, UploadSizeGuard.tsx, UploadSizeGuard.test.tsx, validate-file-prod-name.test.ts, validate-file.ts, payload.config.ts) | PASS (no output) |
| `pnpm test` / `pnpm build` | not rerun (builder reported 446 files / 4680 tests, build 0); the finding below does not depend on them |

Test validity: `validate-file-prod-name.test.ts` subclasses the real APIError and sets `name = ""`. `instanceof` still holds, so `formatErrors` really goes down the name branch. Without the fix it returns "An unknown error occurred." (FAIL), with the fix it returns the Vietnamese message (PASS). `UploadSizeGuard.test.tsx` cannot pass on HEAD because the module does not exist there. Both tests are real.

## Responsive Checklist Gate
N/A. No layout/CSS/route change. The only visible UI is a Payload toast, and the change is a behaviour-only provider that renders `children`.

## Skill gates
- aislop: skip, `aislop` not installed.
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc.json`/`oxlint.json`). eslint PASS instead.
- ocr (open-code-review): skip, `ocr` not installed.
- AI-readable: OK. Names are clear, every function is under 50 lines, no deep indirection, comments explain WHY. 0 indicators.
- ai-friendly-web: N/A (admin only).
- blitzstrike: skip, not installed / no permitted environment. The client guard is UX only and the server stays authoritative (magic bytes + size in `createUploadGuard`), so the security posture is unchanged.

## Findings

### [MAJOR-1] Dropping only oversized files leaves the Payload dropzone stuck in `dragging`, and its buttons stop responding to clicks
- `src/components/admin/UploadSizeGuard.tsx:73-77`: when `accepted.length === 0`, the guard calls `preventDefault()` and `stopImmediatePropagation()` and does not replay anything.
- Payload `Dropzone` (`node_modules/@payloadcms/ui/dist/elements/Dropzone/index.js`, `handleDrop`) is the only place that calls `setDragging(false)` after a drop. Browsers do not fire `dragleave` on the drop target after a successful drop. So after `dragenter` → `setDragging(true)`, the class `.dragging` is never removed.
- `Dropzone/index.scss:24-30`: `.dragging * { pointer-events: none; }` plus a green border/background. After the user drops an 11 MB image onto the drawer or Upload field, they see the toast, but the zone stays highlighted and its children ("Chọn tệp", "Tải lên", …) cannot be clicked until another drag enters and leaves.
- The task design says explicitly: "Không để dropzone kẹt trạng thái 'đang kéo'". There is no drop evidence in the browser: all `bl088-after-*.png` use the file picker (`change`). The jsdom drop tests use a bare `div` without dragging state, so they cannot catch this.
- **Fix:** in the all-rejected branch, still let the dropzone reset itself. Either replay `drop` with an empty `DataTransfer` (Payload `handleDrop` calls `setDragging(false)`, then skips `addFiles` because `files.length === 0`), or dispatch a bubbling `dragleave` on `event.target`. Add a test where a Dropzone-like listener sets and clears a dragging flag, and confirm in the browser on the prod build: drop 11 MB onto the drawer → 1 toast, then the zone is no longer highlighted and "Chọn tệp" opens the picker.

### [MINOR-1] Paste path is not guarded
- Payload `Dropzone` also accepts files from `paste` (`handlePaste` → `addFiles(e.clipboardData.files)`). Pasting an oversized image (for example a large screenshot) into a dropzone bypasses the guard and reaches the same 413 → "Successfully saved" double toast. This is not in the AC, but it is within the stated blast radius ("mọi đường chọn/kéo-thả tệp").
- **Fix (optional, or as a follow-up):** add a capture `paste` listener. `clipboardData` cannot be rewritten, so if any file is oversized, `preventDefault` + `stopImmediatePropagation` + toast.

### [MINOR-2] The replayed drop loses pointer coordinates
- `UploadSizeGuard.tsx:60-62`: the replayed `DragEvent` does not copy `clientX`/`clientY`/`screenX`/`screenY`/modifier keys. Consumers that use the drop position, such as a Lexical editor drop, would see (0,0).
- **Fix:** pass `clientX`, `clientY`, `screenX`, `screenY`, `ctrlKey`/`shiftKey`/`altKey`/`metaKey` from the original event into the `DragEvent` init.

### [MINOR-3] Remaining 413 double-toast paths (residual, document them)
- The client limit uses the declared `file.type`, but the server uses magic bytes. A real JPEG renamed `.mp4` (10–15 MB) passes the client check (video 15 MB) and gets a server 413. An `.avif` with an empty or unknown OS MIME (10–20 MB) falls back to the 20 MB ceiling. Also, `private-files` (5 MB, hidden from nav but its admin route exists) is checked against `MEDIA_POLICY`, so a 5–20 MB PDF passes the client and gets 413. These are rare edge cases, and the server message is now readable thanks to the `reject()` fix, but the "Successfully saved" toast can still appear. Record this in the task's Residual risk.

### [MINOR-4] Cosmetic rounding
- `UploadSizeGuard.tsx:22,25`: a file of 10 MB + a few KB shows "(10,0 MB) vượt giới hạn 10 MB". Consider rounding up (`Math.ceil(x*10)/10`) or showing 2 decimals when the value is close to the limit.

## Other checks (OK)
- Capture on `document` runs before the React root listeners and before Payload's native `div` listeners. `stopImmediatePropagation` in capture at `document` stops all later propagation. React handles `onChange` for `input[type=file]` through the native `change` event only, so the filtered `input.files` (set from `DataTransfer.files`) is what React reads. When every file is rejected, `input.value = ""` resets the input, so re-selecting the same file fires `change` again.
- Replay loop guard: the `REDISPATCHED` symbol is checked first in `handleDrop`. Replays are synthetic, so they trigger no default action. The original drop is `preventDefault`-ed, so the browser does not open the file.
- Single source of limits: `media-limits.ts` has no imports. `validate-file.ts` re-exports `MEDIA_POLICY`/`MAX_UPLOAD_BYTES`/`UploadPolicy`, so the API is unchanged. The client imports only `media-limits` (no node/payload server dependencies in the bundle).
- importMap: only the 2 `UploadSizeGuard` lines belong to this task. The `WardField` lines are BL-077 and must be staged separately at commit.
- Toast text is Vietnamese, there is 1 toast per event, and multiple files are joined with "; " — matches the spec.

## Verdict
**FAIL.** 1 MAJOR: the dropzone stays stuck in the dragging state (children not clickable) after a drop where every file is too large. This violates the task's explicit design rule and was not covered by the browser evidence. The bug's original repro (file picker, prod build) is PASS with verifiable evidence. After the MAJOR fix plus a browser check of the drop path, round 2 can be a focused re-review. MINOR-1..4 can be fixed or logged as residual risk / follow-up.
