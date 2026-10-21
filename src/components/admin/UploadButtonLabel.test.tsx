// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UploadButtonLabel } from "./UploadButtonLabel";

const buttonHtml = '<button class="btn upload__createNewToggler"><span>Tạo mới</span></button>';

describe("UploadButtonLabel", () => {
  it("đổi chữ + tên đọc nút upload, không đụng nút 'Tạo mới' khác", async () => {
    document.body.innerHTML = `${buttonHtml}<a class="list-create">Tạo mới</a>`;
    render(<UploadButtonLabel>x</UploadButtonLabel>);
    const toggler = document.querySelector<HTMLElement>(".upload__createNewToggler");
    expect(toggler?.textContent).toBe("Tải lên");
    expect(toggler?.getAttribute("aria-label")).toBe("Tải lên");
    expect(document.querySelector(".list-create")?.textContent).toBe("Tạo mới");
  });

  it("áp cho nút upload xuất hiện sau (drawer/ô mới)", async () => {
    document.body.innerHTML = "";
    render(<UploadButtonLabel>x</UploadButtonLabel>);
    document.body.insertAdjacentHTML("beforeend", buttonHtml);
    await waitFor(() => expect(document.querySelector(".upload__createNewToggler")?.textContent).toBe("Tải lên"));
  });
});
