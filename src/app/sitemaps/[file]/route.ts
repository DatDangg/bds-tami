import { sitemapFileResponse } from "@/lib/seo/sitemap-routes";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ file: string }> }) {
  return sitemapFileResponse((await params).file, request);
}
