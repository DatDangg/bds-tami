/**
 * Tên service chung cho log, lỗi GlitchTip và metrics (`otel_service_name` trong project-config).
 * Tách riêng, không import gì: bundle trình duyệt (instrumentation-client) chỉ cần hằng này, không được kéo theo pino.
 */
export const SERVICE_NAME = "tami-web";
