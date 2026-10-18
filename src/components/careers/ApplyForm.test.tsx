import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeUploadXhr } from "@/components/forms/test-utils";
import { renderWithIntl } from "@/components/media/test-utils";
import { ApplyForm } from "./ApplyForm";

// Widget Turnstile có test riêng (tải script ngoài, không chạy trong jsdom): ở đây giả lập widget đã xác minh xong ngay.
vi.mock("@/components/forms/TurnstileWidget", async () => {
  const { useEffect } = await import("react");
  return {
    TurnstileWidget: ({ onToken }: { onToken: (token: string | null) => void }) => {
      useEffect(() => onToken("tok-1"), [onToken]);
      return null;
    },
  };
});

const JOB_ID = "0b6f0a8e-6a4b-4a3e-9d59-3f8f0f5e2c11";
const HOTLINE = { label: "0901 234 567", telHref: "tel:0901234567" };
const DROP_HINT = "Kéo thả CV vào đây hoặc";

function renderForm(locale: "vi" | "en" = "vi") {
  return renderWithIntl(<ApplyForm jobPostingId={JOB_ID} listPath="/tuyen-dung" turnstileSiteKey="site" hotline={HOTLINE} />, locale);
}

/** Form gửi bằng XMLHttpRequest (có tiến trình upload); `fetch` bị chặn để chắc chắn không còn đường gửi nào khác. */
function stubUpload(status: number, body: unknown, headers: Record<string, string> = {}) {
  vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("fetch không được dùng cho form ứng tuyển"))));
  return FakeUploadXhr.install({ status, body, headers });
}

/** Không trả lời tự động: test tự điều khiển progress/respond/fail. */
function stubUploadManual() {
  vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("fetch không được dùng cho form ứng tuyển"))));
  return FakeUploadXhr.install();
}

const pdf = (name = "cv.pdf", bytes = 1024) => new File([new Uint8Array(bytes)], name, { type: "application/pdf" });

function dropZone() {
  const zone = screen.getByText(DROP_HINT).parentElement;
  if (!zone) throw new Error("Không thấy vùng kéo-thả");
  return zone;
}

function dropFile(file: File) {
  fireEvent.dragOver(dropZone(), { dataTransfer: { files: [file], types: ["Files"] } });
  fireEvent.drop(dropZone(), { dataTransfer: { files: [file], types: ["Files"] } });
}

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
});

async function fillText(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Họ và tên/), "Nguyễn Văn A");
  await user.type(screen.getByLabelText(/Số điện thoại/), "0901234567");
  await user.type(screen.getByLabelText(/Email/), "a@example.com");
}

async function fillAll(user: ReturnType<typeof userEvent.setup>, file: File = pdf()) {
  await fillText(user);
  await user.upload(screen.getByLabelText(/CV/), file);
  await user.click(screen.getByRole("checkbox"));
}

