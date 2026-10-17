"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/monitoring/report-client-error";

const HOTLINE = process.env.NEXT_PUBLIC_HOTLINE?.trim();

const PAGE_STYLE = {
  margin: 0,
  minHeight: "100dvh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "1.5rem",
  padding: "1rem",
  textAlign: "center",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  color: "#141414",
  background: "#f7f5f4",
} as const;

const BUTTON_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  minWidth: 44,
  padding: "0 1.5rem",
  border: 0,
  borderRadius: 4,
  background: "#111111",
  color: "#ffffff",
  font: "inherit",
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
} as const;

/**
 * Lỗi ở layout gốc (design-spec S18): không dùng được layout/i18n/CSS của app nên là HTML tự chứa, SONG NGỮ cùng lúc,
 * style inline, không gọi API. Hotline lấy từ biến build `NEXT_PUBLIC_HOTLINE` để vẫn hiện khi DB lỗi. Không hiện stack.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => reportClientError(error), [error]);
  return (
    <html lang="vi">
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <title>TAMI</title>
      </head>
      <body style={PAGE_STYLE}>
        <svg role="img" aria-label="TAMI" width="120" height="40" viewBox="0 0 120 40">
          <text x="60" y="30" textAnchor="middle" fontFamily="Georgia, serif" fontSize="32" fontWeight="700" letterSpacing="4" fill="#141414">
            TAMI
          </text>
        </svg>
        <section lang="vi">
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>Đã có lỗi xảy ra</h1>
          <p style={{ margin: 0 }}>
            Vui lòng thử lại sau ít phút.{HOTLINE ? ` Nếu cần gấp, gọi hotline ${HOTLINE}.` : ""}
          </p>
        </section>
        <section lang="en">
          <h2 style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>Something went wrong</h2>
          <p style={{ margin: 0 }}>
            Please try again in a few minutes.{HOTLINE ? ` For urgent help, call ${HOTLINE}.` : ""}
          </p>
        </section>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
          <button type="button" onClick={reset} style={BUTTON_STYLE}>
            Thử lại / Try again
          </button>
          {/* Thẻ <a> thường có chủ ý: tải lại trọn trang để thoát khỏi trạng thái lỗi của layout gốc. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" style={BUTTON_STYLE}>
            Trang chủ / Home
          </a>
        </div>
        {error.digest && <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b6b6b" }}>Mã lỗi / Error code: {error.digest}</p>}
      </body>
    </html>
  );
}
