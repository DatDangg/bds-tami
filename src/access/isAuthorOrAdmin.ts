import { ownedByUserOrAdmin } from "./ownedByUserOrAdmin";

/** Admin, hoặc sale là `author` của bản ghi (PERMISSION §2). */
export const isAuthorOrAdmin = ownedByUserOrAdmin("author");
