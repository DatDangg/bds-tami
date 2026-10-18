import type { MetadataRoute } from "next";

import { buildRobots } from "@/lib/seo/robots";
import { getSiteUrl, isIndexingAllowed } from "@/lib/seo/site-url";

// Bắt buộc dynamic: nếu prerender lúc build thì `APP_ENV` chưa có và staging/prod đều nhận bản build-time.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return buildRobots(isIndexingAllowed(), getSiteUrl());
}
