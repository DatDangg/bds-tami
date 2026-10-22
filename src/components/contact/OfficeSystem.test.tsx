import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import type { OfficeView } from "@/lib/content/contact-view";
import { OfficeSystem } from "./OfficeSystem";

const HANOI: OfficeView = {
  id: "hn",
  name: "Văn phòng Hà Nội",
  address: "Lô A, Tây Hồ, Hà Nội",
  location: { lat: 21.07, lng: 105.81 },
  phone: { label: "1900 0000", telHref: "tel:19000000" },
  email: "hn@tami.vn",
  directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=21.07%2C105.81",
};
const HCM: OfficeView = { id: "hcm", name: "Văn phòng TP.HCM", address: "Quận 1, TP.HCM", location: null, directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=Qu%E1%BA%ADn%201" };
const BAC_NINH: OfficeView = { id: "bn", name: "Văn phòng Bắc Ninh", address: "TP. Bắc Ninh", location: { lat: 21.18, lng: 106.07 } };

describe("OfficeSystem (BL-054)", () => {
  it("1 văn phòng → không tablist, có bản đồ + thẻ (tel:, mailto:, Chỉ đường tab mới)", () => {
    renderWithIntl(<OfficeSystem offices={[HANOI]} />, "vi");
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByText("Lựa chọn chi nhánh để xem vị trí trên bản đồ.")).toBeNull();
    expect(screen.getByRole("region", { name: "Văn phòng Hà Nội trên bản đồ" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Điện thoại:\s*1900 0000$/ })).toHaveAttribute("href", "tel:19000000");
    expect(screen.getByRole("link", { name: /^Email:\s*hn@tami\.vn$/ })).toHaveAttribute("href", "mailto:hn@tami.vn");
    const directions = screen.getByRole("link", { name: "Chỉ đường tới Văn phòng Hà Nội trên Google Maps (mở tab mới)" });
    expect(directions).toHaveAttribute("href", HANOI.directionsUrl);
    expect(directions).toHaveAttribute("target", "_blank");
    expect(directions).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("≥ 2 văn phòng: bấm tab đổi thẻ + bản đồ; văn phòng không toạ độ → không bản đồ", async () => {
    const user = userEvent.setup();
    renderWithIntl(<OfficeSystem offices={[HANOI, HCM, BAC_NINH]} />, "vi");
    expect(screen.getByRole("tablist", { name: "Chọn văn phòng" })).toBeInTheDocument();
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Văn phòng Hà Nội");
    await user.click(screen.getByRole("tab", { name: "Văn phòng TP.HCM" }));
    expect(screen.getByRole("tab", { name: "Văn phòng TP.HCM" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { level: 3, name: "Văn phòng TP.HCM" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /trên bản đồ/ })).toBeNull();
    await user.click(screen.getByRole("tab", { name: "Văn phòng Bắc Ninh" }));
    expect(screen.getByRole("region", { name: "Văn phòng Bắc Ninh trên bản đồ" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Chỉ đường/ })).toBeNull();
  });

  it("bàn phím theo mẫu ARIA tabs: →/← vòng, Home/End, roving tabindex", async () => {
    const user = userEvent.setup();
    renderWithIntl(<OfficeSystem offices={[HANOI, HCM, BAC_NINH]} />, "vi");
    const [first, second, third] = screen.getAllByRole("tab");
    expect(first).toHaveAttribute("tabindex", "0");
    expect(second).toHaveAttribute("tabindex", "-1");
    first!.focus();
    await user.keyboard("{ArrowLeft}");
    expect(third).toHaveFocus();
    expect(third).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowRight}");
    expect(first).toHaveFocus();
    await user.keyboard("{End}");
    expect(third).toHaveFocus();
    await user.keyboard("{Home}");
    expect(first).toHaveFocus();
    expect(first).toHaveAttribute("aria-selected", "true");
  });

  it("không có văn phòng → không render", () => {
    const { container } = renderWithIntl(<OfficeSystem offices={[]} />, "vi");
    expect(container).toBeEmptyDOMElement();
  });
});
