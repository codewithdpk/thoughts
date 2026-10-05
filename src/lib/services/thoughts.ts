import "server-only";
import { db } from "@/lib/db";
import { prepareContent } from "@/lib/content";
import { HttpError, notFound } from "@/lib/http";
import { syncInlineLinks } from "@/lib/links";
import type { CreateDocInput, CreateLinkInput, UpdateThoughtInput } from "@/lib/validators";

const listSelect = { id: true, title: true, excerpt: true, updatedAt: true } as const;

export function listThoughts(userId: string, search?: string, take?: number) {
  return db.thought.findMany({
    where: {
      userId,
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: { updatedAt: "desc" },
    select: listSelect,
    take,
  });
}

export async function createThought(userId: string, input: CreateDocInput = {}) {
  return db.$transaction(async (tx) => {
    const thought = await tx.thought.create({ data: { userId, ...prepareContent(input) } });
    if (thought.content) await syncInlineLinks(tx, userId, thought.id, thought.content);
    return thought;
  });
}

async function assertOwned(userId: string, id: string) {
  const exists = await db.thought.findFirst({ where: { id, userId }, select: { id: true } });
  if (!exists) throw notFound("Thought");
}

export async function getThought(userId: string, id: string) {
  const thought = await db.thought.findFirst({
    where: { id, userId },
    include: {
      outgoing: { include: { target: { select: { id: true, title: true } } }, orderBy: { createdAt: "asc" } },
      incoming: { include: { source: { select: { id: true, title: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!thought) throw notFound("Thought");

  const { outgoing, incoming, ...rest } = thought;
  return {
    ...rest,
    links: outgoing.map((l) => ({ id: l.id, kind: l.kind, label: l.label, thought: l.target })),
    backlinks: incoming.map((l) => ({ id: l.id, kind: l.kind, label: l.label, thought: l.source })),
  };
}

export type ThoughtWithLinks = Awaited<ReturnType<typeof getThought>>;

export async function updateThought(userId: string, id: string, input: UpdateThoughtInput) {
  await assertOwned(userId, id);
  const data = prepareContent(input);
  await db.$transaction(async (tx) => {
    await tx.thought.update({ where: { id }, data });
    if (data.content !== undefined) await syncInlineLinks(tx, userId, id, data.content);
  });
  return getThought(userId, id);
}

export async function deleteThought(userId: string, id: string) {
  const { count } = await db.thought.deleteMany({ where: { id, userId } });
  if (!count) throw notFound("Thought");
}

export async function addManualLink(userId: string, sourceId: string, input: CreateLinkInput) {
  if (sourceId === input.targetId) throw new HttpError(400, "A thought cannot link to itself");
  const owned = await db.thought.count({ where: { userId, id: { in: [sourceId, input.targetId] } } });
  if (owned !== 2) throw notFound("Thought");

  return db.thoughtLink.upsert({
    where: { sourceId_targetId_kind: { sourceId, targetId: input.targetId, kind: "MANUAL" } },
    update: { label: input.label || null },
    create: { sourceId, targetId: input.targetId, kind: "MANUAL", label: input.label || null },
  });
}

export async function removeManualLink(userId: string, sourceId: string, linkId: string) {
  const { count } = await db.thoughtLink.deleteMany({
    where: { id: linkId, sourceId, kind: "MANUAL", source: { userId } },
  });
  if (!count) throw notFound("Link");
}

export async function getGraph(userId: string) {
  const [nodes, links] = await Promise.all([
    db.thought.findMany({ where: { userId }, select: { id: true, title: true } }),
    db.thoughtLink.findMany({
      where: { source: { userId } },
      select: { id: true, sourceId: true, targetId: true, kind: true, label: true },
    }),
  ]);
  return {
    nodes,
    links: links.map((l) => ({ id: l.id, source: l.sourceId, target: l.targetId, kind: l.kind, label: l.label })),
  };
}
