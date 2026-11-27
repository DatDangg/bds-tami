---
id: translation-deepseek-provider
type: feature
status: done
created: 2026-11-27
---

# Dịch VI → EN bằng DeepSeek V4.1 Flash (thay/song song Claude API)

## Yêu cầu
User cấp API key (tiền tố `oc_sk_`, đã lưu `.env.local` → `TRANSLATION_PROVIDER_API_KEY`, model `TRANSLATION_PROVIDER_MODEL=deepseek-v4.1-flash`)
và muốn job dịch dùng DeepSeek V4.1 Flash. Hiện `src/lib/translation/claude-client.ts` chỉ gọi Anthropic SDK
(`messages.create` + `output_config` JSON schema), env chỉ có `ANTHROPIC_API_KEY` / `TRANSLATION_MODEL` (`src/lib/env.ts:37`).

## Acceptance (bắt buộc)
- [ ] Thêm client provider OpenAI-compatible (chat completions, JSON output) cài giao diện `TranslationClient`; chọn provider theo env.
- [ ] Map lỗi provider → `TranslationError` mã cố định (không lộ key/body vào `lastError`/log).
- [ ] Map `finish_reason` (`stop`/`length`/…) → `stopReason` tương đương `end_turn`/`max_tokens`.
- [ ] Bảng giá `budget.ts` thêm giá DeepSeek V4.1 Flash (kiểm giá thật) để hạn mức tháng đúng.
- [ ] `.env.example` + docs ghi biến mới; dịch thử 1 bài thật trên dev thành công.

## Ghi chú
- Provider: **OpenCode Go** (user xác nhận 2026-11-27). Đã thử key thật 2026-11-27: OK.
  - Base URL chat completions: `https://opencode.ai/inference/go/openai/v1` (POST `/chat/completions`), danh sách model `GET https://opencode.ai/inference/go/v1/models`.
  - Model id: `deepseek-v4.1-flash` (bản "DeepSeek V4.1 Flash 1017"), context 1M, output tối đa 384K, `structured_output: true`; `response_format: {type:"json_object"}` chạy được, `finish_reason: "stop"`.
  - Header bắt buộc: `Authorization: Bearer <key>`, User-Agent riêng (vd `tami-translate/1.0`), `x-opencode-session` ổn định mỗi job — thiếu session ID thì Go chặn.
  - Model có reasoning (`reasoning_content`, effort low/high/max): lần thử 259 token ra thì 227 là reasoning → nên đặt effort `low`; `content` mới là JSON kết quả.
  - Giá (USD / 1M token): input 0.15, cache read 0.003, output 0.6; nhân 2 vào T2–T6 01:00–04:00 và 06:00–10:00 UTC. Gói Go trừ vào allowance tháng (usage trả `opencode.list_cost`/`allowance`).
  - Tài khoản OpenCode phải bật Region **Global** (Settings > Privacy) mới dùng được DeepSeek — hiện đã chạy được.
- `TRANSLATION_MONTHLY_BUDGET_USD=0` ở dev đang tắt dịch — cần đặt > 0 khi thử.
