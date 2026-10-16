import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Gallery } from "./Gallery";
import { Lightbox } from "./Lightbox";
import { fakeMedia, renderWithIntl } from "./test-utils";

const images = Array.from({ length: 4 }, (_, index) => fakeMedia(`p${index + 1}`));

async function openSecondImage(locale: "vi" | "en" = "vi") {
  const user = userEvent.setup();
  renderWithIntl(
    <>
      <Gallery images={images} />
      <button type="button">Ngoài</button>
    </>,
    locale,
  );
  const opener = screen.getByRole("button", { name: locale === "vi" ? "Phóng to ảnh 2 / 4" : "Enlarge photo 2 of 4" });
  await user.click(opener);
  const dialog = await screen.findByRole("dialog");
  return { user, opener, dialog };
}

describe("Lightbox", () => {
  it("là dialog modal có tên và mô tả, đủ nút có aria-label", async () => {
    const { dialog } = await openSecondImage();
    expect(dialog).toHaveAccessibleName("Xem ảnh");
    expect(dialog).toHaveAccessibleDescription(/phím mũi tên/);
    expect(within(dialog).getByRole("button", { name: "Đóng" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Ảnh trước" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Ảnh sau" })).toBeInTheDocument();
  });

  it("nhãn theo locale en", async () => {
    const { dialog } = await openSecondImage("en");
    expect(dialog).toHaveAccessibleName("Photo viewer");
    expect(within(dialog).getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(within(dialog).getByText("Photo 2 of 4")).toBeInTheDocument();
  });

  it("phím ← → chuyển ảnh và vòng lại ở hai đầu", async () => {
    const { user, dialog } = await openSecondImage();
    expect(within(dialog).getByText("Ảnh 2 / 4")).toBeInTheDocument();
    await user.keyboard("{ArrowRight}");
    expect(within(dialog).getByText("Ảnh 3 / 4")).toBeInTheDocument();
    expect(within(dialog).getByText("Ảnh p3")).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(within(dialog).getByText("Ảnh 1 / 4")).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}");
    expect(within(dialog).getByText("Ảnh 4 / 4")).toBeInTheDocument();
  });

  it("nút Trước/Sau cũng chuyển ảnh", async () => {
    const { user, dialog } = await openSecondImage();
    await user.click(within(dialog).getByRole("button", { name: "Ảnh sau" }));
    expect(within(dialog).getByText("Ảnh 3 / 4")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Ảnh trước" }));
    expect(within(dialog).getByText("Ảnh 2 / 4")).toBeInTheDocument();
  });

  it("Esc đóng và trả focus về ảnh đã mở", async () => {
    const { user, opener } = await openSecondImage();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("nút Đóng đóng lightbox và trả focus", async () => {
    const { user, opener, dialog } = await openSecondImage();
    await user.click(within(dialog).getByRole("button", { name: "Đóng" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("bẫy focus: Tab không thoát ra ngoài dialog", async () => {
    const { user, dialog } = await openSecondImage();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    for (let press = 0; press < 6; press += 1) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
    await user.tab({ shift: true });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("vuốt ngang đổi ảnh", async () => {
    const { user, dialog } = await openSecondImage();
    const stage = dialog.querySelector(".touch-pan-y");
    expect(stage).not.toBeNull();
    await user.pointer([
      { keys: "[MouseLeft>]", target: stage as Element, coords: { clientX: 200 } },
      { coords: { clientX: 80 } },
      { keys: "[/MouseLeft]" },
    ]);
    expect(within(dialog).getByText("Ảnh 3 / 4")).toBeInTheDocument();
  });

  it("không truyền returnFocusRef: trả focus về phần tử đang focus trước khi mở", async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Mở
          </button>
          <Lightbox images={images} open={open} index={0} onOpenChange={setOpen} onIndexChange={() => {}} />
        </>
      );
    }
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    const opener = screen.getByRole("button", { name: "Mở" });
    await user.click(opener);
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
