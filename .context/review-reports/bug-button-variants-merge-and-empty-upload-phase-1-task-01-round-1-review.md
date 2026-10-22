# Agent: reviewer — bug-button-variants-merge-and-empty-upload · phase-1-task-01 · round-1

- Task: `tasks/bug-button-variants-merge-and-empty-upload/phase-1-task-01.md` (BL-057, class BUG, follow-up BL-056 n-1/n-2)
- Change doc: `spec/changes/2026-10-22-button-variants-merge-and-empty-upload.md`
- Diff reviewed (working tree, uncommitted): `src/components/ui/button.tsx`, `src/components/ui/button.test.tsx`,
  `src/lib/content/rich-text-upload.ts` (new), `src/components/content/RichText.tsx`, `src/lib/content/rich-text-lead.ts`,
  `src/lib/content/rich-text-lead.test.ts`, `src/components/detail/DetailOverviewIntro.test.tsx`, `.context/design-spec.md`
  (7 modified: +94/−16, 1 new file). Everything else dirty in the tree is out of scope and ignored.

## Review level: STRICT
**Reason:** `buttonVariants` is a shared component used by every button/link on public pages (22 call sites across
Header, MobileMenu, FilterPanel, ListingHero, careers, spotlight cards, news sidebar, DetailShareButton, `Button`);
`RichText` renders all public rich text. Any regression would hit every page.

## Blast radius
- `buttonVariants` string output: all 22 call sites in `src/` (grep `buttonVariants(`). 20 wrap with `cn(...)` (idempotent
  — `cn(cn(x), extra)` ≡ `cn(x, extra)`); 3 raw calls are all `primary`/`md` (`RentalSpotlightContent:57`,
  `ProjectSpotlightContent:53`, `PostSpotlightContent:80`) where no class-group conflict exists except
  `border`/`border-transparent` (different groups, both kept). Raw `size:"sm"` would now drop `text-button` in favour of
  `text-button-sm` — no raw `sm` call site exists (Header:69, ListingHero:90 both use `cn`). → no call-site behaviour change.
- `renderableUploadImage`: `RichText.renderUpload` (all rich text) + `rich-text-lead.isVisibleBlock` → `splitOverview` →
  `DetailOverviewIntro` (project / rental / post detail "Xem thêm").
- No schema, no migration, no API shape, no intent docs.

## Verify commands + result (from `.context/project-config.md`)
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | exit 1 — 4 errors, **all** in `.local-seed/seed-sample-project-blocks.ts` (`no-explicit-any`, git-ignored, pre-existing, out of scope) + 2 pre-existing warnings in `tools/task-dashboard/server.mjs`. No error in any scope file. **Not a FAIL reason.** |
| `npx eslint <7 scope files>` | PASS (exit 0, 0 problems) |
| `pnpm test` | PASS — 418/418 files, 4380/4380 tests, 228s, no timeouts, no re-run needed |
| `pnpm build` | PASS (Compiled successfully, exit 0) |

## Specific checks requested
1. **`buttonVariants` merge** — OK. `button.tsx:7` keeps `cva` as `buttonClassVariants`; `:38` exports
   `buttonVariants = (props?) => cn(buttonClassVariants(props))` using `cn` from `@/lib/utils`
   (`extendTailwindMerge` with `radius: ["pill"]` + font-size group incl. `button`/`button-sm`, `utils.ts:23-28`).
   Tests at `button.test.tsx:9-19` assert secondary/chip/outline contain `border` + variant border, not
   `border-transparent`; `:21` primary keeps `border-transparent`; `:24-32` `text-button` survives beside
   `text-primary-foreground`, `sm` yields `text-button-sm` (not `text-button`) + `text-text` + `h-9`; `:35-39`
   `cn(buttonVariants(), "h-9")` overrides `h-11`. `VariantProps<typeof buttonVariants>` at `:41` resolves against the
   wrapper's single param (same type as the cva fn) — typecheck PASS. `Button` unchanged (`:59`). Existing `Button`
   tests (`:42-69`) still assert `rounded-pill`, `text-button`, `uppercase`, etc. on the rendered element.
2. **Helper parity** — OK. `rich-text-upload.ts:12-20`: `relationTo === "media"` → populated object → `url` truthy →
   `mimeType` empty or `image/*`. Byte-for-byte equivalent to the removed `RichText.tsx` conditions (old `!value ||
   typeof value !== "object"` ≡ new `typeof !== "object" || value === null`). `RichText.renderUpload:119-129` keeps
   `aspectRatio`, `ResponsiveImage`, `figcaption` unchanged (type now carries `height`/`caption`, no casts).
   `rich-text-lead.ts:35-39` `isVisibleBlock`: text → true; `upload` → helper; else `table`/`horizontalrule`.
   `splitOverview:73-74` → `rest === null` when nothing visible remains → `DetailOverviewIntro.tsx:24/28` renders no
   `<details>`/"Xem thêm". Existing `RichText.test.tsx:151-172` (1 figure out of 4 uploads) still passes.
