import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "../media/test-utils";
import { FormField } from "./FormField";

describe("FormField", () => {
  it("label thật gắn với ô, dấu * có chữ ẩn, không cần placeholder", () => {
    renderWithIntl(<FormField name="fullName" label="Họ tên" required requiredLabel="bắt buộc" />);
    const input = screen.getByLabelText(/Họ tên/);
    expect(input).toHaveAttribute("aria-required", "true");
    expect(input).not.toHaveAttribute("placeholder");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(screen.getByText(/\(bắt buộc\)/)).toHaveClass("sr-only");
  });

  it("helper và lỗi cùng nằm trong aria-describedby, có lỗi thì aria-invalid", () => {
    renderWithIntl(<FormField name="phone" label="Số điện thoại" helper="Ví dụ 0901234567" error="Số điện thoại chưa hợp lệ." />);
    const input = screen.getByLabelText("Số điện thoại");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const describedBy = input.getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(describedBy).toHaveLength(2);
    expect(document.getElementById(describedBy[0] ?? "")).toHaveTextContent("Ví dụ 0901234567");
    expect(document.getElementById(describedBy[1] ?? "")).toHaveTextContent("Số điện thoại chưa hợp lệ.");
  });

  it("hỗ trợ textarea, select và file với cùng cơ chế label/lỗi", () => {
    renderWithIntl(
      <>
        <FormField as="textarea" name="message" label="Lời nhắn" error="Quá dài." />
        <FormField as="select" name="source" label="Nguồn" options={[{ value: "a", label: "Mục A" }]} />
        <FormField as="file" name="cv" label="CV" accept=".pdf,.doc,.docx" error="Tệp quá lớn." />
      </>,
    );
    expect(screen.getByLabelText("Lời nhắn").tagName).toBe("TEXTAREA");
    expect(screen.getByLabelText("Lời nhắn")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Nguồn").tagName).toBe("SELECT");
    const file = screen.getByLabelText("CV");
    expect(file).toHaveAttribute("type", "file");
    expect(file).toHaveAttribute("accept", ".pdf,.doc,.docx");
    expect(file).toHaveAttribute("aria-invalid", "true");
  });
});
