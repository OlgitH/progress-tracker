import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import SignOutButton from "@/app/ui/sign-out-button";

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
          <h1 className="text-3xl font-bold">Studio Progress Tracker</h1>
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
        <h1 className="text-3xl font-bold mb-4">Studio Progress Tracker</h1>
        <p className="text-red-500">Error loading goals: {goalsResult.error.message}</p>
      </main>
    );
  }

  if (updatesResult.error) {
    if (isMissingUserSetupError(updatesResult.error.message) || isMissingGoalsSetupError(updatesResult.error.message)) {
      return (
        <main className="max-w-3xl mx-auto p-8 space-y-4">
          <h1 className="text-3xl font-bold">Studio Progress Tracker</h1>
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
        <h1 className="text-3xl font-bold mb-4">Studio Progress Tracker</h1>
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

  const sections = [...sectionMap.values()].sort((left, right) => {
    if (left.legacy !== right.legacy) {
      return left.legacy ? 1 : -1;
    }

    if (left.archivedAt && !right.archivedAt) {
      return 1;
    }

    if (!left.archivedAt && right.archivedAt) {
      return -1;
    }

    return left.label.localeCompare(right.label);
  });

  return (
    <main className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold">Studio Progress Tracker</h1>
          <p className="text-sm text-gray-500 mt-1 hidden sm:block">{user.email}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/goals"
            className="border border-black px-4 py-2 rounded hover:bg-gray-100 transition"
          >
            My goals
          </Link>
          <Link
            href={`/progress/${currentYear}`}
            className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-100 transition"
          >
            Export {currentYear}
          </Link>
          <SignOutButton />
          <Link
            href="/new"
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Add Monthly Update
          </Link>
        </div>
      </div>

      {goals.length === 0 && updates.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-600">
          <p className="font-medium mb-2">No goals yet.</p>
          <p className="mb-4">Create your first goals before adding monthly updates.</p>
          <Link
            href="/goals"
            className="inline-flex items-center justify-center rounded bg-black px-4 py-2 text-white hover:bg-gray-800 transition"
          >
            Set up goals
          </Link>
        </div>
      )}

      <div className="grid gap-8">
        {sections.map((section) => (
          <section key={section.key} className="border rounded-xl p-6 shadow-sm bg-white">
            <div className="flex items-center gap-3 mb-6 border-b pb-4 flex-wrap">
              <h2 className="text-2xl font-bold tracking-tight">{section.label}</h2>
              {section.archivedAt && !section.legacy && (
                <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  Archived
                </span>
              )}
              <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {section.updates.length} {section.updates.length === 1 ? "update" : "updates"}
              </span>
            </div>

            {section.updates.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-5 text-sm text-gray-500">
                No updates yet for this goal.
              </div>
            ) : (
              <div className="grid gap-4 pl-4 border-l-2 border-gray-100">
                {section.updates.map((item) => (
                  <div key={item.id} className={`border rounded-lg p-5 ${scoreColorClass(item.score)}`}>
                    <div className="flex justify-between items-start mb-3 gap-3 flex-wrap">
                      <div className="text-sm font-medium text-gray-600">
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-inherit shadow-2xs">
                        <span className="text-xs text-gray-500 font-medium">Score:</span>
                        <span className="text-lg font-black">{item.score}/10</span>
                      </div>
                    </div>

                    {item.achievements && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold opacity-85 mb-1">What I did this month</h4>
                        <p className="text-sm leading-relaxed whitespace-pre-line opacity-95">{item.achievements}</p>
                      </div>
                    )}

                    {item.notes && (
                      <div className="mt-2 pt-2 border-t border-black/5">
                        <h4 className="text-sm font-semibold opacity-85 mb-1">Notes</h4>
                        <p className="text-sm leading-relaxed whitespace-pre-line opacity-95">{item.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}