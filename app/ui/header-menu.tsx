"use client";

import { usePathname } from "next/navigation";
import SignOutButton from "@/app/ui/sign-out-button";
import SiteMenu from "@/app/ui/site-menu";
import { getNavItems } from "@/lib/nav";

export default function HeaderMenu({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  if (pathname.startsWith("/login") || pathname.startsWith("/auth")) {
    return null;
  }

  const year = new Date().getFullYear();

  return (
    <div className={className}>
      <SiteMenu
        label="Open main navigation menu"
        items={getNavItems(year)}
      >
        <SignOutButton className="w-full text-left rounded px-3 py-2 text-sm text-gray-800 hover:bg-gray-100" />
      </SiteMenu>
    </div>
  );
}
