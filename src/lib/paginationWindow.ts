export type PaginationItem = number | "ellipsis";

export function getPaginationItems(
  currentPage: number,
  totalPages: number,
  siblingCount = 2,
): PaginationItem[] {
  if (totalPages <= 0) return [];

  const pages = new Set([1, totalPages]);
  const start = Math.max(1, currentPage - siblingCount);
  const end = Math.min(totalPages, currentPage + siblingCount);
  for (let page = start; page <= end; page++) pages.add(page);

  const sortedPages = [...pages].sort((a, b) => a - b);
  const items: PaginationItem[] = [];
  let previous = 0;

  for (const page of sortedPages) {
    if (previous > 0 && page - previous > 1) items.push("ellipsis");
    items.push(page);
    previous = page;
  }

  return items;
}
