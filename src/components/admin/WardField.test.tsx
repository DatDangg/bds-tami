import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Barrel @payloadcms/ui kéo .css không nạp được trong vitest → mock; RelationshipInput bắt props để kiểm `style`.
// `@payloadcms/ui/shared` (mergeFieldStyles thật) không kéo .css nên dùng bản thật, không mock.
const relationshipInputProps = vi.hoisted(() => ({ current: undefined as Record<string, unknown> | undefined }));
vi.mock("@payloadcms/ui", () => ({
  RelationshipInput: (props: Record<string, unknown>) => {
    relationshipInputProps.current = props;
    return null;
  },
  useField: () => ({ path: "ward", value: null, initialValue: null, setValue: () => undefined }),
  useFormFields: () => undefined,
}));

import { provincePathOf, shouldResetWard, WardField, wardFilterForProvince } from "./WardField";

const renderWard = (admin?: Record<string, unknown>) => {
  relationshipInputProps.current = undefined as Record<string, unknown> | undefined;
  const props = { field: { name: "ward", type: "relationship", relationTo: "wards", admin }, path: "ward" } as unknown as Parameters<typeof WardField>[0];
  renderToStaticMarkup(<WardField {...props} />);
  return (relationshipInputProps.current as Record<string, unknown> | undefined)?.style;
};

describe("WardField style (BL-130)", () => {
  it("không khai admin.width: ô giãn flex 1 1 auto như ô Tỉnh/thành để chia đều hàng", () => {
    expect(renderWard()).toEqual({ flex: "1 1 auto" });
  });

  it("có admin.width: truyền --field-width cho CSS hàng", () => {
    expect(renderWard({ width: "50%" })).toEqual({ "--field-width": "50%" });
  });
});

describe("WardField helpers", () => {
  it("provincePathOf: ô province cùng cấp, kể cả path lồng", () => {
    expect(provincePathOf("ward")).toBe("province");
    expect(provincePathOf("location.ward")).toBe("location.province");
  });

  it("wardFilterForProvince: lọc theo tỉnh (id thô hoặc đã populate), chưa chọn = không lọc", () => {
    expect(wardFilterForProvince("p1")).toEqual({ wards: { province: { equals: "p1" } } });
    expect(wardFilterForProvince({ id: 5 })).toEqual({ wards: { province: { equals: "5" } } });
    expect(wardFilterForProvince(null)).toBeUndefined();
    expect(wardFilterForProvince(undefined)).toBeUndefined();
  });

  it("shouldResetWard: chỉ khi đổi từ tỉnh A sang tỉnh khác; nạp bản ghi / lần đầu thì giữ", () => {
    expect(shouldResetWard("a", "b")).toBe(true);
    expect(shouldResetWard("a", null)).toBe(true);
    expect(shouldResetWard("a", "a")).toBe(false);
    expect(shouldResetWard(null, "a")).toBe(false);
    expect(shouldResetWard(null, null)).toBe(false);
  });
});
