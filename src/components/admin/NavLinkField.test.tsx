import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ value: "" as string | null, setValue: vi.fn() }));

// SelectInput thật không nạp được trong vitest (barrel @payloadcms/ui kéo .css) → mock bằng <select> gốc, onChange dạng option như react-select.
vi.mock("@payloadcms/ui", () => ({
  useField: () => ({ value: state.value, setValue: state.setValue, showError: false }),
  FieldError: () => null,
  SelectInput: ({ options, value, onChange, isClearable }: { options: { label: string; value: string }[]; value: string; onChange: (o: unknown) => void; isClearable?: boolean }) => (
    <div>
      <select value={value} onChange={(e) => onChange(options.find((o) => o.value === e.target.value) ?? null)}>
        <option value="">-</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {isClearable ? (
        <button type="button" onClick={() => onChange(null)}>
          clear
        </button>
      ) : null}
    </div>
  ),
}));

import { NavLinkField, navLinkChoice, navLinkChoiceFromSelection } from "./NavLinkField";

function renderField(required = false) {
  const field = { name: "link", type: "text", label: "Liên kết", required, admin: { description: "mô tả" } };
  return render(<NavLinkField field={field as never} path="header.link" />);
}

beforeEach(() => {
  state.value = "";
  state.setValue.mockClear();
});

describe("navLinkChoice / navLinkChoiceFromSelection", () => {
  it("map giá trị lưu về lựa chọn hiển thị", () => {
    expect(navLinkChoice("rentals")).toBe("rentals");
    expect(navLinkChoice("https://example.com/a")).toBe("__other__");
    expect(navLinkChoice("khoa-la")).toBe("__other__");
    expect(navLinkChoice("")).toBe("");
    expect(navLinkChoice(null)).toBe("");
  });

  it("map option/null/mã lạ về lựa chọn hoặc rỗng", () => {
    expect(navLinkChoiceFromSelection({ label: "x", value: "news" })).toBe("news");
    expect(navLinkChoiceFromSelection([{ label: "x", value: "__other__" }])).toBe("__other__");
    expect(navLinkChoiceFromSelection({ label: "?", value: "bogus" })).toBe("");
    expect(navLinkChoiceFromSelection(null)).toBe("");
  });
});

describe("NavLinkField", () => {
  it("liệt kê trang theo tên tiếng Việt kèm 'Địa chỉ khác'", () => {
    renderField();
    expect(screen.getByRole("option", { name: "Cho thuê" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Điều khoản sử dụng" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Địa chỉ khác (https://…)" })).toBeInTheDocument();
  });

  it("chọn trang: ghi mã trang, không hiện ô URL", () => {
    renderField();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "projects" } });
    expect(state.setValue).toHaveBeenCalledWith("projects");
    expect(screen.queryByPlaceholderText("https://")).not.toBeInTheDocument();
  });

  it("giá trị cũ là mã trang: hiển thị đúng trang", () => {
    state.value = "careers";
    renderField();
    expect(screen.getByRole("combobox")).toHaveValue("careers");
    expect(screen.queryByPlaceholderText("https://")).not.toBeInTheDocument();
  });

  it("giá trị cũ là URL: chọn 'Địa chỉ khác' và hiện URL trong ô nhập", () => {
    state.value = "https://example.com/x";
    renderField();
    expect(screen.getByRole("combobox")).toHaveValue("__other__");
    expect(screen.getByPlaceholderText("https://")).toHaveValue("https://example.com/x");
  });

  it("chọn 'Địa chỉ khác' từ mã trang: mở ô nhập trống rồi ghi URL gõ vào", () => {
    state.value = "news";
    renderField();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "__other__" } });
    expect(state.setValue).toHaveBeenCalledWith("");
    const input = screen.getByPlaceholderText("https://");
    fireEvent.change(input, { target: { value: "https://abc.vn" } });
    expect(state.setValue).toHaveBeenLastCalledWith("https://abc.vn");
  });

  it("ô không bắt buộc: xoá về trống; ô bắt buộc: không có nút xoá", () => {
    state.value = "contact";
    const { unmount } = renderField(false);
    fireEvent.click(screen.getByText("clear"));
    expect(state.setValue).toHaveBeenCalledWith("");
    unmount();
    renderField(true);
    expect(screen.queryByText("clear")).not.toBeInTheDocument();
  });
});