3. **Tests** — OK. Fail-before is plausible: raw `cva` output provably contained `border-transparent` for all variants,
   and old `NON_TEXT_BLOCKS` counted every `upload`. New cases cover all 6 empty-upload shapes (id string, `value:null`,
   no `url`, non-image mime, other `relationTo`, missing `relationTo`) in both summary/lead-from-richtext paths
   (`rich-text-lead.test.ts:74-85`), plus valid upload without `mimeType` still counts (`:87-89`). No assertions
   weakened. `DetailOverviewIntro.test.tsx:9` fixture change (`{type:"upload", value:null}` → valid media) preserves
   the original intent ("đoạn dẫn + ảnh không chữ → vẫn có nút"): under the fix a `value:null` upload is by design
   not an image, so the old fixture no longer models "an image"; the `value:null` scenario is now covered as the bug
   case in `rich-text-lead.test.ts:76`.
4. **Verify** — see table; lint situation confirmed exactly as builder reported.
5. **Doc impact** — OK. `.context/design-spec.md:245` BL-057 sentence is accurate as-built (cn-wrapped cva; extra still
   overrides; `renderableUploadImage` shared with `RichText`). `git diff -- docs/ SPECIFICATIONS.md spec/*.md` empty →
   no intent docs changed.

## Responsive Checklist Gate: N/A
Diff changes no CSS/layout/route; class strings per variant are unchanged (only Tailwind conflict-merge of the same
tokens). No UI geometry to evaluate at 375/768/1280.

## Skill gates
| Gate | Result |
|---|---|
| aislop | skip, `aislop` not installed |
| oxlint (anti-slop) | skip, oxlint not configured (no `.oxlintrc.json`); eslint on scope files: 0 problems |
| ocr (open-code-review) | skip, `ocr` not installed |
| AI-readable | OK — 0/≥3 indicators: clear names (`renderableUploadImage`, `buttonClassVariants`), all functions < 20 lines, indirection ≤ 2 (`Button → buttonVariants → cn`), no magic numbers, comments are WHY (BL-057 rationale), as-built doc updated |
| ai-friendly-web | N/A (no public-facing web surface/crawler change) |
| blitzstrike | N/A (no auth/API/input surface) |
| Surgical diff | OK — every hunk traces to § Quyết định 1/2 or the test scope; builder did not touch the optional `cn(buttonVariants(...))` cleanups (minimal diff, as allowed) |
| Security / Performance | N/A — pure class-string + Lexical node predicate; no I/O, no user input |

## Findings
- **[MINOR]** `src/components/detail/DetailOverviewIntro.test.tsx` — no component-level test for the n-1 bug itself
  (summary + only an empty upload → no `<details>`/"Xem thêm"). The behaviour is fully covered one layer down in
  `rich-text-lead.test.ts:74-85` (`rest === null`) and `DetailOverviewIntro.tsx:24/28` is a direct `rest !== null`
  check, so coverage is adequate; a 3-line render test would make the acceptance line verifiable at the UI boundary.
  Suggested fix (optional, follow-up): `renderWithIntl(<DetailOverviewIntro summary="T" content={content({type:"upload",
  relationTo:"media", value:null})} .../>)` → `expect(container.querySelector("details")).toBeNull()`.
- **[MINOR]** `src/components/content/RichText.tsx:22-24` / `src/lib/content/rich-text-lead.ts:10-11` — `relationTo?`/
  `value?` added to two local node interfaces for TS weak-type compatibility with the helper's param. Fine, but the
  helper could instead accept `Pick<...>` of a shared `LexicalUploadNode` type exported from `rich-text-upload.ts` to
  avoid the duplication. Cosmetic; not blocking.

No CRITICAL / MAJOR.

## Residual risk
- Not browser-verified (reviewer has no browser/DB access; n-1 requires deleting a media row). Mitigated by unit tests +
  helper parity being line-equivalent to the previous `renderUpload` conditions.
- Full merged class string of `buttonVariants()` for `primary` was not diffed token-by-token against raw `cva` output
  (reviewer limited to configured verify commands); tests assert the load-bearing tokens (`rounded-pill`, `text-button`,
  `text-primary-foreground`, `h-11`, `uppercase`, `border-transparent`) survive, and `cn` is already applied at 20/22 call
  sites in production, so the merged output is the already-shipped output.

## Verdict: ✅ PASS
Bug task: both Repro Verification rows are `PASS` with evidence verifiable by automated tests that I re-ran
(418/418 files, 4380/4380 tests). Only MINOR findings; safe to close out and commit.
