"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface SignOutButtonProps {
  className?: string;
}

export default function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      aria-label="Sign out"
      className={className ?? "border border-gray-300 px-3 py-2 rounded hover:bg-gray-100 transition"}
    >
      Sign Out
    </button>
  );
}
