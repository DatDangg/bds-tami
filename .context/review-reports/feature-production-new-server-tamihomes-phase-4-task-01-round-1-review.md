Agent: reviewer

# Review: feature-production-new-server-tamihomes, phase-4-task-01, round 1 (BL-112)

Task: remove the CI job `record-staging-pass`, because staging and production now run on the same machine (179.197.242.57).

- **Review level:** STRICT
- **Reason:** CI/CD pipeline, production gate ("production only accepts a build that passed staging"), production SSH secrets, and a shared composite action (`ssh-deploy`) used by both `deploy.yml` and `deploy-production.yml`.
- **Blast radius:**
  - `.github/workflows/deploy.yml`: jobs `build` and `deploy-staging`.
  - `.github/actions/ssh-deploy/action.yml`: also used by `deploy-production.yml`.
  - `scripts/deploy/deploy.sh` and `lib/state.sh`: comments only.
  - `docs/runbooks/deploy.md`.
  - Server state `/opt/tami/state/staging.history`.

## Verify commands + result

| Command | Result |
|---|---|
| `bash scripts/deploy/deploy.test.sh` | **PASS** ("Tất cả test PASS", exit 0; `record-staging lock` SKIP because there is no `flock` on Windows, same as before) |
| `git diff fd524e26~1 -- .github/actions/ssh-deploy/action.yml` | **empty**: the action is byte-identical to the version before BL-111 (already ran green in CI before fd524e26) |
| `git diff fd524e26~1 --stat -- .github/workflows/deploy.yml` | **empty**: the workflow is identical to the version before BL-111 |
| `git diff --quiet HEAD -- .github/workflows/deploy-production.yml scripts/deploy/lib/release.sh` | unchanged (production gate not touched) |
| YAML parse (node `yaml`) | skip, no `yaml` module installed. Replaced by the evidence that the content is identical to the pre-fd524e26 revision that already parsed and ran in CI |
| `ssh server 'tail -3 /opt/tami/state/staging.history; cat /opt/tami/state/production.current'` (read-only) | The last history line `sha256:edf4b378… 2026-11-06T06:55:21Z b75ff984…` has the same digest as `production.current` (`ghcr.io/datdangg/bds-tami@sha256:edf4b378…`). The production gate reads the same file that staging writes, on one machine |

## Checklist

- **ssh-deploy, deploy mode:**
  - Secrets: `REGISTRY_TOKEN` goes only through env and stdin (`printf | ssh`). It is not in argv or logs.
  - Host key: `StrictHostKeyChecking=yes` + `UserKnownHostsFile` are kept.
  - Registry login is unchanged (`--registry-user %q --registry-token-stdin`).
  - `registry-user` and `registry-token` are back to `required: true`. Both callers (`deploy.yml:121-122`, `deploy-production.yml:88-89`) pass them. OK.
  - The `mode` input, `if: inputs.mode`, and the record-staging step are all gone. Grep finds no remaining `mode: record-staging`. OK.
- **deploy.yml:**
  - Remaining jobs: `build`, then `deploy-staging` (`needs: build`, environment staging, concurrency group). OK.
  - No job uses the `production` environment on push. Acceptance criterion met.
- **Production gate:** `deploy-production.yml` and `release.sh` (staging.history check, not-older check) are unchanged. OK.
- **Manual `deploy.sh record-staging`:**
  - The code and the record-staging tests are kept and pass.
  - Only the comments in `deploy.sh:12` and `state.sh:24-25` changed.
  - Keeping it is reasonable: it is tested, small (one function), and explicitly documented as a manual tool, so it does not count as dead code.
- **Runbook:** §1 diagram and paragraph, §11 note, §12 table and step 6 are consistent with each other.

## Responsive Checklist Gate
N/A: the diff does not touch UI (CI/YAML/shell/docs only).

## Skill gates

| Gate | Result |
|---|---|
| aislop | N/A: no app code (only YAML, comments, docs). The diff is purely deletion + comments |
| oxlint (anti-slop) | N/A: no TS/JS in the diff |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK: 0 indicators (the diff removes code; comments explain WHY) |
| ai-friendly-web | N/A: internal task, not public-facing |
| blitzstrike | skip: CI pipeline, no endpoint/input. Not installed / no permitted environment |

## Findings

### [MAJOR] As-built doc still describes the removed job
`docs/ARCHITECTURE.md:498` reads: "Khi staging và production ở 2 server khác nhau, job `record-staging-pass` (`deploy.yml`) ghi cặp digest + SHA…". The job no longer exists in `deploy.yml`, so this as-built doc is now wrong (Doc Impact rule).

Fix: rewrite it to match runbook §1. Staging and production on one machine share `staging.history`, and deploy staging writes to it directly. `deploy.sh record-staging` is only a manual tool, kept for the case where the machines are split again; that case would need the automatic mechanism rebuilt (`git show fd524e26`).

### [MAJOR] Task file has no Decision log, Evidence or Verification summary
`tasks/feature-production-new-server-tamihomes/phase-4-task-01.md` is still `Trạng thái: pending`, its Acceptance box is unchecked, and it has no Decision log or Evidence section. The review request asked for both. Feature rule #5 requires a verification summary.

Fix:
- Record the decision to keep `deploy.sh record-staging`, `record_staging_pass` and its tests as a manual tool, and to remove `mode` from the action.
- Record the evidence: `deploy.test.sh` PASS, the action/workflow identical to `fd524e26~1`, and the server `staging.history` / `production.current` sharing the same digest.
- Record what remains to verify after merge: the Deploy run has only `build` + `deploy-staging` green, `tail -1 staging.history` shows the new SHA, and the production dry-run rejects an SHA that did not pass staging.
- Update the status accordingly.

### [MINOR] SPECIFICATIONS.md still names the removed job
`SPECIFICATIONS.md:347` (Deployment as-built, spec 1.62.1) still says the gate is kept "(job `record-staging-pass`…)". This should go through spec-publisher at BL-112 close-out (PATCH as-built), not be edited by hand here. Note it in the task / close-out checklist.

### [MINOR] Historical note in runbook §11 is stale
`docs/runbooks/deploy.md:355` (§11, the BL-111 historical section) still says "Production vẫn ở server cũ 187.52.119.50". The added parenthetical points to §1, which is acceptable, but adding "(đến BL-112)" would make it clearer. This is outside the task's core scope.

## Residual risk
- The CI run after push (only 2 jobs, green) and the production dry-run rejecting an SHA that did not pass staging cannot be verified until merge and push. Both must be recorded in the task Evidence afterwards.
- YAML was not parsed with a tool. This relies on the content being identical to `fd524e26~1`.

## Verdict
FAIL: 2 MAJOR findings, both documentation/close-out. The code and pipeline changes are correct and need no change. After the builder fixes `docs/ARCHITECTURE.md:498` and fills in the task file's Decision/Evidence/Verification sections, round 2 can be FAST, limited to those two files.
