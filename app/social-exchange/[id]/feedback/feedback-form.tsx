"use client";

import { useActionState } from "react";
import { submitFeedback, type FeedbackState } from "./actions";

const initialState: FeedbackState = { error: null };

const fieldClass =
  "w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400";

export default function FeedbackForm({ exchangeId }: { exchangeId: string }) {
  const [state, formAction, pending] = useActionState(submitFeedback.bind(null, exchangeId), initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="value_to_exchanger" className="block text-sm font-medium mb-1">
          Value to you (0–10)
        </label>
        <input
          id="value_to_exchanger"
          name="value_to_exchanger"
          type="number"
          min="0"
          max="10"
          step="1"
          required
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="exchanger_comments" className="block text-sm font-medium mb-1">
          Your comments (optional)
        </label>
        <textarea id="exchanger_comments" name="exchanger_comments" rows={3} className={fieldClass} />
      </div>

      {state.error ? (
        <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-5 py-2 text-white hover:bg-gray-800 transition disabled:opacity-60"
      >
        {pending ? "Saving…" : "Send feedback"}
      </button>
    </form>
  );
}
