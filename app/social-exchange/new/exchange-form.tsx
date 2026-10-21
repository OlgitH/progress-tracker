"use client";

import { useActionState } from "react";
import { logExchange, type LogExchangeState } from "./actions";

interface ExchangeFormProps {
  members: Array<{ id: string; full_name: string }>;
  today: string;
}

const initialState: LogExchangeState = { error: null };

const fieldClass =
  "w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400";

export default function ExchangeForm({ members, today }: ExchangeFormProps) {
  const [state, formAction, pending] = useActionState(logExchange, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="exchanger_id" className="block text-sm font-medium mb-1">
          Who helped you?
        </label>
        <select id="exchanger_id" name="exchanger_id" required defaultValue="" className={fieldClass}>
          <option value="" disabled>
            Choose a member
          </option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.full_name}
            </option>
          ))}
        </select>
        <p className="text-xs text-white/70 mt-1">We&apos;ll message them on Slack to add their side of the exchange.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="hours" className="block text-sm font-medium mb-1">
            Time they gave (hours)
          </label>
          <input
            id="hours"
            name="hours"
            type="number"
            inputMode="decimal"
            min="0.25"
            max="200"
            step="0.25"
            required
            placeholder="e.g. 1.5"
            className={fieldClass}
          />
          <p className="text-xs text-white/70 mt-1">
            Please include prep time in the hours you record. Ongoing work should be recorded separately.
          </p>
        </div>
        <div>
          <label htmlFor="exchanged_on" className="block text-sm font-medium mb-1">
            Date
          </label>
          <input
            id="exchanged_on"
            name="exchanged_on"
            type="date"
            required
            defaultValue={today}
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          What did they help you with?
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          maxLength={2000}
          placeholder="Advice, training, lending equipment, mentoring…"
          className={fieldClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="value_to_exchangee" className="block text-sm font-medium mb-1">
            Value to you (0–10, optional)
          </label>
          <input id="value_to_exchangee" name="value_to_exchangee" type="number" min="0" max="10" step="1" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="social_value" className="block text-sm font-medium mb-1">
            Social value (0–10, optional)
          </label>
          <input id="social_value" name="social_value" type="number" min="0" max="10" step="1" className={fieldClass} />
          <p className="text-xs text-white/70 mt-1">How does it benefit the Studio and wider creative community?</p>
        </div>
      </div>

      <div>
        <label htmlFor="comments" className="block text-sm font-medium mb-1">
          Anything else? (optional)
        </label>
        <textarea id="comments" name="comments" rows={2} className={fieldClass} />
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
        {pending ? "Saving…" : "Log Social Exchange"}
      </button>
    </form>
  );
}
