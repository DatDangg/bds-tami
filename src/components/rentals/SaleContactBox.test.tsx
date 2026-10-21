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

const view = { rented: false, priceMonthlyVnd: 12_000_000, priceNegotiable: false };
const hotline = { label: "0901 234 567", telHref: "tel:0901234567" };
const sale = { name: "Nguyễn Văn Sale", phoneLabel: "0901 111 222", telHref: "tel:0901111222", avatar: null };

beforeEach(() => leadFormProps.mockClear());

describe("SaleContactBox (DetailContactAside, BL-052)", () => {
  it("một thẻ trắng: giá thuê/tháng TRÊN tiêu đề form; form lead source=rental, sourceId là id tin; một #lead-form", () => {
    const { container } = renderWithIntl(<SaleContactBox view={view} rentalId="r1" sale={null} hotline={hotline} />);
    expect(leadFormProps).toHaveBeenCalledWith(expect.objectContaining({ source: "rental", sourceId: "r1", hotline }));
    expect(container.querySelectorAll("form")).toHaveLength(1);
    const slot = container.querySelector("#lead-form") as HTMLElement;
    const heading = screen.getByRole("heading", { level: 2, name: "Nhận tư vấn" });
    expect(slot).toContainElement(heading);
    const card = slot.parentElement as HTMLElement;
    expect(card.className).toContain("bg-surface");
    expect(slot.className).toContain("bg-transparent");
    const price = within(card).getByText("Giá thuê");
    expect(price.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(card).toHaveTextContent("12 triệu/tháng");
  });

  it("sale phụ trách: khối nền vàng nhạt + nút gọi sale; KHÔNG khối hotline", () => {
    renderWithIntl(<SaleContactBox view={view} rentalId="r1" sale={sale} hotline={hotline} />);
    expect(screen.getByText("Nguyễn Văn Sale").closest("div[class*='bg-primary-subtle']")).not.toBeNull();
    expect(screen.getByRole("link", { name: "Gọi 0901 111 222" })).toHaveAttribute("href", "tel:0901111222");
    expect(screen.queryByRole("link", { name: "Gọi ngay 0901 234 567" })).toBeNull();
  });

  it("không có sale → khối Hotline nền tối 'Gọi ngay', không tên sale", () => {
    const { container } = renderWithIntl(<SaleContactBox view={view} rentalId="r1" sale={null} hotline={hotline} />);
    expect(container.textContent).not.toContain("Nguyễn Văn Sale");
    expect(screen.getByRole("link", { name: "Gọi ngay 0901 234 567" })).toHaveAttribute("href", "tel:0901234567");
  });

  it("không sale, không hotline → không nút gọi nào, form vẫn có", () => {
    const { container } = renderWithIntl(<SaleContactBox view={view} rentalId="r1" sale={null} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(container.querySelector("#lead-form form")).not.toBeNull();
  });

  it("giá: thương lượng → 'Thương lượng'; chưa nhập giá → 'Liên hệ'", () => {
    const { unmount } = renderWithIntl(<SaleContactBox view={{ ...view, priceMonthlyVnd: null, priceNegotiable: true }} rentalId="r1" sale={null} />);
    expect(screen.getByText("Thương lượng")).toBeInTheDocument();
    unmount();
    renderWithIntl(<SaleContactBox view={{ ...view, priceMonthlyVnd: null }} rentalId="r1" sale={null} />);
    expect(screen.getByText("Liên hệ")).toBeInTheDocument();
  });

  it("tin đã thuê: giá tham khảo mờ và tiêu đề form 'Nhận tư vấn căn tương tự'; nguồn vẫn là tin đó", () => {
    renderWithIntl(<SaleContactBox view={{ rented: true, priceMonthlyVnd: null, priceNegotiable: true }} rentalId="r9" sale={null} hotline={hotline} />);
    expect(screen.getByText("Giá tham khảo")).toBeInTheDocument();
    expect(screen.getByText("Thương lượng").className).toContain("text-text-muted");
    expect(screen.getByRole("heading", { level: 2, name: "Nhận tư vấn căn tương tự" })).toBeInTheDocument();
    expect(leadFormProps).toHaveBeenCalledWith(expect.objectContaining({ source: "rental", sourceId: "r9" }));
  });
});
