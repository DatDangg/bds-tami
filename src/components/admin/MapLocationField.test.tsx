// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Barrel @payloadcms/ui kéo .css không nạp được trong vitest → mock; RenderCustomComponent chỉ hiện Fallback.
// `@payloadcms/ui/shared` (mergeFieldStyles thật) không kéo .css nên dùng bản thật.
const fieldState = vi.hoisted(() => ({ value: null as unknown }));
const setValue = vi.hoisted(() => vi.fn());
vi.mock("@payloadcms/ui", () => ({
  FieldDescription: () => null,
  FieldError: () => null,
  FieldLabel: ({ label }: { label: string }) => <span>{label}</span>,
  RenderCustomComponent: ({ Fallback }: { Fallback: React.ReactNode }) => Fallback,
  useField: () => ({ path: "location", value: fieldState.value, setValue, showError: false, customComponents: {} }),
}));

import { googleMapsUrl, MapLocationField, nextPointValue } from "./MapLocationField";

const renderField = (value: unknown, readOnly = false) => {
  fieldState.value = value;
  const props = { field: { name: "location", type: "point", label: "Toạ độ bản đồ" }, path: "location", readOnly } as unknown as Parameters<typeof MapLocationField>[0];
  return render(<MapLocationField {...props} />);
};

beforeEach(() => setValue.mockReset());
afterEach(cleanup);

describe("MapLocationField render", () => {
  it("ô Vĩ độ đứng trước ô Kinh độ; giá trị [lng, lat] hiện đúng ô", () => {
    const { container } = renderField([106.7009, 10.7769]);
    const numberInputs = [...container.querySelectorAll<HTMLInputElement>('input[type="number"]')];
    expect(numberInputs.map((input) => input.name)).toEqual(["location.latitude", "location.longitude"]);
    expect(numberInputs.map((input) => input.value)).toEqual(["10.7769", "106.7009"]);
    expect(screen.getByLabelText("Vĩ độ")).toBe(numberInputs[0]);
    expect(screen.getByLabelText("Kinh độ")).toBe(numberInputs[1]);
  });

  it("chỉ đọc thì không có ô dán và hai ô số bị khoá", () => {
    renderField(null, true);
    expect(screen.queryByLabelText("Dán từ Google Maps")).toBeNull();
    expect((screen.getByLabelText("Vĩ độ") as HTMLInputElement).disabled).toBe(true);
  });

  it("link Xem trên Google Maps chỉ khi đủ hai số, mở tab mới an toàn, vĩ độ trước", () => {
    const empty = renderField(["", 10.7]);
    expect(screen.queryByText("Xem trên Google Maps")).toBeNull();
    empty.unmount();
    renderField([106.7009, 10.7769]);
    const link = screen.getByText("Xem trên Google Maps");
    expect(link.getAttribute("href")).toBe("https://www.google.com/maps?q=10.7769,106.7009");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });
});

describe("MapLocationField dán", () => {
  const pasteBox = () => screen.getByLabelText("Dán từ Google Maps");
  const paste = (text: string) => fireEvent.paste(pasteBox(), { clipboardData: { getData: () => text } });

  it("dán cặp số vĩ độ, kinh độ → setValue [lng, lat]", () => {
    renderField(null);
    paste("10.7769, 106.7009");
    expect(setValue).toHaveBeenCalledWith([106.7009, 10.7769]);
  });

  it("dán link Google Maps có ghim → điền đúng điểm ghim", () => {
    renderField(null);
    paste("https://www.google.com/maps/place/X/@10.77,106.70,17z/data=!3d10.7725!4d106.698");
    expect(setValue).toHaveBeenCalledWith([106.698, 10.7725]);
  });

  it("link rút gọn → thông báo hướng dẫn, không setValue", () => {
    renderField(null);
    paste("https://maps.app.goo.gl/abc123");
    expect(screen.getByRole("status").textContent).toContain("rút gọn");
    expect(setValue).not.toHaveBeenCalled();
  });

  it("chuỗi rác → báo không đọc được; dán ngược → gợi ý đảo; đều không setValue", () => {
    renderField(null);
    paste("xin chào");
    expect(screen.getByRole("status").textContent).toContain("Không đọc được");
    paste("106.7009, 10.7769");
    expect(screen.getByRole("status").textContent).toContain("dán ngược");
    expect(setValue).not.toHaveBeenCalled();
  });

  it("dán xong thì xoá ô dán", () => {
    renderField(null);
    paste("10.7769, 106.7009");
    expect((pasteBox() as HTMLInputElement).value).toBe("");
  });

  it("gõ từng ký tự KHÔNG tự điền và không báo lỗi giữa chừng; Enter mới áp dụng", () => {
    renderField(null);
    let typed = "";
    for (const char of "10.7769, 106.7009") {
      typed += char;
      fireEvent.change(pasteBox(), { target: { value: typed } });
    }
    expect(setValue).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toBe("");
    fireEvent.keyDown(pasteBox(), { key: "Enter" });
    expect(setValue).toHaveBeenCalledTimes(1);
    expect(setValue).toHaveBeenCalledWith([106.7009, 10.7769]);
  });

  it("gõ xong rồi rời ô (blur) cũng áp dụng", () => {
    renderField(null);
    fireEvent.change(pasteBox(), { target: { value: "21.0285, 105.8542" } });
    fireEvent.blur(pasteBox());
    expect(setValue).toHaveBeenCalledWith([105.8542, 21.0285]);
  });
});

