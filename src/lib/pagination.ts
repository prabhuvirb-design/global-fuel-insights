export function paginate<T>(items: T[], page: number, size: number) {
  const pageSize = Math.max(1, Math.floor(size));
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(pages, Math.max(1, Math.floor(page)));
  const start = (current - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), current, pages, start, total: items.length };
}