"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { parseValue } from "@/lib/social-exchange";

export interface FeedbackState {
  error: string | null;
}

export async function submitFeedback(
  exchangeId: string,
  _previous: FeedbackState,
  formData: FormData
): Promise<FeedbackState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/social-exchange/${exchangeId}/feedback`);
  }

  const value = parseValue(formData.get("value_to_exchanger"), "Value to you");

  if (value.error) {
    return { error: value.error };
  }

  if (value.value === null) {
    return { error: "Please rate the value of this exchange to you, from 0 to 10." };
  }

  const comments = String(formData.get("exchanger_comments") ?? "").trim();

  // RLS limits this to the exchange's Exchanger, and the column grant to the feedback fields.
  const { data, error } = await supabase
    .from("social_exchanges")
    .update({
      value_to_exchanger: value.value,
      exchanger_comments: comments || null,
      exchanger_responded_at: new Date().toISOString(),
    })
    .eq("id", exchangeId)
    .select("id");

  if (error) {
    return { error: `Couldn't save your feedback: ${error.message}` };
  }

  if (!data?.length) {
    return { error: "Only the person who gave this exchange can add feedback." };
  }

  revalidatePath("/social-exchange");
  redirect("/social-exchange?notice=feedback");
}
