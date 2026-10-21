import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { primaryButtonClass } from "@/lib/styles";

interface UpdateItem {
  id: string;
  goal_id: string | null;
  goal: string | null;
  score: number;
  created_at: string;
  achievements?: string | null;
  notes?: string | null;
}

interface GoalItem {
  id: string;
  name: string;
  archived_at: string | null;
}

interface GoalSection {
  key: string;
  label: string;
  archivedAt: string | null;
  updates: UpdateItem[];
  legacy: boolean;
}

function isMissingGoalsSetupError(message: string) {
  return (
    message.includes('relation "goals" does not exist') ||
    message.includes("column updates.goal_id does not exist")
  );
}

function isMissingUserSetupError(message: string) {
  return message.includes("column updates.user_id does not exist");
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

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const currentYear = new Date().getFullYear();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [goalsResult, updatesResult] = await Promise.all([
    supabase
      .from("goals")
      .select("id, name, archived_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("updates")
      .select("id, goal_id, goal, score, created_at, achievements, notes")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (goalsResult.error) {
    if (isMissingGoalsSetupError(goalsResult.error.message)) {
      return (
        <main className="max-w-3xl mx-auto p-8 space-y-4">
          <h1 className="text-xl md:text-2xl font-bold">My Studio</h1>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950 space-y-3">
            <h2 className="text-xl font-semibold">Goals table still needs to be created</h2>
            <p>
              Your auth flow is working, but the goals table and the updates.goal_id reference still need to be added in Supabase.
            </p>
            <p className="text-sm">
              Run <Link href="/supabase_goals_setup.sql" className="underline">supabase_goals_setup.sql</Link> in the Supabase editor, then reload the app.
            </p>
          </div>
        </main>
      );
    }

    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold mb-4">My Studio</h1>
        <p className="text-red-500">Error loading goals: {goalsResult.error.message}</p>
      </main>
    );
  }

  if (updatesResult.error) {
    if (isMissingUserSetupError(updatesResult.error.message) || isMissingGoalsSetupError(updatesResult.error.message)) {
      return (
        <main className="max-w-3xl mx-auto p-8 space-y-4">
          <h1 className="text-3xl font-bold">My Studio</h1>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950 space-y-3">
            <h2 className="text-xl font-semibold">Supabase schema still needs the user-owned updates fields</h2>
            <p>
              Your auth flow is working, but the updates table still needs the ownership and goal reference columns.
            </p>
            <p className="text-sm">
              Run the setup scripts in the project root and reload the app.
            </p>
          </div>
        </main>
      );
    }

    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold mb-4">My Studio</h1>
        <p className="text-red-500">Error loading data: {updatesResult.error.message}</p>
      </main>
    );
  }

  const goals = (goalsResult.data ?? []) as GoalItem[];
  const updates = (updatesResult.data ?? []) as UpdateItem[];
  const goalMap = new Map(goals.map((goal) => [goal.id, goal]));
  const sectionMap = new Map<string, GoalSection>();

  for (const goal of goals) {
    sectionMap.set(goal.id, {
      key: goal.id,
      label: goal.name,
      archivedAt: goal.archived_at,
      updates: [],
      legacy: false,
    });
  }

  for (const update of updates) {
    const goal = update.goal_id ? goalMap.get(update.goal_id) : null;

    if (goal) {
      const section = sectionMap.get(goal.id);
      if (section) {
        section.updates.push(update);
      }
      continue;
    }

    const label = update.goal?.trim() || "Unassigned";
    const existingSection = sectionMap.get(label);

    if (existingSection && existingSection.legacy) {
      existingSection.updates.push(update);
      continue;
    }

    sectionMap.set(label, {
      key: label,
      label,
      archivedAt: null,
      updates: [update],
      legacy: true,
    });
  }

  const sections = [...sectionMap.values()]
    .filter((section) => !section.archivedAt)
    .sort((left, right) => {
      if (left.legacy !== right.legacy) {
        return left.legacy ? 1 : -1;
      }

      return left.label.localeCompare(right.label);
    });

  return (
    <main id="main-content" className="max-w-6xl mx-auto p-8" tabIndex={-1}>
      <header className="flex justify-between items-center mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">My Studio goals</h1>
          <p className="text-sm text-white mt-2 max-w-md">
            Here you can create up to 10 goals that you aim to achieve from working at The Studio. Try to use SMART goals (Specific, Measurable, Achievable, Relevant and Time-bound). Every month you should try to post an update on your goals when you have done something towards them. This is to help you and us gain a clearer picture of the value you are getting from the Studio.
          </p>
        </div>
      </header>

      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href="/my-goals/edit"
          className={primaryButtonClass}
        >
          Edit goals
        </Link>
        <Link
          href={`/my-goals/progress/${currentYear}`}
          className="inline-flex items-center justify-center rounded border border-white/40 px-4 py-2 hover:bg-white/10 transition"
        >
          Progress graph ({currentYear})
        </Link>
      </div>

      {goals.length === 0 && updates.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-600">
          <p className="font-medium mb-2">No goals yet.</p>
          <p className="mb-4">Create your first goals before adding monthly updates.</p>
          <Link
            href="/my-goals/edit"
            className={primaryButtonClass}
          >
            Set up goals
          </Link>
        </div>
      )}

      <div className="grid gap-8">
        {sections.map((section) => (
          <section key={section.key} className="border rounded-xl p-6 shadow-sm bg-[darkblue]">
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <h2 className="text-2xl font-bold tracking-tight">{section.label}</h2>
              {!section.legacy && (
                <Link
                  href={`/my-goals/updates/new?goal=${section.key}`}
                  className="ml-auto inline-flex items-center justify-center rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-800 transition"
                >
                  Post an update
                </Link>
              )}
            </div>

            {section.updates.length === 0 ? (
              <p className="text-sm text-gray-500">No updates</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {section.updates.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/my-goals/updates/${item.id}`}
                      aria-label={`Update posted ${new Date(item.created_at).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}, progress score ${item.score} out of 10`}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium hover:opacity-80 transition ${scoreColorClass(item.score)}`}
                    >
                      <span className="font-semibold">Update</span>
                      <span>
                        {new Date(item.created_at).toLocaleDateString("en-GB", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}