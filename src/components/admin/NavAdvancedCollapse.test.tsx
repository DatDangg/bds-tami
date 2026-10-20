import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const getPreference = vi.fn();
vi.mock("@payloadcms/ui", () => ({ usePreferences: () => ({ getPreference }) }));

import { NavAdvancedCollapse, shouldCollapseAdvancedGroup } from "./NavAdvancedCollapse";

function mountNavGroup(onToggle: () => void) {
  const group = document.createElement("div");
  group.id = "nav-group-Nâng cao";
  const button = document.createElement("button");
  button.className = "nav-group__toggle nav-group__toggle--open";
  button.addEventListener("click", onToggle);
  group.append(button);
  document.body.append(group);
  return group;
}

afterEach(() => {
  document.body.innerHTML = "";
  getPreference.mockReset();
});

describe("shouldCollapseAdvancedGroup", () => {
  it("chưa có preference nhóm -> thu gọn; đã có (mở hoặc đóng) -> không đụng", () => {
    expect(shouldCollapseAdvancedGroup(null)).toBe(true);
    expect(shouldCollapseAdvancedGroup({ groups: { "Khách hàng": { open: true } } })).toBe(true);
    expect(shouldCollapseAdvancedGroup({ groups: { "Nâng cao": { open: true } } })).toBe(false);
    expect(shouldCollapseAdvancedGroup({ groups: { "Nâng cao": { open: false } } })).toBe(false);
  });
});

describe("NavAdvancedCollapse", () => {
  it("chưa có preference -> bấm toggle nhóm Nâng cao một lần", async () => {
    getPreference.mockResolvedValue(null);
    const onToggle = vi.fn();
    mountNavGroup(onToggle);
    render(<NavAdvancedCollapse />);
    await waitFor(() => expect(onToggle).toHaveBeenCalledTimes(1));
  });

  it("đợi nav render sau đó (MutationObserver)", async () => {
    getPreference.mockResolvedValue(null);
    const onToggle = vi.fn();
    render(<NavAdvancedCollapse />);
    await Promise.resolve();
    mountNavGroup(onToggle);
    await waitFor(() => expect(onToggle).toHaveBeenCalledTimes(1));
  });

  it("đã có preference -> không bấm", async () => {
    getPreference.mockResolvedValue({ groups: { "Nâng cao": { open: true } } });
    const onToggle = vi.fn();
    mountNavGroup(onToggle);
    render(<NavAdvancedCollapse />);
    await waitFor(() => expect(getPreference).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("getPreference lỗi -> không throw, không bấm", async () => {
    getPreference.mockRejectedValue(new Error("401"));
    const onToggle = vi.fn();
    mountNavGroup(onToggle);
    render(<NavAdvancedCollapse />);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onToggle).not.toHaveBeenCalled();
  });
});
