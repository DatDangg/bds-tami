import { createHealthProbes } from "@/lib/health/probes";
import { runHealthChecks } from "@/lib/health/run-health-checks";

// Route tĩnh `/api/health` được Next ưu tiên hơn catch-all `/api/[...slug]` của Payload.
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const report = await runHealthChecks(createHealthProbes());
  return Response.json(report, {
    status: report.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
