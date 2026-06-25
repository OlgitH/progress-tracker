"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const slackProvider = "slack_oidc" as const;
const slackTeamId =
  process.env.NEXT_PUBLIC_SLACK_TEAM_ID?.trim() ||
  process.env.NEXT_PUBLIC_TEAM_ID?.trim();
const slackWorkspaceUrl = process.env.NEXT_PUBLIC_SLACK_WORKSPACE_URL?.trim();
const slackWorkspaceDomain = process.env.NEXT_PUBLIC_SLACK_WORKSPACE_DOMAIN?.trim();

function extractSlackWorkspaceDomain(input?: string) {
  if (!input) {
    return "";
  }

  const value = input.trim();

  if (!value) {
    return "";
  }

  // Accept either full URL (https://workspace.slack.com) or a raw workspace slug.
  const fromUrl = /^https?:\/\/([a-z0-9-]+)\.slack\.com\/?$/i.exec(value);
  if (fromUrl?.[1]) {
    return fromUrl[1].toLowerCase();
  }

  const rawSlug = /^[a-z0-9-]+$/i.exec(value);
  if (rawSlug?.[0]) {
    return rawSlug[0].toLowerCase();
  }

  return "";
}

const slackWorkspaceHintDomain =
  extractSlackWorkspaceDomain(slackWorkspaceDomain) ||
  extractSlackWorkspaceDomain(slackWorkspaceUrl);

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const callbackError = useMemo(() => {
    const errorDescription = searchParams.get("error_description");
    const error = searchParams.get("error");
    return errorDescription || error || "";
  }, [searchParams]);

  async function startSlackOAuth() {
    if (!slackTeamId && !slackWorkspaceHintDomain) {
      return "Missing NEXT_PUBLIC_SLACK_TEAM_ID (or NEXT_PUBLIC_TEAM_ID) in environment.";
    }

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    const nextPath = searchParams.get("next");

    if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
      callbackUrl.searchParams.set("next", nextPath);
    }

    const queryParams: Record<string, string> = {};

    if (slackTeamId) {
      queryParams.team = slackTeamId;
    }

    if (slackWorkspaceHintDomain) {
      // Additional hint for workspace routing when Slack asks for workspace discovery.
      queryParams.domain = slackWorkspaceHintDomain;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: slackProvider,
      options: {
        redirectTo: callbackUrl.toString(),
        scopes: "openid profile email",
        queryParams,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      return error.message;
    }

    if (!data?.url) {
      return "Slack sign-in could not be started. Missing redirect URL.";
    }

    const authUrl = new URL(data.url);

    // Keep team hint enforced to avoid Slack asking for workspace URL.
    if (slackTeamId && !authUrl.searchParams.get("team")) {
      authUrl.searchParams.set("team", slackTeamId);
    }

    if (slackWorkspaceHintDomain && !authUrl.searchParams.get("domain")) {
      authUrl.searchParams.set("domain", slackWorkspaceHintDomain);
    }

    window.location.assign(authUrl.toString());
    return null;
  }

  async function handleSignInWithSlack() {
    setLoading(true);
    setMessage("");
    setIsError(false);

    // Clear any existing app session so the next redirect starts a fresh auth flow.
    await supabase.auth.signOut({ scope: "global" });

    const oauthError = await startSlackOAuth();

    if (oauthError) {
      setIsError(true);
      setMessage(oauthError);
      setLoading(false);
      return;
    }
  }

  return (
    <main id="main-content" className="max-w-md mx-auto p-8" tabIndex={-1}>
      <h1 className="text-3xl font-bold mb-2">Sign In With Slack</h1>
      <p className="text-sm text-gray-600 mb-6">
        Sign in with your individual Slack account. Access is limited to members of your Slack workspace.
      </p>

      <button
        type="button"
        onClick={handleSignInWithSlack}
        disabled={loading}
        className="w-full bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition disabled:opacity-60"
      >
        {loading ? "Redirecting..." : "Continue With Slack"}
      </button>

      {callbackError ? (
        <p className="mt-4 text-sm text-red-600">{decodeURIComponent(callbackError)}</p>
      ) : null}

      {message && (
        <p className={`mt-4 text-sm ${isError ? "text-red-600" : "text-green-700"}`}>
          {message}
        </p>
      )}
    </main>
  );
}
