import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

function Example() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Mở</Button>
      </DialogTrigger>
      <DialogContent closeLabel="Đóng">
        <DialogTitle>Tiêu đề</DialogTitle>
        <DialogDescription>Mô tả</DialogDescription>
        <input aria-label="Ô thứ nhất" />
        <button type="button">Nút trong dialog</button>
      </DialogContent>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("mở ra, đưa focus vào trong và bẫy Tab trong dialog", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Example />
        <button type="button">Ngoài dialog</button>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Mở" }));
    const dialog = await screen.findByRole("dialog", { name: "Tiêu đề" });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    // Tab nhiều lần: focus phải luôn nằm trong dialog (không rơi ra nút bên ngoài).
    for (let i = 0; i < 6; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it("Esc đóng và trả focus về nút mở", async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Mở" });
    await user.click(trigger);
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("nút đóng có aria-label do nơi dùng truyền vào", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Mở" }));
    await user.click(await screen.findByRole("button", { name: "Đóng" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
