import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VideoFacade } from "./VideoFacade";
import { fakeMedia, renderWithIntl } from "./test-utils";
import { parseVideoUrl } from "./video-url";

const YOUTUBE_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
const TIKTOK_URL = "https://www.tiktok.com/@tami/video/7234567890123456789";

afterEach(() => vi.unstubAllGlobals());

describe("parseVideoUrl", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("YouTube %s", (input, id) => {
    expect(parseVideoUrl(input)).toMatchObject({
      provider: "youtube",
      id,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`,
    });
  });

  it("TikTok dựng embed từ ID", () => {
    expect(parseVideoUrl(TIKTOK_URL)).toMatchObject({ provider: "tiktok", embedUrl: "https://www.tiktok.com/embed/v2/7234567890123456789" });
  });

  it.each([
    "",
    "not a url",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "http://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://evil.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ",
    "https://evil.com/youtube.com/watch?v=dQw4w9WgXcQ",
    "https://user:pass@www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com:8443/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=short",
    'https://www.youtube.com/watch?v=dQw4w9WgXc"onload=alert(1)',
    "https://www.youtube.com/watch?v=../../etc/pass",
    "https://vm.tiktok.com/ZMabc123/",
    "https://www.tiktok.com/@tami/video/12abc",
    "https://www.vimeo.com/123456789",
  ])("từ chối %j", (input) => {
    expect(parseVideoUrl(input)).toBeNull();
  });

  it("từ chối null/undefined", () => {
    expect(parseVideoUrl(null)).toBeNull();
    expect(parseVideoUrl(undefined)).toBeNull();
  });
});

describe("VideoFacade", () => {
  it("chưa bấm: không có iframe, chỉ có nút phát có aria-label", () => {
    const { container } = renderWithIntl(<VideoFacade url={YOUTUBE_URL} title="Tour dự án" />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("button", { name: "Phát video: Tour dự án" })).toBeInTheDocument();
  });

  it("bấm nút thì nhúng iframe youtube-nocookie có title, và focus vào iframe", async () => {
    const user = userEvent.setup();
    const { container } = renderWithIntl(<VideoFacade url={YOUTUBE_URL} title="Tour dự án" />);
    await user.click(screen.getByRole("button", { name: "Phát video: Tour dự án" }));
    const iframe = container.querySelector("iframe");
    expect(iframe).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&playsinline=1");
    expect(iframe).toHaveAttribute("title", "Video: Tour dự án");
    expect(iframe).toHaveFocus();
    expect(screen.queryByRole("button", { name: /Phát video/ })).not.toBeInTheDocument();
  });

  it("TikTok nhúng đúng embed v2 khi bấm", async () => {
    const user = userEvent.setup();
    const { container } = renderWithIntl(<VideoFacade url={TIKTOK_URL} title="Clip" poster={fakeMedia("tiktok")} />);
    expect(container.querySelector("iframe")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Phát video: Clip" }));
    expect(container.querySelector("iframe")).toHaveAttribute("src", "https://www.tiktok.com/embed/v2/7234567890123456789");
  });

  it("URL ngoài whitelist: không render nút lẫn iframe", () => {
    const { container } = renderWithIntl(<VideoFacade url="https://evil.com/watch?v=dQw4w9WgXcQ" title="X" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("thumbnail YouTube có alt khi mạng bình thường", () => {
    renderWithIntl(<VideoFacade url={YOUTUBE_URL} title="Tour" />);
    // jsdom không có navigator.connection => saveData=false => dùng thumbnail YouTube
    expect(screen.getByRole("img", { name: "Ảnh xem trước video: Tour" })).toHaveAttribute("src", expect.stringContaining("i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"));
  });

  it("Save-Data: không tải thumbnail YouTube, không có iframe", () => {
    vi.stubGlobal("navigator", Object.assign(Object.create(navigator), { connection: { saveData: true } }));
    const { container } = renderWithIntl(<VideoFacade url={YOUTUBE_URL} title="Tour" />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("button", { name: "Phát video: Tour" })).toBeInTheDocument();
  });

  it("poster từ media có alt theo locale và dùng cỡ đã sinh", () => {
    renderWithIntl(<VideoFacade url={YOUTUBE_URL} title="Tour" poster={fakeMedia("poster")} />, "en");
    const image = screen.getByRole("img", { name: "Video preview: Tour" });
    expect(image.getAttribute("srcset")).toContain("/api/media/file/poster-");
    expect(screen.getByRole("button", { name: "Play video: Tour" })).toBeInTheDocument();
  });
});
