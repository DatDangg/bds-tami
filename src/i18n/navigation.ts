import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Link/redirect/useRouter nhận khoá đường dẫn nội bộ và tự sinh URL theo ngôn ngữ hiện tại.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
