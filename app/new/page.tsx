"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // 1. Import useRouter
import { supabase } from "@/lib/supabase";

const goals = [
  "AI Learning",
  "Connections",
  "Paid Work",
  "Workspace",
  "Freelance Growth",
];

export default function NewEntryPage() {
  const router = useRouter(); // 2. Initialize the router instance
  const [goal, setGoal] = useState(goals[0]);
  const [score, setScore] = useState(5);
  const [achievements, setAchievements] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("updates").insert({
      goal,
      score,
      achievements,
      notes,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Saved successfully!");

      setGoal(goals[0]);
      setScore(5);
      setAchievements("");
      setNotes("");
      
      // Optional: Automatically redirect back to home after successful save
      setTimeout(() => {
        router.push("/");
      }, 1000);
    }

    setLoading(false);
  }

  return (
    <main className="max-w-xl mx-auto p-8">
      {/* 3. The Back Button */}
      <button
        onClick={() => router.push("/")}
        className="flex items-center text-sm text-gray-500 hover:text-black mb-6 transition gap-1 group"
      >
        <span className="transform group-hover:-translate-x-0.5 transition-transform">←</span> 
        Back to Dashboard
      </button>

      <h1 className="text-3xl font-bold mb-6">
        Monthly Goal Check-In
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div>
          <label className="block mb-2 font-medium">
            Goal
          </label>

          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full border rounded p-2"
          >
            {goals.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Score (1–10)
          </label>

          <input
            type="number"
            min={1}
            max={10}
            value={score}
            onChange={(e) =>
              setScore(Number(e.target.value))
            }
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            What did you do this month?
          </label>

          <textarea
            value={achievements}
            onChange={(e) =>
              setAchievements(e.target.value)
            }
            rows={4}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Notes
          </label>

          <textarea
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value)
            }
            rows={4}
            className="w-full border rounded p-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
        >
          {loading ? "Saving..." : "Save Entry"}
        </button>

        {message && (
          <p className="mt-4 font-medium text-sm text-green-600">
            {message}
          </p>
        )}
      </form>
    </main>
  );
}