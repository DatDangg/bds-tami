import type { GroupField } from "payload";

import { trimText } from "../../hooks/trim-text";

/** Trần ký tự của khung liên hệ cuối bài (đủ 2-3 câu; chữ admin hiện dạng văn bản thuần). */
export const NEWS_CONTACT_NOTE_MAX_LENGTH = 500;

/**
 * Trang chi tiết tin tức (BL-062). `contactNote` localized: `/en` không rơi về chữ tiếng Việt (BR-07) — rỗng thì trang dùng câu mặc định i18n.
 * Trang công khai render đúng văn bản thuần (không HTML) và biến "TAMI REAL ESTATE" thành link tới trang Liên hệ.
 */
export const newsDetailField: GroupField = {
  name: "newsDetail",
  type: "group",
  label: "Trang chi tiết tin tức",
  fields: [
    {
      name: "contactNote",
      type: "textarea",
      label: "Khung liên hệ cuối bài",
      localized: true,
      maxLength: NEWS_CONTACT_NOTE_MAX_LENGTH,
      hooks: { beforeValidate: [trimText] },
      admin: { description: "Hiện ở cuối mọi bài tin tức. Chữ 'TAMI REAL ESTATE' tự thành link tới trang Liên hệ. Để trống dùng câu mặc định." },
    },
  ],
};
