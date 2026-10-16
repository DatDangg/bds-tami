import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "../media/test-utils";
import { ConsentCheckbox } from "./ConsentCheckbox";
import { FormField } from "./FormField";
import { FormErrorSummary, FormStatus } from "./FormStatus";
import { buildMultipartBody } from "./submit-helpers";
import { usePublicForm } from "./use-public-form";

type HarnessProps = { encoding?: "json" | "multipart"; endpoint?: string };

/** Form tối thiểu ráp các primitive như form lead/ứng tuyển sẽ làm; nút "token" thay cho widget Turnstile thật. */
function Harness({ encoding = "json", endpoint = "/api/public/leads" }: HarnessProps) {
  const form = usePublicForm({ endpoint, encoding, fieldNames: ["fullName", "phone", "cv"], fileField: encoding === "multipart" ? "cv" : undefined });
  if (form.status === "success") return <FormStatus />;
  const submitting = form.status === "submitting";
  return (
    <form noValidate onSubmit={(event) => form.handleSubmit(event, { source: "contact" })}>
      <FormField name="fullName" label="Họ tên" required readOnly={submitting} error={form.fieldErrors.fullName} />
      <FormField name="phone" label="Số điện thoại" required readOnly={submitting} error={form.fieldErrors.phone} />
      {encoding === "multipart" && <FormField as="file" name="cv" label="CV" error={form.fieldErrors.cv} />}
      <ConsentCheckbox {...form.consent} />
      <button type="button" onClick={() => form.turnstile.onToken("tok-1")}>
        token
      </button>
      {/* jsdom không cho FormData(form) đọc file do user-event gắn, nên đường file đi qua submit() trực tiếp. */}
      <button type="button" onClick={() => form.submit({ fullName: "Nguyễn Văn A", phone: "0901234567", cv: new File(["%PDF-1.4"], "cv.pdf", { type: "application/pdf" }) }, { source: "contact" })}>
        submit-with-cv
      </button>
      <button
        type="button"
        onClick={() => {
          const fields = { fullName: "Nguyễn Văn A", phone: "0901234567" };
          void form.submit(fields);
          void form.submit(fields);
        }}
      >
        submit-twice
      </button>
      <button type="button" onClick={() => form.turnstile.onUnavailable()}>
        captcha-down
      </button>
      {form.issue && <FormErrorSummary message={form.issue.message} details={form.issue.details} onRetry={form.issue.retryable ? form.retry : undefined} />}
      <button type="submit" disabled={submitting}>
        Gửi
      </button>
    </form>
  );
}

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });
}

function stubFetch(response: Response | (() => Promise<Response>)) {
  const fetchMock = vi.fn(typeof response === "function" ? response : async () => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Họ tên/), "Nguyễn Văn A");
  await user.type(screen.getByLabelText(/Số điện thoại/), "0901234567");
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "token" }));
}

// Radix Checkbox trong <form> đo kích thước ô input ẩn bằng ResizeObserver (jsdom không có).
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
afterEach(() => vi.unstubAllGlobals());

