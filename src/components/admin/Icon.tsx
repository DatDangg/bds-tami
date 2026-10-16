import Image from "next/image";

// Biểu tượng mái nhà ở thanh bên admin (cắt từ logo chính thức). Bản vàng cho nền sáng, bản trắng cho nền tối.
export function Icon() {
  return (
    <span className="tami-admin-icon">
      <Image
        className="tami-admin-icon__light"
        src="/brand/tami-icon-gold.png"
        alt="TAMI HOMES"
        width={256}
        height={256}
      />
      <Image
        className="tami-admin-icon__dark"
        src="/brand/tami-icon-white.png"
        alt="TAMI HOMES"
        width={256}
        height={256}
      />
    </span>
  );
}
