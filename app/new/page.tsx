"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SignOutButton from "@/app/ui/sign-out-button";

interface GoalItem {
  id: string;
  name: string;
  archived_at: string | null;
}

function isMissingUserIdColumnError(message: string) {
  return message.includes("column updates.user_id does not exist");
}

export default function NewEntryPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [goalId, setGoalId] = useState("");
  const [score, setScore] = useState(5);
  const [achievements, setAchievements] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadUserAndGoals() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      const { data: goalRows, error: goalError } = await supabase
        .from("goals")
        .select("id, name, archived_at")
        .eq("user_id", user.id)
        .is("archived_at", null)
        .order("created_at", { ascending: true });

      if (goalError) {
        setMessage(`Error loading goals: ${goalError.message}`);
        return;
      }

      const activeGoals = goalRows ?? [];
      setGoals(activeGoals);
      setGoalId((currentGoalId) => currentGoalId || activeGoals[0]?.id || "");
    }

    loadUserAndGoals();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    if (!userId) {
      setMessage("Error: You must be signed in to save an update.");
      setLoading(false);
      return;
    }

    if (!goalId) {
      setMessage("Error: Create at least one active goal in My goals before adding an update.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("updates").insert({
      user_id: userId,
      goal_id: goalId,
      score,
      achievements,
      notes,
    });

    if (error) {
      if (isMissingUserIdColumnError(error.message)) {
        setMessage("Your Supabase database still needs the updates.user_id column. Run supabase_auth_setup.sql in the Supabase SQL editor, then try again.");
      } else {
        setMessage(`Error: ${error.message}`);
      }
    } else {
      setMessage("Saved successfully!");

      setScore(5);
      setAchievements("");
      setNotes("");

      setTimeout(() => {
        router.push("/");
      }, 1000);
    }

    setLoading(false);
  }

  const selectedGoal = useMemo(() => goals.find((item) => item.id === goalId), [goals, goalId]);

  return (
    <main className="max-w-xl mx-auto p-8">
      <div className="flex justify-end mb-4 gap-3">
        <button
          type="button"
          onClick={() => router.push("/goals")}
          className="border border-gray-300 px-3 py-2 rounded hover:bg-gray-100 transition"
        >
          My goals
        </button>
        <SignOutButton />
      </div>

      <button
        onClick={() => router.push("/")}
        className="flex items-center text-sm text-gray-500 hover:text-black mb-6 transition gap-1 group"
      >
        <span className="transform group-hover:-translate-x-0.5 transition-transform">←</span>
        Back to Dashboard
      </button>

      <h1 className="text-3xl font-bold mb-6">Monthly Goal Check-In</h1>

      {goals.length === 0 ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <p className="font-semibold">You do not have any active goals yet.</p>
          <p className="text-sm mt-1">
            Add up to 8 goals from <button type="button" onClick={() => router.push("/goals")} className="underline">My goals</button> before creating an update.
          </p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 font-medium">Goal</label>

          <select
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            className="w-full border rounded p-2"
            disabled={goals.length === 0}
          >
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          {selectedGoal ? <p className="text-xs text-gray-500 mt-2">Selected goal: {selectedGoal.name}</p> : null}
        </div>

        <div>
          <label className="block mb-2 font-medium">Score (1–10)</label>

          <input
            type="number"
            min={1}
            max={10}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">What did you do this month?</label>

          <textarea
            value={achievements}
            onChange={(e) => setAchievements(e.target.value)}
            rows={4}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Notes</label>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full border rounded p-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading || goals.length === 0}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Entry"}
        </button>

        {message && (
          <p className={`mt-4 font-medium text-sm ${message.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
            {message}
          </p>
        )}
      </form>
    </main>
  );
}