/** Cuối sidebar admin: "Phiên bản x.y.z" (spec_version nhúng lúc build qua next.config.ts). Không có số (vd chạy ngoài build) thì không hiện. */
export function AdminVersion() {
  const version = process.env.APP_VERSION;
  if (!version) return null;
  return <p className="tami-admin-version">Phiên bản {version}</p>;
}
