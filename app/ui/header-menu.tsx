"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentMember } from "@/lib/members";
import SignOutButton from "@/app/ui/sign-out-button";
import SiteMenu from "@/app/ui/site-menu";
import { getNavItems } from "@/lib/nav";

export default function HeaderMenu({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const [name, setName] = useState<string | null>(null);
  const hidden = pathname.startsWith("/login") || pathname.startsWith("/auth");

  useEffect(() => {
    if (hidden) {
      return;
    }

    let cancelled = false;

    async function loadName() {
      const member = await getCurrentMember(supabase);
      if (member) {
        if (!cancelled) setName(member.full_name);
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!cancelled) setName(user?.email ?? null);
    }

    loadName();

    return () => {
      cancelled = true;
    };
  }, [hidden]);

  if (pathname.startsWith("/login") || pathname.startsWith("/auth")) {
    return null;
  }

  const year = new Date().getFullYear();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {name ? <span className="text-sm text-white">Signed in as {name}</span> : null}
      <SiteMenu
        label="Open main navigation menu"
        items={getNavItems(year)}
      >
        <SignOutButton className="w-full text-left rounded px-3 py-2 text-sm text-gray-800 hover:bg-gray-100" />
      </SiteMenu>
    </div>
  );
}
