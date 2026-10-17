import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { LinkView } from "./shell-data";

type NavAnchorProps = Omit<ComponentProps<"a">, "href" | "children"> & { link: LinkView; children?: ReactNode };

/** Link nội bộ qua `next/link` (điều hướng client); URL ngoài mở tab mới kèm `noopener`. Href đã tiền tố ngôn ngữ (`resolveNavLink`). */
export function NavAnchor({ link, children, ...props }: NavAnchorProps) {
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" {...props}>
        {children ?? link.label}
      </a>
    );
  }
  return (
    <Link href={link.href} {...props}>
      {children ?? link.label}
    </Link>
  );
}

/** Trang đang xem: khớp đúng đường dẫn, hoặc là trang con (`/du-an/abc` thuộc mục `/du-an`). Trang chủ chỉ khớp đúng. */
export function isActivePath(pathname: string, href: string): boolean {
  const normalize = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);
  const current = normalize(pathname);
  const target = normalize(href);
  if (target === "/" || target === "/en") return current === target;
  return current === target || current.startsWith(`${target}/`);
}
