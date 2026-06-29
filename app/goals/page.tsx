"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SignOutButton from "@/app/ui/sign-out-button";
import SiteMenu from "@/app/ui/site-menu";

interface GoalRow {
  id: string;
  name: string;
  archived_at: string | null;
  created_at: string;
}

function activeCount(goals: GoalRow[]) {
  return goals.filter((goal) => !goal.archived_at).length;
}

export default function GoalsPage() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [userId, setUserId] = useState<string | null>(null);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadGoals() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("goals")
        .select("id, name, archived_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        setMessage(`Error loading goals: ${error.message}`);
      } else {
        setGoals(data ?? []);
      }

      setLoading(false);
    }

    loadGoals();
  }, [router]);

  async function refreshGoals() {
    if (!userId) {
      return;
    }

    const { data } = await supabase
      .from("goals")
      .select("id, name, archived_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    setGoals(data ?? []);
  }

  async function addGoal() {
    if (!userId || !newGoal.trim()) {
      return;
    }

    if (activeCount(goals) >= 8) {
      setMessage("You can only have up to 8 active goals.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("goals").insert({
      user_id: userId,
      name: newGoal.trim(),
    });

    if (error) {
      setMessage(`Error adding goal: ${error.message}`);
    } else {
      setNewGoal("");
      await refreshGoals();
    }

    setSaving(false);
  }

  async function saveGoalName(goalId: string, name: string) {
    if (!userId) {
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setMessage("Goal name cannot be empty.");
      return;
    }

    const { error } = await supabase
      .from("goals")
      .update({ name: trimmedName })
      .eq("id", goalId)
      .eq("user_id", userId);

    if (error) {
      setMessage(`Error updating goal: ${error.message}`);
      return;
    }

    await refreshGoals();
  }

  async function archiveGoal(goalId: string) {
    if (!userId) {
      return;
    }

    const { error } = await supabase
      .from("goals")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", goalId)
      .eq("user_id", userId);

    if (error) {
      setMessage(`Error removing goal: ${error.message}`);
      return;
    }

    await refreshGoals();
  }

  async function restoreGoal(goalId: string) {
    if (!userId) {
      return;
    }

    if (activeCount(goals) >= 8) {
      setMessage("You can only have up to 8 active goals.");
      return;
    }

    const { error } = await supabase
      .from("goals")
      .update({ archived_at: null })
      .eq("id", goalId)
      .eq("user_id", userId);

    if (error) {
      setMessage(`Error restoring goal: ${error.message}`);
      return;
    }

    await refreshGoals();
  }

  const activeGoals = useMemo(() => goals.filter((goal) => !goal.archived_at), [goals]);
  const archivedGoals = useMemo(() => goals.filter((goal) => goal.archived_at), [goals]);

  if (loading) {
    return <main className="max-w-3xl mx-auto p-8">Loading goals...</main>;
  }

  return (
    <main id="main-content" className="max-w-3xl mx-auto p-8 space-y-6" tabIndex={-1}>
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mt-2">My goals</h1>
          <p className="text-sm text-gray-600 mt-1">
            Set up to 8 active goals. Removing a goal archives it, so existing updates keep their history.
          </p>
        </div>

        <SiteMenu
          label="Open main navigation menu"
          items={[
            { href: "/", label: "Dashboard" },
            { href: "/goals", label: "My goals" },
            { href: "/new", label: "Add Monthly Update" },
            { href: `/progress/${currentYear}`, label: `Progress graph (${currentYear})` },
          ]}
        >
          <SignOutButton className="w-full text-left rounded px-3 py-2 text-sm text-gray-800 hover:bg-gray-100" />
        </SiteMenu>
      </header>

      <section className="rounded-xl border bg-[darkblue] p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold">Active goals</h2>
            <p className="text-sm text-gray-500">{activeGoals.length}/8 active</p>
          </div>
          <button
            type="button"
            onClick={addGoal}
            disabled={saving || activeCount(goals) >= 8}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition disabled:opacity-60"
          >
            {saving ? "Adding..." : "Add goal"}
          </button>
        </div>

        <div className="flex gap-3 flex-col sm:flex-row">
          <label htmlFor="new-goal-input" className="sr-only">New goal name</label>
          <input
            id="new-goal-input"
            aria-label="New goal name"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            placeholder="e.g. Client outreach"
            className="flex-1 border rounded px-3 py-2"
            maxLength={80}
            disabled={activeCount(goals) >= 8}
          />
        </div>

        <div className="space-y-3">
          {activeGoals.map((goal) => (
            <div key={goal.id} className="flex items-center gap-3 rounded-lg border p-3">
              <input
                aria-label={`Goal name for ${goal.name}`}
                value={goal.name}
                onChange={(e) =>
                  setGoals((current) =>
                    current.map((item) => (item.id === goal.id ? { ...item, name: e.target.value } : item))
                  )
                }
                onBlur={(e) => saveGoalName(goal.id, e.target.value)}
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                type="button"
                onClick={() => archiveGoal(goal.id)}
                className="border border-red-300 text-red-700 px-3 py-2 rounded hover:bg-red-50 transition"
              >
                Remove
              </button>
            </div>
          ))}

          {activeGoals.length === 0 ? <p className="text-sm text-gray-500">No active goals yet.</p> : null}
        </div>
      </section>

      <section className="rounded-xl border bg-[darkblue] p-5 space-y-4">
        <h2 className="text-xl font-semibold">Archived goals</h2>
        <div className="space-y-3">
          {archivedGoals.map((goal) => (
            <div key={goal.id} className="flex items-center justify-between gap-3 rounded-lg border border-dashed p-3 text-gray-500">
              <span>{goal.name}</span>
              <button
                type="button"
                onClick={() => restoreGoal(goal.id)}
                className="border border-gray-300 px-3 py-2 rounded hover:bg-gray-100 transition"
              >
                Restore
              </button>
            </div>
          ))}

          {archivedGoals.length === 0 ? <p className="text-sm text-gray-500">No archived goals.</p> : null}
        </div>
      </section>

      {message ? <p className="text-sm text-red-600">{message}</p> : null}
    </main>
  );
}