describe("ApplyForm: chọn file CV", () => {
  it("file 6MB bị chặn ở client: hiện lỗi tại ô CV, không gọi API, không giữ file", async () => {
    const Xhr = stubUpload(200, { success: true, data: { received: true } });
    const user = userEvent.setup();
    renderForm();
    await user.upload(screen.getByLabelText(/CV/), pdf("big.pdf", 6 * 1024 * 1024));
    expect(screen.getByLabelText(/CV/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("CV tối đa 5MB, vui lòng chọn tệp nhỏ hơn.")).toBeInTheDocument();
    expect(screen.queryByText("big.pdf")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Ứng tuyển" }));
    expect(Xhr.sent).not.toHaveBeenCalled();
  });

  it("đuôi file không phải pdf/doc/docx bị chặn", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderForm();
    await user.upload(screen.getByLabelText(/CV/), new File(["x"], "cv.exe", { type: "application/octet-stream" }));
    expect(screen.getByText("CV chỉ nhận định dạng PDF, DOC hoặc DOCX.")).toBeInTheDocument();
    expect(screen.getByLabelText(/CV/)).toHaveAttribute("aria-invalid", "true");
  });

  it("file hợp lệ hiện tên + dung lượng và nút xoá; xoá thì mất tên", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.upload(screen.getByLabelText(/CV/), pdf("cv-an.pdf", 2048));
    expect(screen.getByText("cv-an.pdf")).toBeInTheDocument();
    expect(screen.getByText("2 KB")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Xoá tệp cv-an.pdf" }));
    expect(screen.queryByText("cv-an.pdf")).toBeNull();
  });

  it("huỷ hộp chọn file thì xoá lỗi loại/cỡ cũ", async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByLabelText(/CV/);
    await user.upload(input, pdf("big.pdf", 6 * 1024 * 1024));
    expect(screen.getByText("CV tối đa 5MB, vui lòng chọn tệp nhỏ hơn.")).toBeInTheDocument();
    fireEvent.change(input, { target: { files: [] } });
    expect(screen.queryByText("CV tối đa 5MB, vui lòng chọn tệp nhỏ hơn.")).toBeNull();
    expect(input).not.toHaveAttribute("aria-invalid", "true");
  });

  it("thiếu CV: lỗi tại ô CV, không gọi API", async () => {
    const Xhr = stubUpload(200, { success: true, data: {} });
    const user = userEvent.setup();
    renderForm();
    await fillText(user);
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Ứng tuyển" }));
    expect(Xhr.sent).not.toHaveBeenCalled();
    expect(screen.getByText("Vui lòng đính kèm CV.")).toBeInTheDocument();
    // Focus ô lỗi đầu tiên phải rơi vào nút Chọn tệp (nhìn thấy được), không phải input file sr-only (WCAG 2.4.7).
    const chooseFile = screen.getByRole("button", { name: "Chọn tệp" });
    expect(chooseFile).toHaveAttribute("aria-invalid", "true");
    await waitFor(() => expect(chooseFile).toHaveFocus());
    expect(chooseFile).toHaveAccessibleDescription(/Vui lòng đính kèm CV\./);
  });

  it("CV hợp lệ thì nút Chọn tệp không mang aria-invalid", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.upload(screen.getByLabelText(/CV/), pdf());
    expect(screen.getByRole("button", { name: "Chọn tệp" })).not.toHaveAttribute("aria-invalid");
  });

  it("nút Chọn tệp mở hộp chọn của input CV (input có label CV, không nằm trong tab order)", async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByLabelText(/CV/);
    expect(input).toHaveAttribute("type", "file");
    expect(input).toHaveAttribute("accept", ".pdf,.doc,.docx");
    expect(input).toHaveAttribute("tabindex", "-1");
    const click = vi.spyOn(input, "click");
    await user.click(screen.getByRole("button", { name: "Chọn tệp" }));
    expect(click).toHaveBeenCalledTimes(1);
  });
});

describe("ApplyForm: kéo-thả CV", () => {
  it("thả file hợp lệ: nhận file, hiện tên + dung lượng, bỏ trạng thái highlight", () => {
    renderForm();
    const zone = dropZone();
    fireEvent.dragOver(zone, { dataTransfer: { files: [], types: ["Files"] } });
    expect(zone).toHaveAttribute("data-dragging", "true");
    dropFile(pdf("cv-tha.pdf", 3072));
    expect(zone).not.toHaveAttribute("data-dragging");
    expect(screen.getByText("cv-tha.pdf")).toBeInTheDocument();
    expect(screen.getByText("3 KB")).toBeInTheDocument();
    expect(screen.getByLabelText(/CV/)).not.toHaveAttribute("aria-invalid", "true");
  });

  it("thả file sai đuôi: lỗi định dạng tại ô CV, không giữ file", () => {
    renderForm();
    dropFile(new File(["x"], "cv.exe", { type: "application/octet-stream" }));
    expect(screen.getByText("CV chỉ nhận định dạng PDF, DOC hoặc DOCX.")).toBeInTheDocument();
    expect(screen.getByLabelText(/CV/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText("cv.exe")).toBeNull();
  });

  it("thả file quá 5MB: lỗi dung lượng tại ô CV, không giữ file", () => {
    renderForm();
    dropFile(pdf("big.pdf", 6 * 1024 * 1024));
    expect(screen.getByText("CV tối đa 5MB, vui lòng chọn tệp nhỏ hơn.")).toBeInTheDocument();
    expect(screen.queryByText("big.pdf")).toBeNull();
  });

  it("thả file hợp lệ sau khi đã chọn file sai: xoá lỗi cũ, thay file", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderForm();
    await user.upload(screen.getByLabelText(/CV/), new File(["x"], "cv.exe", { type: "application/octet-stream" }));
    expect(screen.getByText("CV chỉ nhận định dạng PDF, DOC hoặc DOCX.")).toBeInTheDocument();
    dropFile(pdf("cv-moi.pdf"));
    expect(screen.queryByText("CV chỉ nhận định dạng PDF, DOC hoặc DOCX.")).toBeNull();
    expect(screen.getByText("cv-moi.pdf")).toBeInTheDocument();
  });

  it("đang gửi thì không nhận file thả", async () => {
    stubUploadManual();
    const user = userEvent.setup();
    renderForm();
    await fillAll(user, pdf("cv-an.pdf"));
    await user.click(screen.getByRole("button", { name: "Ứng tuyển" }));
    dropFile(pdf("khac.pdf"));
    expect(screen.queryByText("khac.pdf")).toBeNull();
    expect(screen.getByText("cv-an.pdf")).toBeInTheDocument();
  });

  it("submit gửi đúng file đã thả (không qua input.files)", async () => {
    const Xhr = stubUpload(200, { success: true, data: { received: true } });
    const user = userEvent.setup();
    renderForm();
    await fillText(user);
    dropFile(pdf("cv-tha.pdf"));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Ứng tuyển" }));
    await screen.findByRole("status");
    const [, body] = Xhr.sent.mock.calls[0]!;
    expect((body.get("cv") as File).name).toBe("cv-tha.pdf");
  });
});

