"use client";

import { deleteExchange } from "./actions";

export default function DeleteExchangeButton({ exchangeId }: { exchangeId: string }) {
  return (
    <form
      action={deleteExchange.bind(null, exchangeId)}
      onSubmit={(event) => {
        if (!window.confirm("Delete this Social Exchange? Any feedback already given will be lost too. This can't be undone.")) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded border border-red-300 px-4 py-2 text-sm text-red-200 hover:bg-red-500/20 transition"
      >
        Delete this exchange
      </button>
    </form>
  );
}
