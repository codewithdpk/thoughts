import "server-only";
import { db } from "@/lib/db";
import { prepareContent } from "@/lib/content";
import { notFound } from "@/lib/http";
import type { CreateDocInput, UpdateNoteInput } from "@/lib/validators";

const listSelect = { id: true, title: true, excerpt: true, pinned: true, updatedAt: true } as const;

export function listNotes(userId: string, search?: string) {
  return db.note.findMany({
    where: {
      userId,
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    select: listSelect,
  });
}

export function createNote(userId: string, input: CreateDocInput = {}) {
  return db.note.create({ data: { userId, ...prepareContent(input) } });
}

export async function getNote(userId: string, id: string) {
  const note = await db.note.findFirst({ where: { id, userId } });
  if (!note) throw notFound("Note");
  return note;
}

export async function updateNote(userId: string, id: string, input: UpdateNoteInput) {
  await getNote(userId, id);
  return db.note.update({
    where: { id },
    data: { ...prepareContent(input), ...(input.pinned !== undefined && { pinned: input.pinned }) },
  });
}

export async function deleteNote(userId: string, id: string) {
  const { count } = await db.note.deleteMany({ where: { id, userId } });
  if (!count) throw notFound("Note");
}
