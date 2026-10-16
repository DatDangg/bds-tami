import { ownedByUserOrAdmin } from "./ownedByUserOrAdmin";

/** Admin, hoặc sale được giao (`assignedTo`) bản ghi (PERMISSION §2). */
export const isAssignedOrAdmin = ownedByUserOrAdmin("assignedTo");
