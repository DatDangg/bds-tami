import { ValidationError } from "payload";
import { describe, expect, it } from "vitest";

import { createViValidationError } from "./vi-validation-error";

describe("createViValidationError", () => {
  it("toast là lý do tiếng Việt, không có tiền tố tiếng Anh hay path đứng một mình", () => {
    const error = createViValidationError({
      collection: "staff",
      errors: [{ path: "password", message: "Mật khẩu tối thiểu 10 ký tự." }],
    });
    expect(error.message).toBe("Mật khẩu tối thiểu 10 ký tự.");
    expect(error.message).not.toContain("The following field");
  });

  it("vẫn là ValidationError, giữ data.errors và status 400", () => {
    const error = createViValidationError({ collection: "staff", errors: [{ path: "password", message: "x" }] });
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.status).toBe(400);
    expect(error.data.errors).toEqual([{ path: "password", message: "x" }]);
  });

  it("gộp nhiều trường cùng lý do thành một câu kèm danh sách trường", () => {
    const error = createViValidationError({
      collection: "posts",
      errors: [
        { path: "title", message: "Cần nhập bản tiếng Anh." },
        { path: "content", message: "Cần nhập bản tiếng Anh." },
      ],
    });
    expect(error.message).toBe("Cần nhập bản tiếng Anh. (title, content)");
  });

  it("nhiều lý do khác nhau nối lại", () => {
    const error = createViValidationError({
      collection: "c",
      errors: [
        { path: "a", message: "Lỗi A." },
        { path: "b", message: "Lỗi B." },
      ],
    });
    expect(error.message).toBe("Lỗi A. Lỗi B.");
  });

  it("errors rỗng -> message tiếng Việt mặc định", () => {
    expect(createViValidationError({ collection: "c", errors: [] }).message).toBe("Dữ liệu không hợp lệ.");
  });
});
