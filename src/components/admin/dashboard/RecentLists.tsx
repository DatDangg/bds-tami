import Link from "next/link";
import { SOURCE_LABELS, STATUS_LABELS } from "../../../collections/Leads";
import { CONTENT_STATUS_LABELS } from "../../../fields/status";
import type { LeadSource } from "../../../lib/leads/lead-values";
import type { RecentLead, RecentOwnDoc } from "./dashboard-data";
import { relativeTimeVi } from "./dashboard-format";
import { StatusBadge } from "../StatusBadge";

interface RecentListProps {
  now: Date;
  isAdmin: boolean;
  adminRoute: string;
}

const STATUS_LABEL_BY_VALUE: Record<string, string> = { ...CONTENT_STATUS_LABELS, ...STATUS_LABELS };

function leadMeta(lead: RecentLead, now: Date): string {
  const source = SOURCE_LABELS[lead.source as LeadSource] ?? "";
  const assignee = lead.assigneeName ? `Sale: ${lead.assigneeName}` : "";
  return [source, relativeTimeVi(lead.createdAt, now), assignee].filter(Boolean).join(" · ");
}

/** Không hiện SĐT/email/lời nhắn của khách ở dashboard — chỉ mã, họ tên, nguồn, trạng thái. */
export function RecentLeadsCard({ leads, now, isAdmin, adminRoute }: RecentListProps & { leads: RecentLead[] }) {
  return (
    <section className="tami-dash-card" aria-labelledby="tami-dash-leads">
      <h2 id="tami-dash-leads" className="tami-dash-card__title">
        {isAdmin ? "Lead mới nhất" : "Lead được giao gần đây"}
        <Link href={`${adminRoute}/collections/leads`} prefetch={false}>Xem tất cả</Link>
      </h2>
      {leads.length === 0 ? (
        <p className="tami-dash-card__empty">Chưa có lead nào.</p>
      ) : (
        <ul className="tami-dash-list">
          {leads.map((lead) => (
            <li key={lead.id}>
              <div className="tami-dash-list__main">
                <Link className="tami-dash-list__title" href={`${adminRoute}/collections/leads/${lead.id}`} prefetch={false}>
                  {lead.fullName || lead.code}
                </Link>
                <span className="tami-dash-list__meta">{leadMeta(lead, now)}</span>
              </div>
              {isAdmin && !lead.isAssigned && lead.status === "new" && <StatusBadge value="unassigned" tone="warning" label="Chưa phân công" />}
              <StatusBadge value={lead.status} label={STATUS_LABEL_BY_VALUE[lead.status]} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Nhãn đúng nghĩa nguồn dữ liệu: bài mình là tác giả (hệ thống không lưu "người sửa cuối"). */
export function RecentOwnDocsCard({ docs, now }: { docs: RecentOwnDoc[]; now: Date }) {
  return (
    <section className="tami-dash-card" aria-labelledby="tami-dash-own">
      <h2 id="tami-dash-own" className="tami-dash-card__title">
        Bài của bạn cập nhật gần đây
      </h2>
      {docs.length === 0 ? (
        <p className="tami-dash-card__empty">Bạn chưa có bài nào.</p>
      ) : (
        <ul className="tami-dash-list">
          {docs.map((doc) => (
            <li key={doc.key}>
              <div className="tami-dash-list__main">
                <Link className="tami-dash-list__title" href={doc.href} prefetch={false}>
                  {doc.title}
                </Link>
                <span className="tami-dash-list__meta">{[doc.collectionLabel, relativeTimeVi(doc.updatedAt, now)].filter(Boolean).join(" · ")}</span>
              </div>
              <StatusBadge value={doc.status} label={STATUS_LABEL_BY_VALUE[doc.status]} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
