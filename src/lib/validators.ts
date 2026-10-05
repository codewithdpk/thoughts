import { z } from "zod";

const title = z.string().trim().max(200);
const content = z.string().max(1_000_000);

export const loginSchema = z.object({
  email: z.email().transform((e) => e.toLowerCase().trim()),
  password: z.string().min(1),
});

export const createDocSchema = z.object({
  title: title.optional(),
  content: content.optional(),
});

export const updateNoteSchema = z.object({
  title: title.optional(),
  content: content.optional(),
  pinned: z.boolean().optional(),
});

export const updateThoughtSchema = z.object({
  title: title.optional(),
  content: content.optional(),
});

export const createLinkSchema = z.object({
  targetId: z.string().min(1),
  label: z.string().trim().max(100).optional(),
});

export type CreateDocInput = z.infer<typeof createDocSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type UpdateThoughtInput = z.infer<typeof updateThoughtSchema>;
export type CreateLinkInput = z.infer<typeof createLinkSchema>;