describe("ApplyForm: tiến trình upload", () => {
  it("nút hiện % theo upload.onprogress; progressbar nằm ngoài nút, dải tô trong nút aria-hidden; 100% về 'Đang gửi…' rồi 200 → thành công", async () => {
    const Xhr = stubUploadManual();
    const user = userEvent.setup();
    renderForm();
    await fillAll(user);
    const submit = screen.getByRole("button", { name: "Ứng tuyển" });
    await user.click(submit);
    expect(submit).toBeDisabled();
    expect(submit).toHaveTextContent("Đang gửi…");
    expect(screen.queryByRole("progressbar")).toBeNull();

    Xhr.last.progress(420, 1000);
    expect(submit).toHaveTextContent("Đang gửi… 42%");
    // Con của <button> là presentational (ARIA): progressbar phải đứng ngoài nút để AT đọc được.
    const bar = screen.getByRole("progressbar", { name: "Tiến trình tải CV" });
    expect(submit).not.toContainElement(bar);
    expect(bar).toHaveAttribute("aria-valuenow", "42");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    const fill = submit.querySelector('[aria-hidden="true"]');
    expect(fill).toHaveStyle({ width: "42%" });

    Xhr.last.progress(1000, 1000);
    // Upload xong nhưng server còn xử lý: nhãn về "Đang gửi…" thay vì đứng ở 100%.
    expect(submit).toHaveTextContent("Đang gửi…");
    expect(submit).not.toHaveTextContent("%");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    Xhr.last.respond(200, { success: true, data: { received: true } });
    expect(await screen.findByRole("status")).toHaveTextContent("TAMI đã nhận hồ sơ của anh/chị.");
  });

  it("bản /en: nhãn Sending… {percent}%", async () => {
    const Xhr = stubUploadManual();
    const user = userEvent.setup();
    renderForm("en");
    await user.type(screen.getByLabelText(/Full name/), "An Nguyen");
    await user.type(screen.getByLabelText(/Phone/), "0901234567");
    await user.type(screen.getByLabelText(/Email/), "a@example.com");
    await user.upload(screen.getByLabelText(/CV/), pdf());
    await user.click(screen.getByRole("checkbox"));
    const submit = screen.getByRole("button", { name: "Apply" });
    await user.click(submit);
    Xhr.last.progress(7, 10);
    expect(submit).toHaveTextContent("Sending… 70%");
    expect(screen.getByRole("progressbar", { name: "CV upload progress" })).toBeInTheDocument();
  });

  it("lỗi HTTP sau khi có %: về nút Ứng tuyển, % biến mất, thông báo lỗi như cũ", async () => {
    const Xhr = stubUploadManual();
    const user = userEvent.setup();
    renderForm();
    await fillAll(user);
    await user.click(screen.getByRole("button", { name: "Ứng tuyển" }));
    Xhr.last.progress(900, 1000);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    Xhr.last.respond(503, { success: false, error: "x" });
    expect(await screen.findByRole("alert")).toHaveTextContent("Hệ thống tạm thời không khả dụng");
    const submit = screen.getByRole("button", { name: "Ứng tuyển" });
    expect(submit).toBeEnabled();
    expect(submit).not.toHaveTextContent("%");
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("lỗi mạng giữa chừng: thông báo mạng + Thử lại, % biến mất", async () => {
    const Xhr = stubUploadManual();
    const user = userEvent.setup();
    renderForm();
    await fillAll(user);
    await user.click(screen.getByRole("button", { name: "Ứng tuyển" }));
    Xhr.last.progress(100, 1000);
    Xhr.last.fail();
    expect(await screen.findByRole("alert")).toHaveTextContent("kiểm tra kết nối mạng");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});

describe("ApplyForm: gửi hồ sơ", () => {
  it("thành công hiện role=status, gửi multipart có jobPostingId, cv, locale", async () => {
    const Xhr = stubUpload(200, { success: true, data: { received: true } });
    const user = userEvent.setup();
    renderForm();
    await fillAll(user, pdf("cv-an.pdf"));
    await user.click(screen.getByRole("button", { name: "Ứng tuyển" }));
    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("TAMI đã nhận hồ sơ của anh/chị.");
    const [url, body] = Xhr.sent.mock.calls[0]!;
    expect(url).toBe("/api/public/job-applications");
    expect(body.get("jobPostingId")).toBe(JOB_ID);
    expect(body.get("locale")).toBe("vi");
    expect(body.get("fullName")).toBe("Nguyễn Văn A");
    expect(body.get("consent")).toBe("true");
    expect(body.get("turnstileToken")).toBe("tok-1");
    expect((body.get("cv") as File).name).toBe("cv-an.pdf");
  });

  it("bản /en gửi locale=en và báo thành công bằng tiếng Anh", async () => {
    const Xhr = stubUpload(200, { success: true, data: { received: true } });
    const user = userEvent.setup();
    renderForm("en");
    await user.type(screen.getByLabelText(/Full name/), "An Nguyen");
    await user.type(screen.getByLabelText(/Phone/), "0901234567");
    await user.type(screen.getByLabelText(/Email/), "a@example.com");
    await user.upload(screen.getByLabelText(/CV/), pdf());
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(await screen.findByRole("status")).toHaveTextContent("We have received your application.");
    expect(Xhr.sent.mock.calls[0]![1].get("locale")).toBe("en");
  });

  it("400 theo field gắn vào đúng ô, giữ dữ liệu đã nhập", async () => {
    stubUpload(400, { success: false, error: "Dữ liệu không hợp lệ", details: [{ field: "email", message: "Giá trị không hợp lệ" }] });
    const user = userEvent.setup();
    renderForm();
    await fillAll(user);
    await user.click(screen.getByRole("button", { name: "Ứng tuyển" }));
    await waitFor(() => expect(screen.getByLabelText(/Email/)).toHaveAttribute("aria-invalid", "true"));
    await waitFor(() => expect(screen.getByLabelText(/Email/)).toHaveFocus());
    expect(screen.getByLabelText(/Họ và tên/)).toHaveValue("Nguyễn Văn A");
  });

  it("429 hiện cảnh báo kèm hotline và giữ dữ liệu", async () => {
    stubUpload(429, { success: false, error: "x" }, { "Retry-After": "600" });
    const user = userEvent.setup();
    renderForm();
    await fillAll(user);
    await user.click(screen.getByRole("button", { name: "Ứng tuyển" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("10 phút");
    expect(alert).toHaveTextContent("0901 234 567");
    expect(screen.getByLabelText(/Họ và tên/)).toHaveValue("Nguyễn Văn A");
  });

  it("vị trí hết hạn (400 code postingClosed) hiện thông báo kèm link danh sách tuyển dụng", async () => {
    stubUpload(400, { success: false, error: "Vị trí tuyển dụng này không còn nhận hồ sơ", details: [], code: "postingClosed" });
    const user = userEvent.setup();
    renderForm();
    await fillAll(user);
    await user.click(screen.getByRole("button", { name: "Ứng tuyển" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Vị trí này đã hết hạn nhận hồ sơ.");
    expect(screen.getByRole("link", { name: "Xem các vị trí đang tuyển" })).toHaveAttribute("href", "/tuyen-dung");
  });

  it("400 không có code (không phải hết hạn) hiện lỗi chung của form, KHÔNG báo hết hạn", async () => {
    stubUpload(400, { success: false, error: "Dữ liệu không hợp lệ", details: [] });
    const user = userEvent.setup();
    renderForm();
    await fillAll(user);
    await user.click(screen.getByRole("button", { name: "Ứng tuyển" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Dữ liệu không hợp lệ");
    expect(screen.queryByText("Vị trí này đã hết hạn nhận hồ sơ.")).toBeNull();
  });

  it("400 CV hỏng (kèm details field cv) gắn vào ô CV, không hiện thông báo hết hạn", async () => {
    const message = "Tệp CV bị lỗi hoặc không đọc được, vui lòng chọn tệp khác";
    stubUpload(400, { success: false, error: message, details: [{ field: "cv", message }] });
    const user = userEvent.setup();
    renderForm();
    await fillAll(user);
    await user.click(screen.getByRole("button", { name: "Ứng tuyển" }));
    await waitFor(() => expect(screen.getByLabelText(/CV/)).toHaveAttribute("aria-invalid", "true"));
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.queryByText("Vị trí này đã hết hạn nhận hồ sơ.")).toBeNull();
  });

  it("413 từ server gắn vào ô CV", async () => {
    stubUpload(413, { success: false, error: "CV vượt quá 5MB" });
    const user = userEvent.setup();
    renderForm();
    await fillAll(user);
    await user.click(screen.getByRole("button", { name: "Ứng tuyển" }));
    await waitFor(() => expect(screen.getByLabelText(/CV/)).toHaveAttribute("aria-invalid", "true"));
  });
});
