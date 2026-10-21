"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentMember } from "@/lib/members";
import SignOutButton from "@/app/ui/sign-out-button";
import SiteMenu from "@/app/ui/site-menu";
import { getNavItems } from "@/lib/nav";
import { primaryButtonClass } from "@/lib/styles";

export default function HeaderMenu({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const hidden = pathname.startsWith("/login") || pathname.startsWith("/auth");

  useEffect(() => {
    if (hidden) {
      return;
    }

    let cancelled = false;

    async function loadName() {
      const member = await getCurrentMember(supabase);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setName(member?.full_name ?? user?.email ?? null);
      setEmail(member ? (user?.email ?? null) : null);
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
      {name ? (
        <div className="text-right">
          <p className="text-sm text-white">Signed in as {name}</p>
          {email ? <p className="text-xs text-white/70">{email}</p> : null}
        </div>
      ) : null}
      <SiteMenu
        label="Open main navigation menu"
        items={getNavItems(year)}
      >
        <SignOutButton className={`${primaryButtonClass} w-full`} />
      </SiteMenu>
    </div>
  );
}
