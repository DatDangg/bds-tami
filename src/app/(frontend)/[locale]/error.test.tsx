import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import ErrorPage from "./error";

vi.mock("@/lib/monitoring/report-client-error", () => ({ reportClientError: vi.fn() }));

afterEach(() => vi.unstubAllEnvs());

const VIETNAMESE = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

describe("500 theo ngôn ngữ", () => {
  it("EN: tiếng Anh, link về /en, Try again gọi reset, hiện digest, không lộ message lỗi", async () => {
    vi.stubEnv("NEXT_PUBLIC_HOTLINE", "0901 234 567");
    const reset = vi.fn();
    const error = Object.assign(new Error("secret db password"), { digest: "abc123" });
    const { container } = renderWithIntl(<ErrorPage error={error} reset={reset} />, "en");
    expect(screen.getByRole("heading", { level: 1, name: "Something went wrong" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/en");
    expect(screen.getByText(/call 0901 234 567/)).toBeInTheDocument();
    expect(screen.getByText("Error code: abc123")).toBeInTheDocument();
    expect(container.textContent).not.toContain("secret");
    expect(container.textContent).not.toMatch(VIETNAMESE);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it("VI: link về /, không có hotline thì bỏ câu hotline", () => {
    vi.stubEnv("NEXT_PUBLIC_HOTLINE", "");
    renderWithIntl(<ErrorPage error={new Error("x")} reset={() => undefined} />, "vi");
    expect(screen.getByRole("heading", { level: 1, name: "Đã có lỗi xảy ra" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Về trang chủ" })).toHaveAttribute("href", "/");
    expect(screen.queryByText(/hotline/)).toBeNull();
    expect(screen.queryByText(/Mã lỗi/)).toBeNull();
  });
});
