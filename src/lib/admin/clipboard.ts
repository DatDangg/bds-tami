/** Chép chữ vào clipboard: Clipboard API, thiếu/bị chặn thì dùng `execCommand("copy")`. Trả về false khi cả hai đều không được (nơi gọi chọn sẵn chữ cho người dùng tự chép). */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Bị chặn quyền hoặc trang không an toàn: thử đường dự phòng bên dưới.
  }
  return copyViaSelection(text);
}

function copyViaSelection(text: string): boolean {
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}
