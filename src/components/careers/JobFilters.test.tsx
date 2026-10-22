import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { chooseOption, renderWithIntl } from "@/components/media/test-utils";
import vi_ from "@/i18n/messages/vi.json";
import { JobFilters } from "./JobFilters";

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
});
