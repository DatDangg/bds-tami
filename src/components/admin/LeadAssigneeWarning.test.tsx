import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const field = vi.hoisted(() => ({ value: undefined as unknown }));

vi.mock("@payloadcms/ui", () => ({ useField: () => ({ value: field.value }) }));

import { LeadAssigneeWarning } from "./LeadAssigneeWarning";

describe("LeadAssigneeWarning", () => {
  it("sale phụ trách đã khoá -> cảnh báo giao lại", () => {
    field.value = true;
    render(<LeadAssigneeWarning path="assigneeInactive" />);
    expect(screen.getByRole("alert").textContent).toContain("đã bị khoá");
  });

  it.each([false, null, undefined])("giá trị %s -> không hiện gì", (value) => {
    field.value = value;
    const { container } = render(<LeadAssigneeWarning path="assigneeInactive" />);
    expect(container.textContent).toBe("");
  });
});
