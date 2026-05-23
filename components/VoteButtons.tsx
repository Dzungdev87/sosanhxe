"use client";

import { useMemo, useState } from "react";

type VoteState = {
  a: number;
  b: number;
};

export default function VoteButtons({
  carAId,
  carBId,
  carAName,
  carBName,
  initialVotes
}: {
  carAId: string;
  carBId: string;
  carAName: string;
  carBName: string;
  initialVotes: VoteState;
}) {
  const [votes, setVotes] = useState(initialVotes);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<"A" | "B" | null>(null);

  const total = votes.a + votes.b;
  const percentA = useMemo(() => (total ? Math.round((votes.a / total) * 100) : 50), [votes.a, total]);
  const percentB = 100 - percentA;

  async function vote(side: "A" | "B") {
    setLoading(side);
    setMessage("");

    const response = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ carA: carAId, carB: carBId, vote: side })
    });

    const data = await response.json();
    setLoading(null);

    if (!response.ok) {
      setMessage(data.error ?? "Bình chọn thất bại");
      return;
    }

    setVotes(data.votes);
    setMessage("Đã ghi nhận bình chọn.");
  }

  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h2 className="text-xl font-bold text-ink">Bạn chọn xe nào?</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => vote("A")} disabled={loading !== null} className="rounded-md border border-line px-4 py-3 text-sm font-semibold hover:border-good disabled:opacity-60">
          Chọn {carAName}
        </button>
        <button type="button" onClick={() => vote("B")} disabled={loading !== null} className="rounded-md border border-line px-4 py-3 text-sm font-semibold hover:border-good disabled:opacity-60">
          Chọn {carBName}
        </button>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-surface">
        <div className="h-full bg-good" style={{ width: `${percentA}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-sm text-muted">
        <span>
          {carAName}: {percentA}%
        </span>
        <span>
          {carBName}: {percentB}%
        </span>
      </div>
      {message ? <p className="mt-3 text-sm text-muted">{message}</p> : null}
    </section>
  );
}
