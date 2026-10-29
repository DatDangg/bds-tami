const PLACEHOLDER_HOST_SUFFIXES = [".invalid", ".example", ".test"];
const PLACEHOLDER_HOSTS = ["example.com", "example.org", "example.net"];

function isPlaceholderHost(host: string): boolean {
  const lowered = host.trim().toLowerCase();
  return (
    lowered.length === 0 ||
    lowered.includes("placeholder") ||
    PLACEHOLDER_HOSTS.includes(lowered) ||
    PLACEHOLDER_HOST_SUFFIXES.some((suffix) => lowered.endsWith(suffix))
  );
}

/**
 * Phát hiện cấu hình SMTP còn là giá trị giữ chỗ (mail sẽ không bao giờ tới). Chỉ trả thông điệp để cảnh báo,
 * không chặn khởi động. Không in SMTP_USER/SMTP_PASS; host giữ chỗ thì in được.
 */
export function findSmtpConfigProblems(args: { host: string; user: string }): string[] {
  const problems: string[] = [];
  if (isPlaceholderHost(args.host)) {
    problems.push(`SMTP_HOST="${args.host.trim()}" là giá trị giữ chỗ hoặc rỗng: mọi email (gồm quên mật khẩu admin) sẽ không gửi được.`);
  }
  if (args.user.trim().toLowerCase() === "placeholder") {
    problems.push("SMTP_USER là giá trị giữ chỗ: đăng nhập SMTP sẽ thất bại.");
  }
  return problems;
}
