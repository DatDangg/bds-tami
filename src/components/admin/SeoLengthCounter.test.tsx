import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const field = vi.hoisted(() => ({ value: undefined as unknown, setValue: vi.fn() }));
vi.mock("@payloadcms/ui", () => ({ useField: () => ({ value: field.value, setValue: field.setValue }) }));

import { SeoDescriptionCounter, SeoTitleCounter } from "./SeoLengthCounter";

describe("SeoTitleCounter", () => {
  it("đếm ký tự kèm gợi ý ≤ 60, vượt thì đánh dấu", () => {
    field.value = "a".repeat(58);
    const ok = render(<SeoTitleCounter path="seo.metaTitle" />);
    expect(screen.getByText("58 ký tự · nên ≤ 60")).toBeInTheDocument();
    expect(ok.container.querySelector(".tami-field-hint--warn")).toBeNull();
    ok.unmount();

    field.value = "a".repeat(61);
    const over = render(<SeoTitleCounter path="seo.metaTitle" />);
    expect(screen.getByText("61 ký tự · nên ≤ 60 (hơi dài)")).toBeInTheDocument();
    expect(over.container.querySelector(".tami-field-hint--warn")).not.toBeNull();
  });
});

describe("SeoDescriptionCounter", () => {
  it("gợi ý 120–160, ngoài khoảng thì đánh dấu, trống thì không cảnh báo", () => {
    field.value = undefined;
    const empty = render(<SeoDescriptionCounter path="seo.metaDescription" />);
    expect(empty.container.querySelector(".tami-field-hint--warn")).toBeNull();
    empty.unmount();

    field.value = "a".repeat(140);
    const ok = render(<SeoDescriptionCounter path="seo.metaDescription" />);
    expect(ok.container.querySelector(".tami-field-hint--warn")).toBeNull();
    ok.unmount();

    field.value = "a".repeat(60);
    const short = render(<SeoDescriptionCounter path="seo.metaDescription" />);
    expect(short.container.querySelector(".tami-field-hint--warn")).not.toBeNull();
  });
});
