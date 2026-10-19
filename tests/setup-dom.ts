import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest không bật globals nên RTL không tự dọn DOM giữa các test.
afterEach(cleanup);

// jsdom không có ResizeObserver (Radix Checkbox trong form lead dùng): stub rỗng cho mọi test UI; test nào cần hành vi thật tự stub lại.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom thiếu các API con trỏ/cuộn mà Radix Select gọi khi mở danh sách.
const elementProto = Element.prototype as unknown as Record<string, unknown>;
elementProto.hasPointerCapture ??= () => false;
elementProto.setPointerCapture ??= () => {};
elementProto.releasePointerCapture ??= () => {};
elementProto.scrollIntoView ??= () => {};
