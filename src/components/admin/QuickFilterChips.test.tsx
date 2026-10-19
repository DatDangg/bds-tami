import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  where: undefined as unknown,
  isInDrawer: false,
  refineListData: vi.fn(),
}));

vi.mock("@payloadcms/ui", () => ({
  useListQuery: () => ({ query: { where: state.where }, refineListData: state.refineListData }),
  useListDrawerContext: () => ({ isInDrawer: state.isInDrawer }),
}));

import { Leads } from "../../collections/Leads";
import { Rentals } from "../../collections/Rentals";
import { RENTAL_QUICK_FILTER_GROUPS, withChip } from "../../lib/admin/quick-filters";
import { LeadQuickFilterSlot } from "./LeadQuickFilterSlot";
import { QuickFilterChips } from "./QuickFilterChips";
import { RentalQuickFilterSlot } from "./RentalQuickFilterSlot";

const [statusGroup] = RENTAL_QUICK_FILTER_GROUPS;

function setup(where?: unknown) {
  state.where = where;
  state.isInDrawer = false;
  state.refineListData.mockClear();
  return render(<QuickFilterChips groups={RENTAL_QUICK_FILTER_GROUPS} />);
}

describe("QuickFilterChips", () => {
  it("3 nhóm có nhãn; chip là nút aria-pressed; không lọc thì chỉ `Tất cả` của nhóm có Tất cả sáng", () => {
    setup();
    for (const name of ["Trạng thái", "Số phòng ngủ", "Khoảng giá"]) expect(screen.getByRole("group", { name })).toBeInTheDocument();
    const status = screen.getByRole("group", { name: "Trạng thái" });
    expect(status.querySelectorAll("button").length).toBe(4);
    expect(screen.getAllByRole("button", { name: "Tất cả" }).every((button) => button.getAttribute("aria-pressed") === "true")).toBe(true);
    expect(screen.getByRole("button", { name: "Đang cho thuê" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("group", { name: "Khoảng giá" }).querySelectorAll("button").length).toBe(4);
  });

  it("bấm chip: ghi where đúng, về trang 1, giữ điều kiện khác", () => {
    setup({ and: [{ title: { like: "abc" } }] });
    fireEvent.click(screen.getByRole("button", { name: "Đã thuê" }));
    expect(state.refineListData).toHaveBeenCalledWith({ where: { and: [{ title: { like: "abc" } }, { status: { equals: "rented" } }] }, page: 1 });
  });

  it("chip sáng theo where (kể cả dạng chuỗi từ URL); bấm lại hoặc `Tất cả` = bỏ lọc nhóm", () => {
    setup({ or: [{ and: [{ bedrooms: { equals: "2" } }] }] });
    const chip = screen.getByRole("button", { name: "2 PN" });
    expect(chip).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(chip);
    expect(state.refineListData).toHaveBeenLastCalledWith({ where: { or: [{ and: [] }] }, page: 1 });
    fireEvent.click(screen.getAllByRole("button", { name: "Tất cả" })[1]!);
    expect(state.refineListData).toHaveBeenLastCalledWith({ where: { or: [{ and: [] }] }, page: 1 });
  });

  it("trong list drawer: không render", () => {
    state.where = undefined;
    state.isInDrawer = true;
    const { container } = render(<QuickFilterChips groups={RENTAL_QUICK_FILTER_GROUPS} />);
    expect(container.innerHTML).toBe("");
  });
});

describe("RentalQuickFilterSlot + cấu hình Rentals", () => {
  it("danh sách thường render chip; thùng rác thì không", () => {
    state.where = undefined;
    state.isInDrawer = false;
    const normal = render(<RentalQuickFilterSlot params={{ segments: ["collections", "rentals"] }} />);
    expect(normal.getByRole("button", { name: "Studio" })).toBeInTheDocument();
    const trash = render(<RentalQuickFilterSlot params={{ segments: ["collections", "rentals", "trash"] }} />);
    expect(trash.container.innerHTML).toBe("");
  });

  it("đăng ký ở beforeListTable, đứng trước ô Lọc dịch (ghép bởi withContentDefaults)", () => {
    expect(Rentals.admin?.components?.beforeListTable).toEqual([
      "/components/admin/RentalQuickFilterSlot#RentalQuickFilterSlot",
      "/components/admin/TranslationStatusFilter#TranslationStatusFilter",
    ]);
  });

  it("dùng chung kết quả withChip", () => {
    expect(withChip(undefined, statusGroup!, "draft")).toEqual({ and: [{ status: { equals: "draft" } }] });
  });
});

describe("QuickFilterChips — `Tất cả` (minor review T01)", () => {
  it("bộ lọc tay không khớp chip (vd status = spam): `Tất cả` không sáng, chip nào cũng không sáng", () => {
    setup({ and: [{ status: { equals: "spam" } }] });
    const status = screen.getByRole("group", { name: "Trạng thái" });
    expect(Array.from(status.querySelectorAll("button")).every((button) => button.getAttribute("aria-pressed") === "false")).toBe(true);
  });

  it("bấm `Tất cả` đang sáng: không gọi refineListData", () => {
    setup();
    fireEvent.click(screen.getAllByRole("button", { name: "Tất cả" })[0]!);
    expect(state.refineListData).not.toHaveBeenCalled();
  });

  it("bấm `Tất cả` khi bộ lọc tay không khớp chip: bỏ điều kiện status", () => {
    setup({ and: [{ status: { equals: "spam" } }] });
    fireEvent.click(screen.getAllByRole("button", { name: "Tất cả" })[0]!);
    expect(state.refineListData).toHaveBeenCalledWith({ where: { and: [] }, page: 1 });
  });
});

describe("LeadQuickFilterSlot + chip Lead", () => {
  const renderLead = (segments: string[]) => render(<LeadQuickFilterSlot params={{ segments }} />);

  it("danh sách thường: 5 nút Trạng thái; thùng rác thì không render", () => {
    state.where = undefined;
    state.isInDrawer = false;
    const normal = renderLead(["collections", "leads"]);
    const labels = Array.from(normal.getByRole("group", { name: "Trạng thái" }).querySelectorAll("button")).map((button) => button.textContent);
    expect(labels).toEqual(["Tất cả", "Mới (chưa giao)", "Đang tư vấn", "Đã chốt", "Không thành"]);
    expect(renderLead(["collections", "leads", "trash"]).container.innerHTML).toBe("");
  });

  it("bấm Mới (chưa giao): ghi status = new + assignedTo exists false, về trang 1", () => {
    setup(undefined);
    render(<LeadQuickFilterSlot params={{ segments: ["collections", "leads"] }} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Mới (chưa giao)" })[0]!);
    expect(state.refineListData).toHaveBeenLastCalledWith({ where: { and: [{ status: { equals: "new" } }, { assignedTo: { exists: "false" } }] }, page: 1 });
  });

  it("đăng ký ở beforeListTable cùng hàng với nút xuất, chip trước", () => {
    expect(Leads.admin?.components?.beforeListTable).toEqual([
      "/components/admin/LeadQuickFilterSlot#LeadQuickFilterSlot",
      "/components/admin/LeadExportSlot#LeadExportSlot",
    ]);
  });
});
