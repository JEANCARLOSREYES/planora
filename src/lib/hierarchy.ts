type TreeNode = { id: string; parentId: string | null };
export const MAX_PAGE_DEPTH = 12;
export function descendantIds(pages: TreeNode[], id: string): string[] {
  const found = new Set<string>();
  const queue = [id];
  while (queue.length) {
    const parent = queue.shift();
    for (const page of pages)
      if (page.parentId === parent && !found.has(page.id) && page.id !== id) {
        found.add(page.id);
        queue.push(page.id);
      }
  }
  return [...found];
}
export function validateParent(
  pages: TreeNode[],
  id: string | null,
  parentId: string | null,
) {
  if (parentId === null) return;
  const byId = new Map(pages.map((page) => [page.id, page]));
  if (!byId.has(parentId))
    throw new Error("The destination page no longer exists.");
  let cursor: string | null = parentId;
  const visited = new Set<string>();
  let depth = 0;
  while (cursor) {
    if (cursor === id || visited.has(cursor))
      throw new Error("A page cannot be moved inside itself or its children.");
    visited.add(cursor);
    depth++;
    cursor = byId.get(cursor)?.parentId ?? null;
  }
  let subtreeDepth = 0;
  if (id)
    for (const childId of descendantIds(pages, id)) {
      let current: string | null = childId;
      let distance = 0;
      while (current && current !== id && distance <= MAX_PAGE_DEPTH) {
        distance++;
        current = byId.get(current)?.parentId ?? null;
      }
      subtreeDepth = Math.max(subtreeDepth, distance);
    }
  if (depth + subtreeDepth >= MAX_PAGE_DEPTH)
    throw new Error(`Pages can be nested up to ${MAX_PAGE_DEPTH} levels.`);
}
export function completionFields(status: string, previous: Date | null = null) {
  return {
    completedAt: status === "COMPLETED" ? (previous ?? new Date()) : null,
  };
}
