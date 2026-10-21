import type { SupabaseClient } from "@supabase/supabase-js";

export interface Member {
  id: string;
  full_name: string;
  is_super_user: boolean;
}

/**
 * Returns the member record for the signed-in user. On a first visit this links the user
 * to their seeded record (matched on Slack id / email) or creates a new one.
 */
export async function getCurrentMember(supabase: SupabaseClient): Promise<Member | null> {
  const { data, error } = await supabase.rpc("claim_member");

  if (error || !data) {
    return null;
  }

  return { id: data.id, full_name: data.full_name, is_super_user: data.is_super_user === true };
}
