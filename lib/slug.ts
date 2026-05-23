export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function parseCompareSlug(slug: string) {
  const parts = slug.split("-vs-");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  return {
    car1: parts[0],
    car2: parts[1]
  };
}
