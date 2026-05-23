"use client";

import { useState } from "react";

type PublicComment = {
  id: string;
  displayName: string;
  content: string;
  createdAt: string | Date;
};

export default function CommentsSection({
  targetId,
  initialComments
}: {
  targetId: string;
  initialComments: PublicComment[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [displayName, setDisplayName] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: "comparison",
        targetId,
        displayName,
        content
      })
    });
    const data = await response.json().catch(() => ({}));
    setSubmitting(false);

    if (!response.ok) {
      setMessage(data.error ?? "Không thể gửi comment");
      return;
    }

    setDisplayName("");
    setContent("");
    setMessage(data.message ?? "Đã gửi comment.");

    if (data.approved && data.comment) {
      setComments((current) => [data.comment, ...current]);
    }
  }

  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-ink">Ý kiến người dùng</h2>
        <p className="mt-1 text-sm text-muted">
          Comment đầu tiên cần admin duyệt. Sau khi IP của bạn đã được duyệt, các comment sau sẽ tự hiển thị.
        </p>
      </div>

      <form onSubmit={submit} className="mb-6 grid gap-3">
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Tên hiển thị"
          className="rounded-md border border-line px-3 py-3 text-sm outline-none focus:border-good"
          maxLength={60}
          required
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Chia sẻ nhận xét của bạn về cặp xe này"
          className="min-h-28 rounded-md border border-line px-3 py-3 text-sm outline-none focus:border-good"
          maxLength={1200}
          required
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="submit" disabled={submitting} className="rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
            Gửi comment
          </button>
          {message ? <p className="text-sm text-muted">{message}</p> : null}
        </div>
      </form>

      <div className="space-y-3">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <article key={comment.id} className="rounded-md border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-ink">{comment.displayName}</h3>
                <time className="text-xs text-muted">{new Date(comment.createdAt).toLocaleDateString("vi-VN")}</time>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink">{comment.content}</p>
            </article>
          ))
        ) : (
          <p className="rounded-md bg-surface p-4 text-sm text-muted">Chưa có ý kiến nào được duyệt.</p>
        )}
      </div>
    </section>
  );
}
