"use client";

import { useCallback, useState } from "react";
import { toPostSlug } from "@/lib/postSlug";
import { buildPostImageUrl } from "@/lib/postImages";
import Image from "next/image";

type PostStatus = "DRAFT" | "PUBLISHED";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageKey: string | null;
  metaTitle: string;
  metaDescription: string;
  status: PostStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type DraftPost = Omit<Post, "id" | "createdAt" | "updatedAt" | "publishedAt">;

const emptyDraft: DraftPost = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImageKey: null,
  metaTitle: "",
  metaDescription: "",
  status: "DRAFT",
};

export default function AdminPostsClient({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftPost>(emptyDraft);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");

  const selectedPost = posts.find((p) => p.id === selectedId) ?? null;
  const filteredPosts = posts.filter((p) =>
    `${p.title} ${p.status}`.toLowerCase().includes(query.toLowerCase())
  );

  function startCreate() {
    setSelectedId(null);
    setIsCreating(true);
    setDraft({ ...emptyDraft });
    setMessage("");
  }

  function selectPost(post: Post) {
    setSelectedId(post.id);
    setIsCreating(false);
    setDraft({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImageKey: post.coverImageKey,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      status: post.status,
    });
    setMessage("");
  }

  function updateDraft<K extends keyof DraftPost>(key: K, value: DraftPost[K]) {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      // Tự động tạo slug từ title khi đang tạo mới
      if (key === "title" && isCreating) {
        next.slug = toPostSlug(value as string);
      }
      // Tự động điền metaTitle từ title nếu chưa có
      if (key === "title" && !prev.metaTitle) {
        next.metaTitle = value as string;
      }
      // Tự động điền metaDescription từ excerpt nếu chưa có
      if (key === "excerpt" && !prev.metaDescription) {
        next.metaDescription = value as string;
      }
      return next;
    });
  }

  const handleImageUpload = useCallback(async (file: File) => {
    setUploading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload-post-image", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setUploading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Upload ảnh thất bại");
      return;
    }

    setDraft((prev) => ({ ...prev, coverImageKey: data.imageKey }));
    setMessage("Đã upload ảnh bìa thành công.");
  }, []);

  async function savePost() {
    setSaving(true);
    setMessage("");

    const payload = { ...draft };

    let response: Response;
    if (isCreating) {
      response = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      response = await fetch(`/api/admin/posts/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(data.error ?? "Không thể lưu bài viết");
      return;
    }

    const savedPost: Post = data.post;

    if (isCreating) {
      setPosts((prev) => [savedPost, ...prev]);
      setIsCreating(false);
      setSelectedId(savedPost.id);
      setMessage("Đã tạo bài viết mới.");
    } else {
      setPosts((prev) => prev.map((p) => (p.id === savedPost.id ? savedPost : p)));
      setMessage("Đã lưu thay đổi.");
    }
  }

  async function deletePost() {
    if (!selectedPost) return;
    const confirmed = window.confirm(`Xoá bài "${selectedPost.title}"? Hành động này không thể hoàn tác.`);
    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    const response = await fetch(`/api/admin/posts/${selectedId}`, { method: "DELETE" });
    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMessage(data.error ?? "Không thể xoá bài viết");
      return;
    }

    const nextPosts = posts.filter((p) => p.id !== selectedId);
    setPosts(nextPosts);
    setSelectedId(nextPosts[0]?.id ?? null);
    if (nextPosts[0]) {
      setDraft({
        title: nextPosts[0].title,
        slug: nextPosts[0].slug,
        excerpt: nextPosts[0].excerpt,
        content: nextPosts[0].content,
        coverImageKey: nextPosts[0].coverImageKey,
        metaTitle: nextPosts[0].metaTitle,
        metaDescription: nextPosts[0].metaDescription,
        status: nextPosts[0].status,
      });
    } else {
      setDraft({ ...emptyDraft });
      setIsCreating(false);
    }
    setMessage("Đã xoá bài viết.");
  }

  const coverImageUrl = buildPostImageUrl(draft.coverImageKey, { width: 800, height: 400 });

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Sidebar danh sách */}
      <aside className="rounded-lg border border-line bg-white p-4">
        <button
          type="button"
          onClick={startCreate}
          className="mb-4 w-full rounded-md bg-good px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + Viết bài mới
        </button>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm bài viết..."
          className="mb-4 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-good"
        />
        <div className="max-h-[620px] space-y-2 overflow-auto">
          {filteredPosts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => selectPost(post)}
              className={`w-full rounded-md border px-3 py-3 text-left text-sm ${
                selectedId === post.id && !isCreating
                  ? "border-good bg-green-50"
                  : "border-line bg-white hover:border-good"
              }`}
            >
              <span className="block font-semibold text-ink line-clamp-1">{post.title}</span>
              <span
                className={`mt-1 inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${
                  post.status === "PUBLISHED"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {post.status === "PUBLISHED" ? "Đã đăng" : "Nháp"}
              </span>
            </button>
          ))}
          {filteredPosts.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">Chưa có bài nào.</p>
          )}
        </div>
      </aside>

      {/* Form editor */}
      <section className="rounded-lg border border-line bg-white p-6">
        <div className="mb-5 flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-good">
              {isCreating ? "Bài viết mới" : "Chỉnh sửa bài viết"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-ink">
              {draft.title || (isCreating ? "Nhập tiêu đề bên dưới" : "Không có tiêu đề")}
            </h2>
          </div>
          <div className="flex gap-2">
            {!isCreating && selectedPost && (
              <button
                type="button"
                onClick={deletePost}
                disabled={saving}
                className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                Xoá
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                updateDraft("status", draft.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED");
              }}
              className={`rounded-md border px-4 py-2 text-sm font-semibold ${
                draft.status === "PUBLISHED"
                  ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
              }`}
            >
              {draft.status === "PUBLISHED" ? "Chuyển sang Nháp" : "Xuất bản"}
            </button>
            <button
              type="button"
              onClick={savePost}
              disabled={saving || uploading}
              className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-4 rounded-md px-3 py-2 text-sm ${message.includes("thất bại") || message.includes("Không thể") ? "bg-red-50 text-red-700" : "bg-surface text-muted"}`}>
            {message}
          </div>
        )}

        <div className="space-y-6">
          {/* Thông tin cơ bản */}
          <fieldset>
            <legend className="mb-3 text-sm font-bold uppercase text-ink">Thông tin bài viết</legend>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted">Tiêu đề *</span>
                <input
                  value={draft.title}
                  onChange={(e) => updateDraft("title", e.target.value)}
                  placeholder="Ví dụ: Toyota Camry 2025 - Khi sự sang trọng gặp hiệu suất"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-good"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted">
                  Slug URL *{" "}
                  <span className="font-normal text-muted">
                    (sosanhcar.com/chuyen-cua-xe/<strong>{draft.slug || "slug-bai-viet"}</strong>)
                  </span>
                </span>
                <input
                  value={draft.slug}
                  onChange={(e) => updateDraft("slug", e.target.value)}
                  placeholder="toyota-camry-2025-sang-trong-va-hieu-suat"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm font-mono outline-none focus:border-good"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted">Tóm tắt (excerpt) – hiển thị ở trang danh sách</span>
                <textarea
                  value={draft.excerpt}
                  onChange={(e) => updateDraft("excerpt", e.target.value)}
                  rows={2}
                  placeholder="Mô tả ngắn gọn về bài viết, khoảng 1-2 câu..."
                  className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-good"
                />
              </label>
            </div>
          </fieldset>

          {/* Ảnh bìa */}
          <fieldset>
            <legend className="mb-3 text-sm font-bold uppercase text-ink">Ảnh bìa</legend>
            <div className="space-y-3">
              {coverImageUrl && (
                <div className="relative overflow-hidden rounded-lg border border-line">
                  <Image
                    src={coverImageUrl}
                    alt="Ảnh bìa"
                    width={800}
                    height={400}
                    className="w-full object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => updateDraft("coverImageKey", null)}
                    className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
                  >
                    Xoá ảnh
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className="cursor-pointer rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-good">
                  {uploading ? "Đang upload..." : "Chọn ảnh bìa"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                      e.target.value = "";
                    }}
                    disabled={uploading}
                  />
                </label>
                {draft.coverImageKey && (
                  <span className="text-xs text-muted font-mono truncate max-w-[200px]">
                    {draft.coverImageKey}
                  </span>
                )}
              </div>
              <div>
                <span className="mb-1 block text-xs font-semibold text-muted">Hoặc nhập Cloudinary image key thủ công</span>
                <input
                  value={draft.coverImageKey ?? ""}
                  onChange={(e) => updateDraft("coverImageKey", e.target.value || null)}
                  placeholder="vi-du-anh-bia"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm font-mono outline-none focus:border-good"
                />
              </div>
            </div>
          </fieldset>

          {/* Nội dung */}
          <fieldset>
            <legend className="mb-3 text-sm font-bold uppercase text-ink">Nội dung bài viết *</legend>
            <p className="mb-2 text-xs text-muted">
              Hỗ trợ HTML đầy đủ. Dùng <code className="bg-surface px-1 rounded">&lt;h2&gt;</code>,{" "}
              <code className="bg-surface px-1 rounded">&lt;h3&gt;</code>,{" "}
              <code className="bg-surface px-1 rounded">&lt;p&gt;</code>,{" "}
              <code className="bg-surface px-1 rounded">&lt;ul&gt;</code>,{" "}
              <code className="bg-surface px-1 rounded">&lt;img&gt;</code>, v.v.
            </p>
            <textarea
              value={draft.content}
              onChange={(e) => updateDraft("content", e.target.value)}
              rows={20}
              placeholder="<h2>Giới thiệu</h2>&#10;<p>Nội dung bài viết...</p>"
              className="w-full rounded-md border border-line px-3 py-2 text-sm font-mono leading-relaxed outline-none focus:border-good"
            />
          </fieldset>

          {/* SEO */}
          <fieldset>
            <legend className="mb-3 text-sm font-bold uppercase text-ink">SEO</legend>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted">
                  Meta Title{" "}
                  <span className={`font-normal ${draft.metaTitle.length > 60 ? "text-red-500" : "text-muted"}`}>
                    ({draft.metaTitle.length}/60 ký tự)
                  </span>
                </span>
                <input
                  value={draft.metaTitle}
                  onChange={(e) => updateDraft("metaTitle", e.target.value)}
                  placeholder="Tiêu đề hiển thị trên Google (tối đa 60 ký tự)"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-good"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted">
                  Meta Description{" "}
                  <span className={`font-normal ${draft.metaDescription.length > 160 ? "text-red-500" : "text-muted"}`}>
                    ({draft.metaDescription.length}/160 ký tự)
                  </span>
                </span>
                <textarea
                  value={draft.metaDescription}
                  onChange={(e) => updateDraft("metaDescription", e.target.value)}
                  rows={3}
                  placeholder="Mô tả hiển thị trên Google (tối đa 160 ký tự)"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-good"
                />
              </label>
              {/* Preview SEO */}
              {(draft.metaTitle || draft.metaDescription) && (
                <div className="rounded-lg border border-line bg-surface p-4">
                  <p className="mb-1 text-xs font-semibold uppercase text-muted">Xem trước Google</p>
                  <div className="rounded-md bg-white p-3">
                    <p className="text-sm font-medium text-blue-600 hover:underline truncate">
                      {draft.metaTitle || draft.title || "Tiêu đề bài viết"}
                    </p>
                    <p className="text-xs text-green-700">sosanhcar.com › chuyen-cua-xe › {draft.slug || "slug"}</p>
                    <p className="mt-1 text-xs text-muted line-clamp-2">
                      {draft.metaDescription || draft.excerpt || "Mô tả bài viết..."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </fieldset>

          {/* Trạng thái */}
          <fieldset>
            <legend className="mb-3 text-sm font-bold uppercase text-ink">Trạng thái xuất bản</legend>
            <div className="flex gap-4">
              {(["DRAFT", "PUBLISHED"] as PostStatus[]).map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={draft.status === s}
                    onChange={() => updateDraft("status", s)}
                    className="accent-good"
                  />
                  <span className={s === "PUBLISHED" ? "font-semibold text-green-700" : "text-amber-700"}>
                    {s === "PUBLISHED" ? "Xuất bản (Published)" : "Lưu nháp (Draft)"}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </section>
    </div>
  );
}
