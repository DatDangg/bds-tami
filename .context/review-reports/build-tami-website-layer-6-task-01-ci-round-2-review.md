Agent: reviewer

# Review — build-tami-website layer-6-task-01 (CI SeaweedFS fix) — round 2

- **Review level:** FAST
- **Reason:** The diff touches only CI (`.github/workflows/ci.yml`: the SeaweedFS service step plus one diagnostic step). It changes no app source, schema, API or auth. Primary reports a local reproduction with the new flags: 38/38 PASS.
- **Blast radius:** Only the GitHub Actions CI job: the SeaweedFS container used by integration tests, plus a log step that runs only when the job fails. No effect on runtime, staging or prod.

## Verify commands + result
- `git diff -- .github/workflows/ci.yml`: read. No app verify command applies to a CI-only change. I did not re-run vitest myself; I accept primary's local run (fresh container, 38/38 PASS) as evidence. Final proof is the GitHub runner result.

## Checks
| Item | Result | Evidence |
|---|---|---|
| Line join of `weed server` command | OK | The flags are appended on the same line after `-ip.bind=0.0.0.0`. The line has a long run of extra spaces, which is cosmetic only. There is no stray `\`, so the shell parses it as one command. |
| Flag validity | OK | Primary confirmed `-master.volumeSizeLimitMB` and `-volume.max` exist in `weed server -h` for 4.48. |
| Bucket check | OK | `buckets="$(...)"` under the default `bash -e` stops the step if `docker exec` fails. `grep -qw private` matches a line like `  private\tsize:...` because tab and space are word boundaries. `-w` stops `public` from matching longer names. `exit 1` fails the step clearly. |
| Diagnostic step | OK | `if: failure()` with every command ending in `|| true`, so it cannot fail the job in a new way. The pipeline exit status is that of the last command, and the workflow has no `pipefail`. If an earlier step fails before the container exists, `docker logs` errors and `|| true` absorbs it. The step sits before Build, so a Build failure won't trigger it. That is acceptable. |
| Hypothesis | OK (reasonable) | With a 30 GB default volume size and `volume.max` computed from free disk, a runner with roughly 14 GB free gets very few volume slots. Each collection needs its own volume growth (default 7 volumes for replication 000), so the second bucket fails with `InternalError`. Limits of 256 MB x 32 slots allow about 8 GB at most, and 2 buckets x 7 volumes = 14 ≤ 32. |
| Public path not broken | OK | Smaller volumes only change how space is allocated. The public bucket keeps working the same way, and the local run of all three suites passed. |
| Surgical diff | OK | Every line traces back to the CI failure. |

## Skill gates
- aislop: N/A (YAML/CI only, no app code)
- oxlint: N/A (no TS/JS in diff)
- ocr: skip, ocr not installed / not needed at FAST level for CI YAML
- AI-readable: OK. The comments explain why, not what, and there are no magic values without a comment.
- ai-friendly-web: N/A
- blitzstrike: N/A
- Responsive gate: N/A (no UI)

## Findings
- [MINOR] `.github/workflows/ci.yml:110`: there is a long run of spaces before `-master.volumeSizeLimitMB`. Collapse it to one space, or move the flags to their own continuation line ending in ` \`, for readability.
- [MINOR] Residual risk: the hypothesis is proven only on a local machine. If the runner still fails, the `failure()` step now dumps `volume.list` and the logs, which should give the evidence needed. Another option is to add `-volume.minFreeSpace` if the cause turns out to be free-disk accounting.

## Verdict
PASS (no CRITICAL/MAJOR findings). The final check is the GitHub runner run.
