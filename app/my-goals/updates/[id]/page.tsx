import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

interface UpdateDetail {
  id: string;
  goal: string | null;
  score: number;
  created_at: string;
  achievements: string | null;
  notes: string | null;
  goals: { name: string } | null;
}

function scoreColorClass(score: number) {
  if (score <= 4) {
    return "bg-red-50 border-red-200 text-red-950";
  }

  if (score <= 7) {
    return "bg-orange-50 border-orange-200 text-orange-950";
  }

  return "bg-green-50 border-green-200 text-green-950";
}

export default async function UpdateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/my-goals/updates/${id}`);
  }

  const { data } = await supabase
    .from("updates")
    .select("id, goal, score, created_at, achievements, notes, goals(name)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const update = data as unknown as UpdateDetail | null;

  if (!update) {
    notFound();
  }

  const goalName = update.goals?.name ?? update.goal?.trim() ?? "Unassigned";

  return (
    <main id="main-content" className="max-w-2xl mx-auto p-8" tabIndex={-1}>
      <header className="mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{goalName}</h1>
        <Link href="/my-goals" className="text-sm underline text-white/80">
          Back to My Studio goals
        </Link>
      </header>

      <section className={`border rounded-xl p-6 space-y-4 ${scoreColorClass(update.score)}`}>
        <div className="flex justify-between items-start gap-3 flex-wrap">
          <div className="text-sm font-medium text-gray-600">
            Posted{" "}
            {new Date(update.created_at).toLocaleDateString("en-GB", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <div className="flex items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded-md border border-inherit">
            <span className="text-xs text-gray-500 font-medium">Progress score:</span>
            <span className="text-lg font-black">{update.score}/10</span>
          </div>
        </div>

        {update.achievements && (
          <div>
            <h2 className="text-sm font-semibold opacity-85 mb-1">What I did this month</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line opacity-95">{update.achievements}</p>
          </div>
        )}

        {update.notes && (
          <div className="pt-2 border-t border-black/5">
            <h2 className="text-sm font-semibold opacity-85 mb-1">Notes</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line opacity-95">{update.notes}</p>
          </div>
        )}
      </section>
    </main>
  );
}
