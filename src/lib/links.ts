import "server-only";
import type { Prisma } from "@/generated/prisma/client";

/** Thought ids referenced by inline [[links]] in sanitized HTML. */
export function extractThoughtIds(html: string) {
  const ids = new Set<string>();
  for (const m of html.matchAll(/data-thought-id="([^"]+)"/g)) ids.add(m[1]);
  return [...ids];
}

/** Make the INLINE edges of `sourceId` exactly match the links present in its content. */
export async function syncInlineLinks(
  tx: Prisma.TransactionClient,
  userId: string,
  sourceId: string,
  html: string,
) {
  const candidates = extractThoughtIds(html).filter((id) => id !== sourceId);
  const owned = candidates.length
    ? await tx.thought.findMany({ where: { id: { in: candidates }, userId }, select: { id: true } })
    : [];
  const targetIds = owned.map((t) => t.id);

  await tx.thoughtLink.deleteMany({
    where: { sourceId, kind: "INLINE", targetId: { notIn: targetIds } },
  });
  if (targetIds.length) {
    await tx.thoughtLink.createMany({
      data: targetIds.map((targetId) => ({ sourceId, targetId, kind: "INLINE" as const })),
      skipDuplicates: true,
    });
  }
}
