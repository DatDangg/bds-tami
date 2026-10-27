import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { chooseOption, renderWithIntl } from "@/components/media/test-utils";
import vi_ from "@/i18n/messages/vi.json";
import { JobFilters } from "./JobFilters";

const formProps = vi.hoisted(() => ({ last: undefined as Record<string, unknown> | undefined }));
vi.mock("next/form", () => ({
  default: (props: Record<string, unknown>) => {
    formProps.last = props;
    const { children, className, action, 'aria-label': label } = props as { children: React.ReactNode; className?: string; action: string; "aria-label"?: string };
    return (
      <form className={className} action={action} aria-label={label}>
        {children}
      </form>
    );
  },
}));

const provinces = [
  { slug: "ha-noi", name: "Hà Nội" },
  { slug: "ho-chi-minh", name: "Hồ Chí Minh" },
];

describe("JobFilters", () => {
  it("no-JS: SSR render <select name=province> gốc có giá trị chọn sẵn + ô q giữ từ khoá + nút submit, không lộ sentinel", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="vi" messages={vi_}>
        <JobFilters actionPath="/tuyen-dung" provinces={provinces} selectedProvince="ha-noi" keyword="tu van" active />
      </NextIntlClientProvider>,
    );
    expect(html).toContain('<select id="job-filter-province" name="province"');
    expect(html).toMatch(/<option value="ha-noi" selected="">/);
    expect(html).toMatch(/<input[^>]*name="q"[^>]*value="tu van"/);
    expect(html).toMatch(/<button[^>]*type="submit"/);
    expect(html).not.toContain("__tami_empty__");
  });

  it("sau mount: Select TAMI + input ẩn name=province; chọn 'Mọi khu vực' → giá trị rỗng", async () => {
    const user = userEvent.setup();
    const { container } = renderWithIntl(<JobFilters actionPath="/tuyen-dung" provinces={provinces} selectedProvince="ha-noi" active={false} />);
    expect(screen.getByLabelText("Khu vực")).toHaveTextContent("Hà Nội");
    expect(container.querySelector("input[type=hidden][name=province]")).toHaveValue("ha-noi");
    await chooseOption(user, screen.getByLabelText("Khu vực"), "Mọi khu vực");
    expect(container.querySelector("input[type=hidden][name=province]")).toHaveValue("");
    expect(screen.getByRole("searchbox", { name: "Tìm theo tên vị trí" })).toHaveValue("");
    expect(screen.queryByRole("link", { name: "Xoá bộ lọc" })).toBeNull();
  });

  it("BL-089: form không cuộn về đầu trang sau khi tìm (scroll=false)", () => {
    renderWithIntl(<JobFilters actionPath="/tuyen-dung" provinces={provinces} active={false} />);
    expect(formProps.last?.scroll).toBe(false);
  });

  it("BL-089: keyword trên URL đổi → ô q nạp lại giá trị mới nhưng KHÔNG remount (focus giữ)", () => {
    const { rerender } = renderWithIntl(<JobFilters actionPath="/tuyen-dung" provinces={provinces} keyword="tu van" active />);
    const input = screen.getByRole("searchbox", { name: "Tìm theo tên vị trí" });
    act(() => input.focus());
    expect(input).toHaveValue("tu van");
    rerender(
      <NextIntlClientProvider locale="vi" messages={vi_}>
        <JobFilters actionPath="/tuyen-dung" provinces={provinces} keyword="sale" active />
      </NextIntlClientProvider>,
    );
    const after = screen.getByRole("searchbox", { name: "Tìm theo tên vị trí" });
    expect(after).toBe(input);
    expect(after).toHaveValue("sale");
    expect(after).toHaveFocus();
  });
});