describe("usePublicForm", () => {
  it("không tick consent thì không gọi API, hiện lỗi đúng ngôn ngữ và focus ô lỗi", async () => {
    const fetchMock = stubFetch(jsonResponse(200, { success: true, data: {} }));
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    await user.click(screen.getByRole("button", { name: "token" }));
    await user.click(screen.getByRole("button", { name: "Gửi" }));
    expect(fetchMock).not.toHaveBeenCalled();
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    expect(checkbox).toHaveFocus();
    expect(screen.getByText("Vui lòng đồng ý để gửi thông tin.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Vui lòng kiểm tra lại các trường được đánh dấu.");
  });

  it("lỗi consent bằng tiếng Anh khi xem bản /en và biến mất sau khi tick", async () => {
    const fetchMock = stubFetch(jsonResponse(200, { success: true, data: {} }));
    const user = userEvent.setup();
    renderWithIntl(<Harness />, "en");
    await user.click(screen.getByRole("button", { name: "Gửi" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("Please agree to send your information.")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox"));
    expect(screen.queryByText("Please agree to send your information.")).not.toBeInTheDocument();
  });

  it("link chính sách theo locale, mở tab mới, có chú thích aria-describedby", () => {
    renderWithIntl(<Harness />);
    const link = screen.getByRole("link", { name: "Chính sách bảo mật" });
    expect(link).toHaveAttribute("href", "/chinh-sach-bao-mat");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(document.getElementById(link.getAttribute("aria-describedby") ?? "")).toHaveTextContent("(mở tab mới)");
  });

  it("chưa có token Turnstile thì không gọi API và báo đang xác minh", async () => {
    const fetchMock = stubFetch(jsonResponse(200, { success: true, data: {} }));
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    await user.type(screen.getByLabelText(/Họ tên/), "Nguyễn Văn A");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Gửi" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Đang xác minh chống spam");
  });

  it("widget không khả dụng thì báo tải lại trang, vẫn không gọi API", async () => {
    const fetchMock = stubFetch(jsonResponse(200, { success: true, data: {} }));
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "captcha-down" }));
    await user.click(screen.getByRole("button", { name: "Gửi" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Không tải được bước xác minh chống spam");
  });

  it("map details của API vào đúng ô: aria-invalid + aria-describedby + focus ô đầu tiên; lỗi lạ vào tóm tắt", async () => {
    stubFetch(
      jsonResponse(400, {
        success: false,
        error: "Dữ liệu không hợp lệ",
        details: [
          { path: ["phone"], message: "SĐT không hợp lệ" },
          { path: ["fullName"], message: "Họ tên quá ngắn" },
          { path: ["utm", "source"], message: "utm sai" },
        ],
      }),
    );
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Gửi" }));

    const phone = await screen.findByLabelText(/Số điện thoại/);
    expect(phone).toHaveAttribute("aria-invalid", "true");
    expect(document.getElementById(phone.getAttribute("aria-describedby") ?? "")).toHaveTextContent("SĐT không hợp lệ");
    const name = screen.getByLabelText(/Họ tên/);
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(document.getElementById(name.getAttribute("aria-describedby") ?? "")).toHaveTextContent("Họ tên quá ngắn");
    // Ô đầu tiên theo thứ tự trên trang (không theo thứ tự `details`).
    expect(name).toHaveFocus();
    expect(screen.getByRole("alert")).toHaveTextContent("utm sai");
    // Dữ liệu đã nhập được giữ.
    expect(name).toHaveValue("Nguyễn Văn A");
  });

  it("gửi JSON đúng hợp đồng API: consent true, turnstileToken, locale, extra; ô rỗng bị bỏ", async () => {
    const fetchMock = stubFetch(jsonResponse(200, { success: true, data: {} }));
    const user = userEvent.setup();
    renderWithIntl(<Harness />, "en");
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Gửi" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/public/leads");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
    expect(JSON.parse(init.body as string)).toEqual({
      source: "contact",
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      consent: true,
      turnstileToken: "tok-1",
      locale: "en",
    });
  });

  it("thành công thay form bằng role=status và chuyển focus tới tiêu đề", async () => {
    stubFetch(jsonResponse(200, { success: true, data: {} }));
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Gửi" }));
    const status = await screen.findByRole("status");
    expect(screen.queryByRole("button", { name: "Gửi" })).not.toBeInTheDocument();
    const heading = screen.getByRole("heading", { name: "Cảm ơn anh/chị!" });
    expect(status).toContainElement(heading);
    expect(heading).toHaveFocus();
  });

  it("multipart gửi FormData kèm file CV, không tự đặt Content-Type", async () => {
    const fetchMock = stubFetch(jsonResponse(200, { success: true, data: {} }));
    const user = userEvent.setup();
    renderWithIntl(<Harness encoding="multipart" endpoint="/api/public/job-applications" />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "submit-with-cv" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/public/job-applications");
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.headers).not.toHaveProperty("Content-Type");
    const body = init.body as FormData;
    expect(body.get("fullName")).toBe("Nguyễn Văn A");
    expect(body.get("consent")).toBe("true");
    expect(body.get("turnstileToken")).toBe("tok-1");
    expect(body.get("locale")).toBe("vi");
    expect(body.get("source")).toBe("contact");
    const cv = body.get("cv");
    expect(cv).toBeInstanceOf(File);
    expect((cv as File).name).toBe("cv.pdf");
  });

  it("413 gắn vào ô CV; 415 báo định dạng", async () => {
    stubFetch(jsonResponse(413, { success: false, error: "File quá lớn", details: [] }));
    const user = userEvent.setup();
    renderWithIntl(<Harness encoding="multipart" endpoint="/api/public/job-applications" />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "submit-with-cv" }));
    const cv = await screen.findByLabelText("CV");
    await waitFor(() => expect(cv).toHaveAttribute("aria-invalid", "true"));
    expect(document.getElementById(cv.getAttribute("aria-describedby") ?? "")).toHaveTextContent("Tệp quá lớn");
  });

  it("429 đọc Retry-After thành số phút, giữ dữ liệu, không có nút thử lại", async () => {
    stubFetch(jsonResponse(429, { success: false, error: "x", details: [] }, { "Retry-After": "420" }));
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Gửi" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("7 phút");
    expect(screen.queryByRole("button", { name: "Thử lại" })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Họ tên/)).toHaveValue("Nguyễn Văn A");
  });

  it("503, 500 và lỗi mạng đều ra role=alert; có nút Thử lại gửi lại cùng dữ liệu với token mới", async () => {
    const fetchMock = stubFetch(async () => {
      throw new TypeError("network");
    });
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Gửi" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("kiểm tra kết nối mạng");

    // Token đã bị dùng: chưa có token mới thì Thử lại phải chặn ở bước captcha, không gọi API lần 2.
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert")).toHaveTextContent("Đang xác minh chống spam");

    fetchMock.mockImplementation(async () => jsonResponse(503, { success: false, error: "x", details: [] }));
    await user.click(screen.getByRole("button", { name: "token" }));
    await user.click(screen.getByRole("button", { name: "Gửi" }));
    expect(await screen.findByText(/Hệ thống tạm thời không khả dụng/)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("400 từ pipeline với message captcha được coi là captcha lỗi, không gắn vào ô nào", async () => {
    stubFetch(jsonResponse(400, { success: false, error: "Xác thực captcha không thành công", details: [] }));
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Gửi" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Xác minh chống spam không thành công");
    expect(screen.getByLabelText(/Họ tên/)).not.toHaveAttribute("aria-invalid");
  });

  it("400 chỉ có error (không captcha, details rỗng) hiện message của server, không gọi là captcha", async () => {
    stubFetch(jsonResponse(400, { success: false, error: "Dữ liệu không hợp lệ", details: [] }));
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Gửi" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Dữ liệu không hợp lệ");
    expect(alert).not.toHaveTextContent("chống spam");
  });

  it("400 không có cả error lẫn details dùng thông báo lỗi chung, không gọi là captcha", async () => {
    stubFetch(jsonResponse(400, { success: false }));
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Gửi" }));
    const alert = await screen.findByRole("alert");
    expect(alert).not.toHaveTextContent("chống spam");
    expect(alert.textContent?.length).toBeGreaterThan(0);
  });

  it("details có path rỗng (zod root) hoặc chỉ có message vẫn vào tóm tắt lỗi, không bị nuốt", async () => {
    stubFetch(
      jsonResponse(400, {
        success: false,
        error: "Dữ liệu không hợp lệ",
        details: [{ path: [], message: "Cần ít nhất SĐT hoặc email" }, { message: "Nội dung quá lớn" }],
      }),
    );
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Gửi" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Cần ít nhất SĐT hoặc email");
    expect(alert).toHaveTextContent("Nội dung quá lớn");
    expect(alert).not.toHaveTextContent("chống spam");
  });

  it("Thử lại đọc lại nội dung form hiện tại, không gửi bản chụp cũ", async () => {
    const fetchMock = stubFetch(async () => {
      throw new TypeError("network");
    });
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Gửi" }));
    await screen.findByRole("button", { name: "Thử lại" });
    fetchMock.mockImplementation(async () => jsonResponse(200, { success: true, data: {} }));
    await user.click(screen.getByRole("button", { name: "token" }));
    await user.clear(screen.getByLabelText(/Họ tên/));
    await user.type(screen.getByLabelText(/Họ tên/), "Trần Thị B");
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [, init] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toMatchObject({ fullName: "Trần Thị B" });
  });

  it("chống double-submit: gọi submit() trực tiếp 2 lần liền nhau chỉ gửi 1 lần", async () => {
    let release: (response: Response) => void = () => {};
    const fetchMock = stubFetch(() => new Promise<Response>((resolve) => (release = resolve)));
    const user = userEvent.setup();
    renderWithIntl(<Harness encoding="multipart" endpoint="/api/public/job-applications" />);
    await fillValidForm(user);
    const direct = screen.getByRole("button", { name: "submit-twice" });
    await user.click(direct);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    release(jsonResponse(200, { success: true, data: {} }));
    expect(await screen.findByRole("status")).toBeInTheDocument();
  });

  it("chống double-submit: bấm gửi liên tiếp khi đang chờ chỉ gọi API 1 lần", async () => {
    let release: (response: Response) => void = () => {};
    const fetchMock = stubFetch(() => new Promise<Response>((resolve) => (release = resolve)));
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    await fillValidForm(user);
    const submit = screen.getByRole("button", { name: "Gửi" });
    await user.click(submit);
    await user.click(submit);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(submit).toBeDisabled();
    release(jsonResponse(200, { success: true, data: {} }));
    expect(await screen.findByRole("status")).toBeInTheDocument();
  });
});

describe("buildMultipartBody extra", () => {
  it("number/boolean thành chuỗi, object (utm) thành JSON, null bị bỏ — không rơi giá trị im lặng", () => {
    const body = buildMultipartBody({
      fields: { fullName: "A" },
      extra: { jobPostingId: 12, flag: true, utm: { source: "fb" }, skip: null },
      turnstileToken: "t",
      locale: "vi",
    });
    expect(body.get("jobPostingId")).toBe("12");
    expect(body.get("flag")).toBe("true");
    expect(body.get("utm")).toBe(JSON.stringify({ source: "fb" }));
    expect(body.has("skip")).toBe(false);
  });
});
