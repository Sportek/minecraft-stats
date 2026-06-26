import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware replacements for next/link, useRouter, redirect, etc. Internal
// navigation must use these so the active locale's prefix/domain is preserved.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
