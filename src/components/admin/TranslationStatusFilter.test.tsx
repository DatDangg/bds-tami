import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  where: undefined as unknown,
  refineListData: vi.fn(),
}));

// SelectInput thật không nạp được trong vitest (barrel @payloadcms/ui kéo file .css của node_modules) → mock bằng <select> gốc, onChange dạng option như react-select.
// Tên "Trạng thái dịch" của combobox đến từ <label> bọc của component (mock không tự gắn label).
vi.mock("@payloadcms/ui", () => ({
  useListQuery: () => ({ query: { where: state.where }, refineListData: state.refineListData }),
  SelectInput: ({ options, value, onChange }: { options: { label: string; value: string }[]; value: string; onChange: (o: unknown) => void }) => (
    <div>
      <select value={value} onChange={(e) => onChange(options.find((o) => o.value === e.target.value) ?? null)}>
        <option value="">-</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button type="button" onClick={() => onChange(null)}>
        clear
      </button>
    </div>
  ),
}));

import { TRANSLATION_FILTER_KEYS, withTranslationFilter } from "@/lib/translation/admin-ui";

import { TranslationStatusFilter, translationFilterFromSelection } from "./TranslationStatusFilter";

describe("translationFilterFromSelection", () => {
  it("map option/null/khoá lạ về khoá lọc hoặc rỗng", () => {
    const key = TRANSLATION_FILTER_KEYS[0]!;
    expect(translationFilterFromSelection({ label: "x", value: key })).toBe(key);
    expect(translationFilterFromSelection([{ label: "x", value: key }])).toBe(key);
    expect(translationFilterFromSelection({ label: "Tất cả", value: "" })).toBe("");
    expect(translationFilterFromSelection({ label: "?", value: "bogus" })).toBe("");
    expect(translationFilterFromSelection(null)).toBe("");
  });
});

describe("TranslationStatusFilter", () => {
  it("chọn một trạng thái: giữ where khác, về trang 1", () => {
    const key = TRANSLATION_FILTER_KEYS[0]!;
    state.where = { title: { like: "abc" } };
    state.refineListData.mockClear();
    render(<TranslationStatusFilter />);
    fireEvent.change(screen.getByRole("combobox", { name: /Trạng thái dịch/ }), { target: { value: key } });
    expect(state.refineListData).toHaveBeenCalledWith({ where: withTranslationFilter({ title: { like: "abc" } }, key), page: 1 });
  });

  it("xoá lọc: bỏ điều kiện dịch, giữ điều kiện khác", () => {
    const key = TRANSLATION_FILTER_KEYS[0]!;
    state.where = withTranslationFilter({ title: { like: "abc" } }, key);
    state.refineListData.mockClear();
    render(<TranslationStatusFilter />);
    fireEvent.click(screen.getByText("clear"));
    expect(state.refineListData).toHaveBeenCalledWith({ where: withTranslationFilter(state.where as never, ""), page: 1 });
  });
});