describe("MapLocationField sửa tay", () => {
  it("gõ vĩ độ giữ kinh độ, lưu [lng, lat]", () => {
    renderField([106.7, 10.7]);
    fireEvent.change(screen.getByLabelText("Vĩ độ"), { target: { value: "21.03" } });
    expect(setValue).toHaveBeenCalledWith([106.7, 21.03]);
  });

  it("xoá cả hai ô → null", () => {
    renderField([106.7, ""]);
    fireEvent.change(screen.getByLabelText("Kinh độ"), { target: { value: "" } });
    expect(setValue).toHaveBeenCalledWith(null);
  });
});

describe("helpers", () => {
  it("googleMapsUrl: vĩ độ trước kinh độ; thiếu một nửa / chuỗi → null", () => {
    expect(googleMapsUrl([106.7, 10.7])).toBe("https://www.google.com/maps?q=10.7,106.7");
    expect(googleMapsUrl(null)).toBeNull();
    expect(googleMapsUrl(["106", "10"])).toBeNull();
  });

  it("nextPointValue: sửa từng nửa, xoá một nửa để trống, xoá hết → null", () => {
    expect(nextPointValue([106.7, 10.7], 1, "21.03")).toEqual([106.7, 21.03]);
    expect(nextPointValue(null, 0, "105.8")).toEqual([105.8, ""]);
    expect(nextPointValue([106.7, 10.7], 1, "")).toEqual([106.7, ""]);
    expect(nextPointValue([106.7, ""], 0, "")).toBeNull();
  });
});

describe("gõ tay từng ký tự (state thật, như form Payload)", () => {
  function StatefulHarness() {
    const [value, setLocal] = useState<unknown>(null);
    fieldState.value = value;
    setValue.mockImplementation((next: unknown) => setLocal(next));
    const props = { field: { name: "location", type: "point", label: "x" }, path: "location" } as unknown as Parameters<typeof MapLocationField>[0];
    return <MapLocationField {...props} />;
  }
  // Gõ thật: mỗi phím nối thêm vào CHỮ ĐANG HIỆN trong ô (không phải chuỗi tính sẵn), nên React ghi đè ô thì mất số.
  const typeInto = (label: string, text: string) => {
    const input = screen.getByLabelText(label) as HTMLInputElement;
    input.value = "";
    let typed = "";
    for (const char of text) {
      // jsdom báo value "" cho số dở ("106."); khi ô có giá trị thì đó là chữ React đang hiển thị (kể cả khi đã ghi đè).
      typed = (input.value === "" ? typed : input.value) + char;
      fireEvent.change(input, { target: { value: typed } });
    }
    return input;
  };

  it("kinh độ 106.7009 không bị nuốt số 0", () => {
    render(<StatefulHarness />);
    const input = typeInto("Kinh độ", "106.7009");
    expect(input.value).toBe("106.7009");
    expect(setValue).toHaveBeenLastCalledWith([106.7009, ""]);
  });

  it("vĩ độ 10.009 và 10.0234 giữ nguyên các số 0", () => {
    render(<StatefulHarness />);
    expect(typeInto("Vĩ độ", "10.009").value).toBe("10.009");
    expect(typeInto("Vĩ độ", "10.0234").value).toBe("10.0234");
    expect(setValue).toHaveBeenLastCalledWith(["", 10.0234]);
  });
});
