"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setIsError(false);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setIsError(true);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
    setLoading(false);
  }

  async function handleSignUp() {
    setLoading(true);
    setMessage("");
    setIsError(false);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setIsError(true);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Account created. You can now sign in.");
    setLoading(false);
  }

  return (
    <main id="main-content" className="max-w-md mx-auto p-8" tabIndex={-1}>
      <h1 className="text-3xl font-bold mb-2">Sign In</h1>
      <p className="text-sm text-gray-600 mb-6">
        Use your account to access your own progress updates.
      </p>

      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label htmlFor="email-input" className="block mb-2 font-medium">Email</label>
          <input
            id="email-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label htmlFor="password-input" className="block mb-2 font-medium">Password</label>
          <input
            id="password-input"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition disabled:opacity-60"
        >
          {loading ? "Working..." : "Sign In"}
        </button>
      </form>

      <button
        type="button"
        onClick={handleSignUp}
        disabled={loading || !email || !password}
        className="w-full mt-3 border border-black px-4 py-2 rounded hover:bg-gray-100 transition disabled:opacity-60"
      >
        Create Initial User
      </button>

      {message && (
        <p className={`mt-4 text-sm ${isError ? "text-red-600" : "text-green-700"}`}>
          {message}
        </p>
      )}
    </main>
  );
}
