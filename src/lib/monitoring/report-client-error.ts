/**
 * Gửi lỗi render ở trình duyệt lên GlitchTip (error boundary của Next nuốt lỗi nên SDK không tự thấy).
 * SDK nạp lười như `instrumentation-client.ts`; chưa khởi tạo (không có DSN) thì `captureException` không làm gì.
 * Báo lỗi hỏng không được làm hỏng trang lỗi nên nuốt mọi ngoại lệ.
 */
export function reportClientError(error: Error): void {
  import("@sentry/nextjs")
    .then((Sentry) => Sentry.captureException(error))
    .catch(() => undefined);
}
