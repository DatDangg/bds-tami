import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import type { LeadSource } from "@/lib/leads/lead-values";
import { LeadForm } from "./LeadForm";

// Widget Turnstile có test riêng: ở đây giả lập đã xác minh xong ngay.
vi.mock("@/components/forms/TurnstileWidget", async () => {
  const { useEffect } = await import("react");
  return {
    TurnstileWidget: ({ onToken }: { onToken: (token: string | null) => void }) => {
      useEffect(() => onToken("tok-1"), [onToken]);
      return null;
    },
  };
});

const SOURCE_ID = "0b6f0a8e-6a4b-4a3e-9d59-3f8f0f5e2c11";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function stubFetch(response: Response) {
  const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function sentBody(fetchMock: ReturnType<typeof stubFetch>): Record<string, unknown> {
  const init = fetchMock.mock.calls[0]![1];
  return JSON.parse(init.body as string) as Record<string, unknown>;
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>, submitName: string) {
  await user.type(screen.getByLabelText(/Họ và tên|Full name/), "Nguyễn Văn A");
  await user.type(screen.getByLabelText(/Số điện thoại|Phone number/), "0901234567");
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: submitName }));
}

beforeEach(() => {
  window.sessionStorage.clear();
  window.history.replaceState(null, "", "/cho-thue/can-ho-a?foo=1#gallery");
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

describe("LeadForm: payload theo source", () => {
  it.each<[LeadSource, string | undefined]>([
    ["rental", SOURCE_ID],
    ["property_post", SOURCE_ID],
    ["project", SOURCE_ID],
    ["contact", undefined],
  ])("source=%s gửi đúng source/sourceId/locale/pageUrl/consent", async (source, sourceId) => {
    const fetchMock = stubFetch(jsonResponse(200, { success: true, data: { received: true } }));
    const user = userEvent.setup();
    renderWithIntl(<LeadForm source={source} {...(sourceId ? { sourceId } : {})} turnstileSiteKey="site" />, "vi");
    await fillAndSubmit(user, "Nhận tư vấn");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0]![0]).toBe("/api/public/leads");
    const body = sentBody(fetchMock);
    expect(body).toMatchObject({
      source,
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      consent: true,
      locale: "vi",
      turnstileToken: "tok-1",
      pageUrl: `${window.location.origin}/cho-thue/can-ho-a?foo=1`,
    });
    if (sourceId) expect(body.sourceId).toBe(sourceId);
    else expect(body).not.toHaveProperty("sourceId");
    expect(body).not.toHaveProperty("email");
  });

  it("contact bỏ sourceId dù được truyền nhầm", async () => {
    const fetchMock = stubFetch(jsonResponse(200, { success: true, data: { received: true } }));
    const user = userEvent.setup();
    renderWithIntl(<LeadForm source="contact" sourceId={SOURCE_ID} turnstileSiteKey="site" />, "vi");
    await fillAndSubmit(user, "Nhận tư vấn");
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(sentBody(fetchMock)).not.toHaveProperty("sourceId");
  });

  it("UTM trong URL được gửi kèm; vào trang khác vẫn còn nhờ sessionStorage", async () => {
    const fetchMock = stubFetch(jsonResponse(200, { success: true, data: { received: true } }));
    window.history.replaceState(null, "", "/du-an/abc?utm_source=facebook&utm_campaign=t10");
    const first = renderWithIntl(<LeadForm source="project" sourceId={SOURCE_ID} turnstileSiteKey="site" />, "vi");
    first.unmount();
    window.history.replaceState(null, "", "/lien-he");
    const user = userEvent.setup();
    renderWithIntl(<LeadForm source="contact" turnstileSiteKey="site" />, "vi");
    await fillAndSubmit(user, "Nhận tư vấn");
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(sentBody(fetchMock).utm).toEqual({ source: "facebook", campaign: "t10" });
  });

  it("bản EN: nút Get advice, locale=en", async () => {
    const fetchMock = stubFetch(jsonResponse(200, { success: true, data: { received: true } }));
    const user = userEvent.setup();
    renderWithIntl(<LeadForm source="rental" sourceId={SOURCE_ID} turnstileSiteKey="site" />, "en");
    await fillAndSubmit(user, "Get advice");
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(sentBody(fetchMock).locale).toBe("en");
  });
});

describe("LeadForm: kết quả", () => {
  it("thành công: thông báo cảm ơn role=status thay form", async () => {
    stubFetch(jsonResponse(200, { success: true, data: { received: true } }));
    const user = userEvent.setup();
    renderWithIntl(<LeadForm source="contact" turnstileSiteKey="site" />, "vi");
    await fillAndSubmit(user, "Nhận tư vấn");
    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Cảm ơn anh/chị!");
    expect(screen.queryByRole("button", { name: "Nhận tư vấn" })).toBeNull();
  });

  it("400 theo field: lỗi gắn vào ô SĐT", async () => {
    stubFetch(jsonResponse(400, { success: false, error: "Dữ liệu không hợp lệ", details: [{ field: "phone", message: "SĐT sai" }] }));
    const user = userEvent.setup();
    renderWithIntl(<LeadForm source="contact" turnstileSiteKey="site" />, "vi");
    await fillAndSubmit(user, "Nhận tư vấn");
    await waitFor(() => expect(screen.getByLabelText(/Số điện thoại/)).toHaveAttribute("aria-invalid", "true"));
    expect(screen.getByText("SĐT sai")).toBeInTheDocument();
  });

  it("thiếu consent hoặc SĐT sai: không gọi API", async () => {
    const fetchMock = stubFetch(jsonResponse(200, {}));
    const user = userEvent.setup();
    renderWithIntl(<LeadForm source="contact" turnstileSiteKey="site" />, "vi");
    await user.type(screen.getByLabelText(/Họ và tên/), "Nguyễn Văn A");
    await user.type(screen.getByLabelText(/Số điện thoại/), "123");
    await user.click(screen.getByRole("button", { name: "Nhận tư vấn" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Số điện thoại/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-invalid", "true");
  });
});
