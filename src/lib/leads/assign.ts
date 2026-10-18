import type { Payload, PayloadRequest } from "payload";

import { isAssignableSale } from "./assignable-sale";
import type { LeadSource } from "./lead-values";

/** BR-12: chỉ tin cho thuê và bài Đăng tin BĐS tự giao; dự án/liên hệ chờ admin. */
const AUTO_ASSIGN_COLLECTION = { rental: "rentals", property_post: "property-posts" } as const;

export function isAutoAssignSource(source: LeadSource): source is keyof typeof AUTO_ASSIGN_COLLECTION {
  return source in AUTO_ASSIGN_COLLECTION;
}

/**
 * Người tự được giao lead mới: `author` của tin nguồn, chỉ khi họ còn là sale đang hoạt động (cùng luật `isAssignableSale` với
 * form admin và endpoint giao lead). Không phải thì `null` để lead chờ admin giao. Hook `recordAssignmentChange` lo activity/email.
 */
export async function resolveAutoAssignee(
  payload: Payload,
  args: { source: LeadSource; sourceId: string | null; req: PayloadRequest },
): Promise<string | null> {
  if (!isAutoAssignSource(args.source) || !args.sourceId) return null;
  const post = await payload.findByID({
    collection: AUTO_ASSIGN_COLLECTION[args.source],
    id: args.sourceId,
    depth: 0,
    select: { author: true },
    overrideAccess: true,
    req: args.req,
    disableErrors: true,
  });
  const authorId = typeof post?.author === "object" ? post.author.id : post?.author;
  if (!authorId) return null;
  const author = await payload.findByID({
    collection: "staff",
    id: authorId,
    depth: 0,
    select: { role: true, active: true },
    overrideAccess: true,
    req: args.req,
    disableErrors: true,
  });
  return isAssignableSale(author) ? authorId : null;
}
