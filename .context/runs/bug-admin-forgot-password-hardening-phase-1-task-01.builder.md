# builder summary BL-100 (redo attempt 1)
- Done: Staff forgot-password endpoint (parse body on clone, run default handler in background, uniform 200, whitelist log), adapter allowlist guard, SMTP placeholder warn in onInit. Removed ALS deferred-send (redundant).
- Live-verified on dev with smtp.invalid; typecheck/lint/test PASS. Not committed (dispatcher).
- Left: reviewer STRICT.
