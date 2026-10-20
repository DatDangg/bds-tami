import Link from "next/link";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ListFilterRow, ListFiltersButton, ListOptionCell, ListSearchBar } from "./ListSearchBar";

function Harness({ onSubmit = () => undefined, count = 0 }: { onSubmit?: () => void; count?: number }) {
  const [value, setValue] = useState("");
  return (
    <ListSearchBar
      action="/cho-thue"
      label="Tìm tin"
      keyword={{ id: "kw", name: "q", label: "Từ khoá", placeholder: "Khu vực", value, onChange: setValue }}
      submitLabel="Tìm kiếm"
      onSubmit={onSubmit}
      preservedParams={{ ward: "ba-dinh", sort: "price_asc", empty: "" }}
      categoryRow={
        <ListFilterRow label="Danh mục">
          <Link href="/cho-thue/danh-muc/can-ho">Căn hộ</Link>
        </ListFilterRow>
      }
      moreLabel="Tùy chọn khác"
      filtersSlot={<ListFiltersButton label="Bộ lọc" count={count} />}
    >
      <ListOptionCell>
        <select aria-label="Khu vực" name="province">
          <option value="">Tất cả</option>
        </select>
      </ListOptionCell>
    </ListSearchBar>
  );
}

describe("ListSearchBar (thẻ lọc nổi 3 hàng, BL-045)", () => {
  it("render: vùng tìm kiếm, từ khoá có nhãn (≤ 100 ký tự), hàng chip có nhãn, hàng 'Tùy chọn khác' có ô chọn + nút Bộ lọc, nút Tìm kiếm", () => {
    render(<Harness />);
    const form = screen.getByRole("search", { name: "Tìm tin" });
    const keyword = within(form).getByLabelText("Từ khoá");
    expect(keyword).toHaveAttribute("type", "search");
    expect(keyword).toHaveAttribute("maxlength", "100");
    expect(within(form).getByText("Danh mục")).toBeInTheDocument();
    expect(within(form).getByRole("link", { name: "Căn hộ" })).toBeInTheDocument();
    const more = within(form).getByRole("group", { name: "Tùy chọn khác" });
    expect(within(more).getByLabelText("Khu vực")).toBeInTheDocument();
    expect(within(more).getByRole("button", { name: "Bộ lọc" })).toHaveAttribute("type", "button");
    expect(within(form).getByRole("button", { name: "Tìm kiếm" })).toHaveAttribute("type", "submit");
  });

  it("thứ tự hàng: từ khoá → chip danh mục → Tùy chọn khác", () => {
    render(<Harness />);
    const keyword = screen.getByLabelText("Từ khoá");
    const chips = screen.getByRole("link", { name: "Căn hộ" });
    const more = screen.getByRole("group", { name: "Tùy chọn khác" });
    expect(keyword.compareDocumentPosition(chips) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(chips.compareDocumentPosition(more) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("không có ô chọn và không có nút Bộ lọc thì hàng 'Tùy chọn khác' không hiện", () => {
    render(<ListSearchBar action="/x" label="Lọc" keyword={{ id: "k", name: "q", label: "Từ khoá", placeholder: "", value: "", onChange: () => undefined }} submitLabel="Tìm" onSubmit={() => undefined} moreLabel="Tùy chọn khác" />);
    expect(screen.queryByRole("group", { name: "Tùy chọn khác" })).toBeNull();
  });

  it("là form GET thật: action = trang, ô có name; tham số khác được giữ bằng input ẩn (giá trị rỗng bị bỏ)", () => {
    render(<Harness />);
    const form = screen.getByRole("search");
    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/cho-thue");
    expect(screen.getByLabelText("Từ khoá")).toHaveAttribute("name", "q");
    expect(screen.getByLabelText("Khu vực")).toHaveAttribute("name", "province");
    const hidden = Array.from(form.querySelectorAll("input[type=hidden]")).map((input) => [input.getAttribute("name"), input.getAttribute("value")]);
    expect(hidden).toEqual([
      ["ward", "ba-dinh"],
      ["sort", "price_asc"],
    ]);
  });

  it("có JS: submit bị chặn (không tải lại trang) và gọi onSubmit đúng một lần", async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    await userEvent.setup().type(screen.getByLabelText("Từ khoá"), "abc{Enter}");
    expect(screen.getByLabelText("Từ khoá")).toHaveValue("abc");
    expect(onSubmit).toHaveBeenCalledTimes(1);
    // fireEvent trả false khi handler đã preventDefault.
    expect(fireEvent.submit(screen.getByRole("search"))).toBe(false);
  });

  it("huy hiệu số lọc: ẩn khi 0, hiện số và đưa vào tên truy cập khi > 0", () => {
    const { rerender } = render(<Harness count={0} />);
    expect(screen.queryByTestId("filters-count")).toBeNull();
    expect(screen.getByRole("button", { name: "Bộ lọc" })).toBeInTheDocument();
    rerender(<Harness count={3} />);
    expect(screen.getByTestId("filters-count")).toHaveTextContent("3");
    expect(screen.getByRole("button", { name: "Bộ lọc (3)" })).toBeInTheDocument();
  });
});
