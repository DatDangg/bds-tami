import Image from "next/image";

// Logo màn đăng nhập /admin. Dùng file tĩnh (không phụ thuộc site-settings).
// Bản vàng cho giao diện sáng, bản trắng cho giao diện tối: CSS trong custom.scss ẩn bản không dùng.
export function Logo() {
  return (
    <span className="tami-admin-logo">
      <Image
        className="tami-admin-logo__light"
        src="/brand/tami-logo-gold.png"
        alt="TAMI HOMES"
        width={800}
        height={416}
        priority
      />
      <Image
        className="tami-admin-logo__dark"
        src="/brand/tami-logo-white.png"
        alt="TAMI HOMES"
        width={800}
        height={416}
        priority
      />
    </span>
  );
}
