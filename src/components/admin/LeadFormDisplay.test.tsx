import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ value: undefined as unknown, fields: {} as Record<string, { value: unknown }> }));
vi.mock("@payloadcms/ui", () => ({
  useField: () => ({ value: state.value }),
  useFormFields: (select: (arg: [Record<string, { value: unknown }>]) => unknown) => select([state.fields]),
}));

import { LeadEmailAction, LeadPhoneActions } from "./LeadContactButtons";
import { LeadActivitySummary, LeadHiddenField, LeadLinkField, LeadLocaleField } from "./LeadFormDisplay";

describe("LeadPhoneActions / LeadEmailAction", () => {
  it("Gọi + Zalo chuẩn hoá, Zalo mở tab mới an toàn", () => {
    state.value = "+84 956 789 012";
    render(<LeadPhoneActions path="phone" />);
    expect(screen.getByRole("link", { name: "Gọi" })).toHaveAttribute("href", "tel:+84956789012");
    const zalo = screen.getByRole("link", { name: "Zalo" });
    expect(zalo).toHaveAttribute("href", "https://zalo.me/0956789012");
    expect(zalo).toHaveAttribute("rel", "noopener noreferrer");
  });
  it("không giá trị (không quyền đọc) → không nút", () => {
    state.value = undefined;
    expect(render(<LeadPhoneActions path="phone" />).container.textContent).toBe("");
    expect(render(<LeadEmailAction path="email" />).container.textContent).toBe("");
  });
  it("email → mailto", () => {
    state.value = "a@b.vn";
    render(<LeadEmailAction path="email" />);
    expect(screen.getByRole("link", { name: "Gửi email" })).toHaveAttribute("href", "mailto:a@b.vn");
  });
});

describe("LeadLinkField / LeadLocaleField / LeadActivitySummary", () => {
  it("link https bấm được, rút gọn", () => {
    state.value = "https://tami.vn/du-an/abc";
    render(<LeadLinkField path="pageUrl" field={{ label: "Trang khách gửi form" }} />);
    const link = screen.getByRole("link", { name: "tami.vn/du-an/abc" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
  it("javascript: chỉ là chữ", () => {
    state.value = "javascript:alert(1)";
    render(<LeadLinkField path="referrer" field={{ label: "Trang khách đến từ" }} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("javascript:alert(1)")).toBeInTheDocument();
  });
  it("locale hiện nhãn chữ", () => {
    state.value = "en";
    render(<LeadLocaleField path="locale" field={{ label: "Ngôn ngữ khách dùng" }} />);
    expect(screen.getByText("Tiếng Anh")).toBeInTheDocument();
  });
  it("tóm tắt hoạt động bỏ phần trống; hidden field trả null", () => {
    state.fields = { mergedCount: { value: 3 } };
    render(<LeadActivitySummary />);
    expect(screen.getByText("Khách gửi lại 3 lần")).toBeInTheDocument();
    expect(render(<LeadHiddenField />).container.textContent).toBe("");
  });
});
