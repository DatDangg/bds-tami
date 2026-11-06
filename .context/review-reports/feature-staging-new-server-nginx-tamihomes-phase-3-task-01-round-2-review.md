Agent: reviewer

# Review — feature-staging-new-server-nginx-tamihomes · phase-3-task-01 · round 2 (BL-111)

- Review level: **STRICT**, same as round 1. The host is shared and the scope includes IP trust, headers and certificate renewal.
- Reason: this round re-checks the round-1 MAJOR-1 docs fix, MINOR-2 and MINOR-3, and the comment-only conf changes the primary copied to the server.
- Blast radius: docs and comments only (runbook §11, Decision 12, ARCHITECTURE §6.1/§6.3, comments in 2 nginx confs, task file). On the server, the 3 confs were re-copied and nginx reloaded.

## Verify commands + result
- Project verify commands: skipped. Nothing under `src/` changed for BL-111; the diff is docs, nginx comments and YAML/env comments.
- aislop / oxlint: N/A (no TS/JS). ocr / blitzstrike: skipped, not installed. AI-readable: OK. ai-friendly-web: N/A (staging is meant to be noindex). Responsive Checklist Gate: **N/A**, the diff does not touch UI.
- Repo, `git diff -M HEAD` on the 2 confs: the only non-comment lines are still `server_name` and the 2 `ssl_certificate*` paths. `tami-default-reject.conf` changed only in comments; its directives are unchanged.
- sha256 with CR stripped, repo vs server `/etc/nginx/sites-available`, all equal:
  - `tami-staging-sslip-179.conf` = 1dc89545…
  - `-http.conf` = 2b6f15a1…
  - `tami-default-reject.conf` = 361d99bc…
- Server, read-only:
  - `nginx -t` passes and nginx is `active`.
  - sites-enabled still lists the same 5 sites.
  - The outfitai site file is unchanged (mtime 04:27).
- From outside:
  - `https://179-197-242-57.sslip.io/` returns 200 with `ssl_verify_result=0`.
  - A request with an unknown hostname (SNI) still has its handshake rejected (curl 35).

## Fix verification
| Round-1 finding | Status | Evidence |
|---|---|---|
| MAJOR-1 runbook §11.1 | Fixed | Adds an **Ngoại lệ** block naming outfitai with its site and cert times (04:21Z / 04:27Z, before TAMI's reject site). Lists 3 effects: the reject site is the host-wide 443 default; the ACME account is shared, so `--register-unsafely-without-email` did nothing; the global hook is shared. Includes "Báo chủ outfitai; không sửa site/cert của họ". |
| MAJOR-1 runbook §11.3 dry-run | Fixed | `sudo certbot renew --dry-run --cert-name 179-197-242-57.sslip.io --no-random-sleep-on-renew` + a warning not to run a bare `renew --dry-run` |
| MAJOR-1 Decision 12 | Mostly fixed | Context and Consequences now describe outfitai, the reject site, the shared account and the shared hook. The Rationale line `:112` still says "Host mới chưa site 443 nào", see MINOR-A. |
| MAJOR-1 ARCHITECTURE 401/443 | Fixed | Both lines now say 443/certbot is shared with outfitai |
| MAJOR-1 conf comments | Fixed | `tami-staging-sslip-179.conf:3,22` and `tami-default-reject.conf:2` now describe the shared 443. The timeline in conf line 3 is correct: TAMI installed nginx at P2.01 (~03:59 symlink `default`), and outfitai was added after that. |
| MAJOR-1 task Evidence 10 | Fixed | Correct timeline: outfitai site 04:21Z and cert 04:27Z, both BEFORE `tami-default-reject.conf` (05:18Z). Also covers the shared account and hook, plus notifying the owner. |
| MINOR-2 task title | Fixed | The title now says `179-197-242-57.sslip.io`. The progress.json, BACKLOG and change-doc acceptance text get updated at close-out (primary). |
| MINOR-3 ARCHITECTURE "Tên miền" row | Pending, primary's commit step | The working tree still shows the non-literal row (`:449`). The primary says it will commit a HEAD-based ARCHITECTURE with the row text given in its message. This is not checkable before the commit; see Residual. |
| MINOR-1 nav links to old host | Moved to the user (content) | Not a code issue |

## Findings
### [MINOR-A] One Decision 12 Rationale line still says the host had no other 443 site
`.context/decisions.md:112`: "Host mới chưa site 443 nào nên TAMI sở hữu nginx…". It is true as the state at decision time (before 04:21), and Context and Consequences directly above now record the shared 443/certbot, so it does not mislead and does not block.
- Suggested change when convenient: "(lúc quyết định; nay dùng chung với outfitai, xem Consequences)".

No CRITICAL or MAJOR findings remain.

## Residual risk
- MINOR-3: before committing, the primary must check that the staged ARCHITECTURE contains only the BL-111 hunks (`git diff --cached docs/ARCHITECTURE.md`). The "Tên miền" row should be exactly the text promised. The reviewer cannot verify the commit content in advance.
- Turnstile is still waiting on U2 (user adds the hostname), so acceptance item 3 stays open. That is a user dependency and does not block.
- Content: the header nav links to `187-52-119-50.sslip.io` (MINOR-1 round 1); this is a user/content item.
- The outfitai owner has not been told yet (user/primary action).
- Not checked from outside: HTTP/2 negotiation and IPv6. Unchanged since round 1.

## Verdict: PASS
The round-1 MAJOR is fixed: docs and comments now match the server state, and the runbook dry-run command no longer touches the other project's certificate. The server conf matches the repo, nginx -t passes, and the site still serves.
