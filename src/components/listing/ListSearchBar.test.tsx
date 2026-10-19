import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ListFiltersButton, ListSearchBar, ListSearchField } from "./ListSearchBar";

function Harness({ onSubmit = () => undefined, count = 0 }: { onSubmit?: () => void; count?: number }) {
  const [value, setValue] = useState("");
  return (
    <ListSearchBar
      action="/cho-thue"
      label="Tìm tin"
      keyword={{ id: "kw", name: "q", label: "Từ khoá", placeholder: "Khu vực", value, onChange: setValue }}
      submitLabel="Tìm kiếm"
      onSubmit={onSubmit}
      preservedParams={{ province: "ha-noi", sort: "price_asc", ward: "" }}
      filtersSlot={<ListFiltersButton label="Bộ lọc" count={count} />}
    >
      <ListSearchField label="Loại" htmlFor="cat">
        <select id="cat" name="category">
          <option value="">Tất cả</option>
        </select>
      </ListSearchField>
    </ListSearchBar>
  );
}

describe("ListSearchBar không có ô từ khoá (trang không tìm theo chữ)", () => {
  it("chỉ còn ô chọn + nút gửi; vẫn là form GET giữ tham số ẩn", () => {
    const { container } = render(
      <ListSearchBar action="/du-an" label="Lọc dự án" submitLabel="Lọc" onSubmit={() => undefined} preservedParams={{ category: "can-ho" }}>
        <ListSearchField label="Tỉnh" htmlFor="p">
          <select id="p" name="province" />
        </ListSearchField>
      </ListSearchBar>,
    );
    const form = screen.getByRole("search", { name: "Lọc dự án" });
    expect(form).toHaveAttribute("method", "get");
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(container.querySelector("input[type=hidden][name=category]")).toHaveValue("can-ho");
    expect(screen.getByRole("button", { name: "Lọc" })).toHaveAttribute("type", "submit");
  });
});

describe("ListSearchBar", () => {
  it("render: vùng tìm kiếm, từ khoá có nhãn, ô chọn, nút Bộ lọc và Tìm kiếm", () => {
    render(<Harness />);
    const form = screen.getByRole("search", { name: "Tìm tin" });
    expect(within(form).getByLabelText("Từ khoá")).toHaveAttribute("type", "search");
    expect(within(form).getByLabelText("Loại")).toBeInTheDocument();
    expect(within(form).getByRole("button", { name: "Bộ lọc" })).toHaveAttribute("type", "button");
    expect(within(form).getByRole("button", { name: "Tìm kiếm" })).toHaveAttribute("type", "submit");
  });

  it("là form GET thật: action = trang, ô có name; tham số khác được giữ bằng input ẩn (giá trị rỗng bị bỏ)", () => {
    render(<Harness />);
    const form = screen.getByRole("search");
    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/cho-thue");
    expect(screen.getByLabelText("Từ khoá")).toHaveAttribute("name", "q");
    const hidden = Array.from(form.querySelectorAll("input[type=hidden]")).map((input) => [input.getAttribute("name"), input.getAttribute("value")]);
    expect(hidden).toEqual([
      ["province", "ha-noi"],
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

  it("huy hiệu số lọc phụ: ẩn khi 0, hiện số và đưa vào tên truy cập khi > 0", () => {
    const { rerender } = render(<Harness count={0} />);
    expect(screen.queryByTestId("filters-count")).toBeNull();
    expect(screen.getByRole("button", { name: "Bộ lọc" })).toBeInTheDocument();
    rerender(<Harness count={3} />);
    expect(screen.getByTestId("filters-count")).toHaveTextContent("3");
    expect(screen.getByRole("button", { name: "Bộ lọc (3)" })).toBeInTheDocument();
  });
});
