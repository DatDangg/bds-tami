import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { SaleContactBox } from "./SaleContactBox";

const leadFormProps = vi.hoisted(() => vi.fn());
vi.mock("@/components/leads/LeadForm", () => ({
  LeadForm: (props: unknown) => {
    leadFormProps(props);
    return <form aria-label="lead" />;
  },
}));

const view = { rented: false, priceMonthlyVnd: 12_000_000 };
const hotline = { label: "0901 234 567", telHref: "tel:0901234567" };

beforeEach(() => leadFormProps.mockClear());

describe("SaleContactBox", () => {
  it("form lead gửi với source=rental và sourceId là id tin; một form trong thẻ trắng", () => {
    const { container } = renderWithIntl(<SaleContactBox view={view} rentalId="r1" sale={null} hotline={hotline} />);
    expect(leadFormProps).toHaveBeenCalledWith(expect.objectContaining({ source: "rental", sourceId: "r1", hotline }));
    expect(container.querySelectorAll("form")).toHaveLength(1);
    expect(container.querySelector("#lead-form")).not.toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Nhận tư vấn" })).toBeInTheDocument();
  });

  it("sale phụ trách khoác khối .agent (nền vàng nhạt) kèm nút gọi", () => {
    const sale = { name: "Nguyễn Văn Sale", phoneLabel: "0901 111 222", telHref: "tel:0901111222", avatar: null };
    renderWithIntl(<SaleContactBox view={view} rentalId="r1" sale={sale} hotline={hotline} />);
    const agent = screen.getByText("Nguyễn Văn Sale").closest("div[class*='bg-primary-subtle']");
    expect(agent).not.toBeNull();
    expect(screen.getByRole("link", { name: "Gọi 0901 111 222" })).toHaveAttribute("href", "tel:0901111222");
  });

  it("không có sale → hotline chung cùng kiểu khối .agent, không tên sale", () => {
    const { container } = renderWithIntl(<SaleContactBox view={view} rentalId="r1" sale={null} hotline={hotline} />);
    expect(container.textContent).not.toContain("Nguyễn Văn Sale");
    expect(within(container).getByText("Liên hệ TAMI").className).toContain("bg-primary-subtle");
    expect(screen.getByRole("link", { name: "Gọi hotline 0901 234 567" })).toHaveAttribute("href", "tel:0901234567");
  });

  it("tin đã thuê: giá tham khảo mờ và tiêu đề form 'Nhận tư vấn căn tương tự'; nguồn vẫn là tin đó", () => {
    renderWithIntl(<SaleContactBox view={{ rented: true, priceMonthlyVnd: null }} rentalId="r9" sale={null} hotline={hotline} />);
    expect(screen.getByText("Giá tham khảo")).toBeInTheDocument();
    expect(screen.getByText("Thoả thuận").className).toContain("text-text-muted");
    expect(screen.getByRole("heading", { level: 2, name: "Nhận tư vấn căn tương tự" })).toBeInTheDocument();
    expect(leadFormProps).toHaveBeenCalledWith(expect.objectContaining({ source: "rental", sourceId: "r9" }));
  });
});
