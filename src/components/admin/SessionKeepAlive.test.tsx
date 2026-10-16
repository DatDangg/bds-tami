import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refreshCookieAsync = vi.fn();
const pathnameState = { value: "/admin/collections/staff" };

vi.mock("@payloadcms/ui", () => ({
  useAuth: () => ({ refreshCookieAsync }),
  useConfig: () => ({
    config: {
      routes: { admin: "/admin", api: "/api" },
      admin: {
        user: "staff",
        routes: {
          login: "/login",
          logout: "/logout",
          inactivity: "/logout-inactivity",
          forgot: "/forgot",
          reset: "/reset",
          createFirstUser: "/create-first-user",
          unauthorized: "/unauthorized",
          account: "/account",
          browseByFolder: "/browse-by-folder",
        },
      },
    },
  }),
}));
vi.mock("next/navigation", () => ({ usePathname: () => pathnameState.value }));

import { SessionKeepAlive } from "./SessionKeepAlive";

describe("SessionKeepAlive (làm mới qua refreshCookieAsync của Payload UI)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    refreshCookieAsync.mockReset();
    refreshCookieAsync.mockResolvedValue({ id: 7 });
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    pathnameState.value = "/admin/collections/staff";
  });
  afterEach(() => vi.unstubAllGlobals());

  it("làm mới bằng refreshCookieAsync, không tự gọi fetch", async () => {
    render(<SessionKeepAlive />);
    await vi.waitFor(() => expect(refreshCookieAsync).toHaveBeenCalledTimes(1));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throttle: nhiều thao tác liên tiếp chỉ làm mới 1 lần", async () => {
    render(<SessionKeepAlive />);
    await vi.waitFor(() => expect(refreshCookieAsync).toHaveBeenCalledTimes(1));
    for (let i = 0; i < 5; i += 1) window.dispatchEvent(new Event("pointerdown"));
    await Promise.resolve();
    expect(refreshCookieAsync).toHaveBeenCalledTimes(1);
  });

  it("tab ẩn thì không làm mới", async () => {
    const spy = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    render(<SessionKeepAlive />);
    window.dispatchEvent(new Event("keydown"));
    await Promise.resolve();
    expect(refreshCookieAsync).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it.each(["login", "logout", "logout-inactivity", "forgot", "reset", "create-first-user", "unauthorized"])(
    "không làm mới ở màn không có phiên /admin/%s",
    async (slug) => {
      pathnameState.value = `/admin/${slug}`;
      render(<SessionKeepAlive />);
      window.dispatchEvent(new Event("pointerdown"));
      await Promise.resolve();
      expect(refreshCookieAsync).not.toHaveBeenCalled();
    },
  );

  it.each(["/admin/account", "/admin/browse-by-folder/x"])("vẫn làm mới ở màn đã đăng nhập %s", async (path) => {
    pathnameState.value = path;
    render(<SessionKeepAlive />);
    await vi.waitFor(() => expect(refreshCookieAsync).toHaveBeenCalledTimes(1));
  });
});
