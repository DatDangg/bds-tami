import type { Field } from "payload";

/** `admin.components` dùng chung cho field text chứa slug collection/global (BL-043); khớp khoá trong importMap.js. */
export const COLLECTION_NAME_ADMIN = {
  components: {
    Cell: "/components/admin/CollectionNameCell#CollectionNameCell",
    Description: "/components/admin/CollectionNameHint#CollectionNameHint",
  },
} satisfies NonNullable<Extract<Field, { type: "text" }>["admin"]>;
