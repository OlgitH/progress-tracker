"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function deleteExchange(exchangeId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/social-exchange/${exchangeId}`);
  }

  // RLS limits this to the Exchangee who logged it (and never imported exchanges).
  const { data, error } = await supabase.from("social_exchanges").delete().eq("id", exchangeId).select("id");

  if (error || !data?.length) {
    redirect(`/social-exchange/${exchangeId}?notice=delete-failed`);
  }

  revalidatePath("/social-exchange");
  redirect("/social-exchange?notice=deleted");
}
