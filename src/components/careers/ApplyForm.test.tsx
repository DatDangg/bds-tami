import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

function renderForm(locale: "vi" | "en" = "vi") {
  return renderWithIntl(<ApplyForm jobPostingId={JOB_ID} listPath="/tuyen-dung" turnstileSiteKey="site" hotline={HOTLINE} />, locale);
}

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });
}

function stubFetch(response: Response) {
  const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const pdf = (name = "cv.pdf", bytes = 1024) => new File([new Uint8Array(bytes)], name, { type: "application/pdf" });

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

async function fillAll(user: ReturnType<typeof userEvent.setup>, file: File = pdf()) {
  await user.type(screen.getByLabelText(/Họ và tên/), "Nguyễn Văn A");
  await user.type(screen.getByLabelText(/Số điện thoại/), "0901234567");
  await user.type(screen.getByLabelText(/Email/), "a@example.com");
  await user.upload(screen.getByLabelText(/CV/), file);
  await user.click(screen.getByRole("checkbox"));
}

describe("ApplyForm: chọn file CV", () => {
  it("file 6MB bị chặn ở client: hiện lỗi tại ô CV, không gọi API, không giữ file", async () => {
    const fetchMock = stubFetch(jsonResponse(200, { success: true, data: { received: true } }));
    const user = userEvent.setup();
    renderForm();
    await user.upload(screen.getByLabelText(/CV/), pdf("big.pdf", 6 * 1024 * 1024));
    expect(screen.getByLabelText(/CV/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("CV tối đa 5MB, vui lòng chọn tệp nhỏ hơn.")).toBeInTheDocument();
    expect(screen.queryByText("big.pdf")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Ứng tuyển" }));
    expect(fetchMock).not.toHaveBeenCalled();
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
    const fetchMock = stubFetch(jsonResponse(200, { success: true, data: {} }));
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/Họ và tên/), "Nguyễn Văn A");
    await user.type(screen.getByLabelText(/Số điện thoại/), "0901234567");
    await user.type(screen.getByLabelText(/Email/), "a@example.com");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Ứng tuyển" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("Vui lòng đính kèm CV.")).toBeInTheDocument();
  });
});

describe("ApplyForm: gửi hồ sơ", () => {
  it("thành công hiện role=status, gửi multipart có jobPostingId, cv, locale", async () => {
    const fetchMock = stubFetch(jsonResponse(200, { success: true, data: { received: true } }));
    const user = userEvent.setup();
    renderForm();
    await fillAll(user, pdf("cv-an.pdf"));
    await user.click(screen.getByRole("button", { name: "Ứng tuyển" }));
    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("TAMI đã nhận hồ sơ của anh/chị.");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/public/job-applications");
    const body = init.body as FormData;
    expect(body.get("jobPostingId")).toBe(JOB_ID);
    expect(body.get("locale")).toBe("vi");
    expect(body.get("fullName")).toBe("Nguyễn Văn A");
    expect(body.get("consent")).toBe("true");
    expect(body.get("turnstileToken")).toBe("tok-1");
    expect((body.get("cv") as File).name).toBe("cv-an.pdf");
  });

  it("bản /en gửi locale=en và báo thành công bằng tiếng Anh", async () => {
    const fetchMock = stubFetch(jsonResponse(200, { success: true, data: { received: true } }));
    const user = userEvent.setup();
    renderForm("en");
    await user.type(screen.getByLabelText(/Full name/), "An Nguyen");
    await user.type(screen.getByLabelText(/Phone/), "0901234567");
    await user.type(screen.getByLabelText(/Email/), "a@example.com");
    await user.upload(screen.getByLabelText(/CV/), pdf());
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(await screen.findByRole("status")).toHaveTextContent("We have received your application.");
    expect((fetchMock.mock.calls[0]![1].body as FormData).get("locale")).toBe("en");
  });

  it("400 theo field gắn vào đúng ô, giữ dữ liệu đã nhập", async () => {
    stubFetch(jsonResponse(400, { success: false, error: "Dữ liệu không hợp lệ", details: [{ field: "email", message: "Giá trị không hợp lệ" }] }));
    const user = userEvent.setup();
    renderForm();
    await fillAll(user);
    await user.click(screen.getByRole("button", { name: "Ứng tuyển" }));
    await waitFor(() => expect(screen.getByLabelText(/Email/)).toHaveAttribute("aria-invalid", "true"));
    await waitFor(() => expect(screen.getByLabelText(/Email/)).toHaveFocus());
    expect(screen.getByLabelText(/Họ và tên/)).toHaveValue("Nguyễn Văn A");
  });

  it("429 hiện cảnh báo kèm hotline và giữ dữ liệu", async () => {
    stubFetch(jsonResponse(429, { success: false, error: "x" }, { "Retry-After": "600" }));
    const user = userEvent.setup();
    renderForm();
    await fillAll(user);
    await user.click(screen.getByRole("button", { name: "Ứng tuyển" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("10 phút");
    expect(alert).toHaveTextContent("0901 234 567");
    expect(screen.getByLabelText(/Họ và tên/)).toHaveValue("Nguyễn Văn A");
  });

  it("vị trí hết hạn (400 không có chi tiết) hiện thông báo kèm link danh sách tuyển dụng", async () => {
    stubFetch(jsonResponse(400, { success: false, error: "Vị trí tuyển dụng này không còn nhận hồ sơ", details: [] }));
    const user = userEvent.setup();
    renderForm();
    await fillAll(user);
    await user.click(screen.getByRole("button", { name: "Ứng tuyển" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Vị trí này đã hết hạn nhận hồ sơ.");
    expect(screen.getByRole("link", { name: "Xem các vị trí đang tuyển" })).toHaveAttribute("href", "/tuyen-dung");
  });

  it("400 CV hỏng (kèm details field cv) gắn vào ô CV, không hiện thông báo hết hạn", async () => {
    const message = "Tệp CV bị lỗi hoặc không đọc được, vui lòng chọn tệp khác";
    stubFetch(jsonResponse(400, { success: false, error: message, details: [{ field: "cv", message }] }));
    const user = userEvent.setup();
    renderForm();
    await fillAll(user);
    await user.click(screen.getByRole("button", { name: "Ứng tuyển" }));
    await waitFor(() => expect(screen.getByLabelText(/CV/)).toHaveAttribute("aria-invalid", "true"));
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.queryByText("Vị trí này đã hết hạn nhận hồ sơ.")).toBeNull();
  });

  it("413 từ server gắn vào ô CV", async () => {
    stubFetch(jsonResponse(413, { success: false, error: "CV vượt quá 5MB" }));
    const user = userEvent.setup();
    renderForm();
    await fillAll(user);
    await user.click(screen.getByRole("button", { name: "Ứng tuyển" }));
    await waitFor(() => expect(screen.getByLabelText(/CV/)).toHaveAttribute("aria-invalid", "true"));
  });
});
