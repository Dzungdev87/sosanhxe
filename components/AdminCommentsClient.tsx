"use client";

import type { Comment, CommentStatus } from "@prisma/client";
import { useState } from "react";

type AdminComment = Omit<Comment, "createdAt" | "updatedAt"> & {
  createdAt: string | Date;
  updatedAt: string | Date;
};

const statusLabels: Record<CommentStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối"
};

export default function AdminCommentsClient({ initialComments }: { initialComments: AdminComment[] }) {
  const [comments, setComments] = useState(initialComments);
  const [message, setMessage] = useState("");

  async function updateStatus(id: string, status: CommentStatus) {
    setMessage("");
    const response = await fetch(`/api/admin/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? "Không thể cập nhật comment");
      return;
    }

    setComments((current) => current.map((comment) => (comment.id === id ? data.comment : comment)));
    setMessage("Đã cập nhật comment.");
  }

  async function deleteComment(id: string) {
    if (!window.confirm("Xoá comment này?")) return;

    setMessage("");
    const response = await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? "Không thể xoá comment");
      return;
    }

    setComments((current) => current.filter((comment) => comment.id !== id));
    setMessage("Đã xoá comment.");
  }

  return (
    <div>
      {message ? <div className="mb-4 rounded-md bg-surface px-3 py-2 text-sm text-muted">{message}</div> : null}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <article key={comment.id} className="rounded-lg border border-line bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-ink">{comment.displayName}</h2>
                    <span className="rounded-full bg-surface px-2 py-1 text-xs font-semibold text-muted">{statusLabels[comment.status]}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Target: {comment.targetType}/{comment.targetId} - {new Date(comment.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => updateStatus(comment.id, "APPROVED")} className="rounded-md border border-green-200 px-3 py-2 text-xs font-semibold text-good hover:bg-green-50">
                    Duyệt
                  </button>
                  <button type="button" onClick={() => updateStatus(comment.id, "REJECTED")} className="rounded-md border border-yellow-200 px-3 py-2 text-xs font-semibold text-yellow-700 hover:bg-yellow-50">
                    Từ chối
                  </button>
                  <button type="button" onClick={() => deleteComment(comment.id)} className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">
                    Xoá
                  </button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line rounded-md bg-surface p-3 text-sm leading-6 text-ink">{comment.content}</p>
            </article>
          ))
        ) : (
          <p className="rounded-lg border border-line bg-white p-6 text-center text-sm text-muted">Chưa có comment nào.</p>
        )}
      </div>
    </div>
  );
}
