import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { RentalTabView } from "@/lib/home/home-view-listings";
import type { RentalCardData } from "@/lib/rentals/rental-view";
import { HomeRentals } from "./HomeRentals";

const card = (id: string): RentalCardData => ({
  id,
  title: `Căn hộ ${id}`,
  href: `/cho-thue/can-ho-${id}`,
  code: `CT-${id}`,
  priceMonthlyVnd: 9_000_000,
  priceNegotiable: false,
  areaM2: 40,
  bedrooms: 1,
  areaLabel: "Phường 1, TP.HCM",
  cover: fakeMedia(id),
  rented: false,
  categoryLabel: "Căn hộ dịch vụ",
  furnishing: "full",
  bathrooms: 1,
});
const tab = (slug: string, label: string, ids: string[]): RentalTabView => ({ id: slug, label, href: `/cho-thue/danh-muc/${slug}`, cards: ids.map(card) });
const tabs = [tab("nha-o", "Thuê nhà ở", ["1", "2"]), tab("kinh-doanh", "Thuê kinh doanh", ["3"]), tab("van-phong", "Văn phòng", ["4"])];

describe("HomeRentals", () => {
  it("BL-052: trang chủ GIỮ thẻ Cho thuê cũ (biến thể home: badge Còn trống, không tag danh mục / nội thất, không phòng tắm)", () => {
    renderWithIntl(<HomeRentals title="Cho thuê" tabs={tabs} />);
    const articles = [...document.querySelectorAll("article")];
    expect(articles.map((article) => article.getAttribute("data-card-variant"))).toEqual(["home", "home", "home", "home"]);
    const first = articles[0] as HTMLElement;
    expect(first).toHaveTextContent("Còn trống");
    expect(first).not.toHaveTextContent("Căn hộ dịch vụ");
    expect(first).not.toHaveTextContent("Nội thất đầy đủ");
    expect(first).not.toHaveTextContent("PT");
    expect(within(first).queryByRole("list")).toBeNull();
  });

  it("heading h2 + tablist có tên; tab đầu được chọn sẵn, các panel còn lại có hidden (HTML server render đủ mọi tab)", () => {
    renderWithIntl(<HomeRentals title="Cho thuê" tabs={tabs} />);
    expect(screen.getByRole("heading", { level: 2, name: "Cho thuê" })).toBeInTheDocument();
    const tablist = screen.getByRole("tablist", { name: "Danh mục cho thuê" });
    const items = within(tablist).getAllByRole("tab");
    expect(items.map((item) => [item.textContent, item.getAttribute("aria-selected"), item.getAttribute("tabindex")])).toEqual([
      ["Thuê nhà ở", "true", "0"],
      ["Thuê kinh doanh", "false", "-1"],
      ["Văn phòng", "false", "-1"],
    ]);
    const panels = document.querySelectorAll('[role="tabpanel"]');
    expect([...panels].map((panel) => panel.hasAttribute("hidden"))).toEqual([false, true, true]);
    // Mọi thẻ của mọi tab đã nằm trong DOM (không fetch ở client).
    expect(document.querySelectorAll("article")).toHaveLength(4);
    expect(items[0]).toHaveAttribute("aria-controls", panels[0]?.id);
    expect(panels[0]).toHaveAttribute("aria-labelledby", items[0]?.id);
  });

  it("không-JS: tab đầu hiện sẵn, thẻ là link thật và 'Xem thêm' trỏ trang danh mục", () => {
    renderWithIntl(<HomeRentals title="Cho thuê" tabs={tabs} />);
    const panel = screen.getByRole("tabpanel", { name: "Thuê nhà ở" });
    expect(within(panel).getByRole("link", { name: /Căn hộ 1/ })).toHaveAttribute("href", "/cho-thue/can-ho-1");
    expect(within(panel).getByRole("link", { name: "Xem thêm" })).toHaveAttribute("href", "/cho-thue/danh-muc/nha-o");
    expect(within(panel).getByRole("group", { name: "Tin 2 / 2" })).toHaveAttribute("aria-roledescription", "slide");
    expect(within(panel).getByRole("region")).toHaveAttribute("aria-roledescription", "carousel");
  });

  it("bấm tab → hiện panel của tab đó với 'Xem thêm' đúng danh mục", () => {
    renderWithIntl(<HomeRentals title="Cho thuê" tabs={tabs} />);
    fireEvent.click(screen.getByRole("tab", { name: "Thuê kinh doanh" }));
    expect(screen.getByRole("tab", { name: "Thuê kinh doanh" })).toHaveAttribute("aria-selected", "true");
    const panel = screen.getByRole("tabpanel", { name: "Thuê kinh doanh" });
    expect(within(panel).getByRole("link", { name: "Xem thêm" })).toHaveAttribute("href", "/cho-thue/danh-muc/kinh-doanh");
    expect(screen.queryByRole("tabpanel", { name: "Thuê nhà ở" })).toBeNull();
  });

  it("bàn phím: ←/→ (vòng), Home/End chuyển tab và đưa focus theo", () => {
    renderWithIntl(<HomeRentals title="Cho thuê" tabs={tabs} />);
    const [first, second, third] = screen.getAllByRole("tab");
    fireEvent.keyDown(first!, { key: "ArrowRight" });
    expect(second).toHaveAttribute("aria-selected", "true");
    expect(second).toHaveFocus();
    fireEvent.keyDown(second!, { key: "End" });
    expect(third).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(third!, { key: "ArrowRight" });
    expect(first).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(first!, { key: "ArrowLeft" });
    expect(third).toHaveFocus();
    fireEvent.keyDown(third!, { key: "Home" });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first!, { key: "a" });
    expect(first).toHaveAttribute("aria-selected", "true");
  });

  it("chỉ một danh mục: không dựng tablist, panel gắn nhãn bằng tiêu đề khối", () => {
    renderWithIntl(<HomeRentals title="Cho thuê" tabs={[tabs[0]!]} />);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getByRole("region", { name: "Cho thuê" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem thêm" })).toHaveAttribute("href", "/cho-thue/danh-muc/nha-o");
  });

  it("title CMS trống → dùng chữ mặc định theo ngôn ngữ; tab chưa chọn có viền để nhận ra là bấm được", () => {
    renderWithIntl(<HomeRentals title="" tabs={tabs} />);
    expect(screen.getByRole("heading", { level: 2, name: "Thuê nhà ở & kinh doanh" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Văn phòng" })).toHaveClass("border-border");
  });

  it("EN: nhãn tiếng Anh", () => {
    renderWithIntl(<HomeRentals title="For rent" tabs={tabs} />, "en");
    expect(screen.getByRole("tablist", { name: "Rental categories" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "See more" })[0]).toHaveAttribute("href", "/cho-thue/danh-muc/nha-o");
    expect(screen.getAllByRole("group", { name: "Listing 1 of 2" }).length).toBeGreaterThan(0);
  });
});
