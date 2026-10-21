"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getCurrentMember } from "@/lib/members";
import { parseValue } from "@/lib/social-exchange";
import { escapeSlack, sendSlackDirectMessage } from "@/lib/slack";

export interface LogExchangeState {
  error: string | null;
}

export async function logExchange(
  _previous: LogExchangeState,
  formData: FormData
): Promise<LogExchangeState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/social-exchange/new");
  }

  const exchangee = await getCurrentMember(supabase);

  if (!exchangee) {
    return { error: "We couldn't find your member profile. Try signing out and in again." };
  }

  const exchangerId = String(formData.get("exchanger_id") ?? "");
  const hours = Number(formData.get("hours"));
  const exchangedOn = String(formData.get("exchanged_on") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const comments = String(formData.get("comments") ?? "").trim();
  const value = parseValue(formData.get("value_to_exchangee"), "Value to you");
  const social = parseValue(formData.get("social_value"), "Social value");

  if (!exchangerId || exchangerId === exchangee.id) {
    return { error: "Choose the person who helped you." };
  }

  if (!Number.isFinite(hours) || hours <= 0 || hours > 200) {
    return { error: "Enter the time they gave in hours, e.g. 0.5 or 2." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(exchangedOn) || Number.isNaN(Date.parse(exchangedOn))) {
    return { error: "Enter the date of the exchange." };
  }

  if (!description || description.length > 2000) {
    return { error: "Describe what they helped with (up to 2000 characters)." };
  }

  if (value.error || social.error) {
    return { error: value.error ?? social.error };
  }

  const { data: exchange, error: insertError } = await supabase
    .from("social_exchanges")
    .insert({
      exchanger_id: exchangerId,
      exchangee_id: exchangee.id,
      hours,
      exchanged_on: exchangedOn,
      description,
      value_to_exchangee: value.value,
      social_value: social.value,
      exchangee_comments: comments || null,
    })
    .select("id")
    .single();

  if (insertError || !exchange) {
    return { error: `Couldn't save the exchange: ${insertError?.message ?? "unknown error"}` };
  }

  // The exchange is saved; a Slack problem must never lose it, so report instead of failing.
  let notice = "saved-no-slack";
  const { data: targets } = await supabase.rpc("exchange_notify_target", {
    p_exchange_id: exchange.id,
  });
  const target = targets?.[0];

  if (target) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
    const feedbackPath = `/social-exchange/${exchange.id}/feedback`;
    const result = await sendSlackDirectMessage(
      { email: target.email, slackUserId: target.slack_user_id },
      [
        `:handshake: *${escapeSlack(exchangee.full_name)}* has created a Social Exchange on My Studio. Please give feedback on the exchange from your perspective.`,
        `> ${escapeSlack(description)}`,
        `${hours} ${hours === 1 ? "hour" : "hours"} on ${exchangedOn}.`,
        siteUrl ? `Add your feedback: ${siteUrl}${feedbackPath}` : "Open My Studio > Social Exchange to add your feedback.",
      ].join("\n")
    );

    notice = result.ok ? "notified" : "saved-no-slack";
  }

  revalidatePath("/social-exchange");
  redirect(`/social-exchange?notice=${notice}`);
}
