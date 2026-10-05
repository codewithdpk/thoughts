import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { HttpError } from "@/lib/http";
import { getThought } from "@/lib/services/thoughts";
import { ThoughtView } from "@/components/ThoughtView";

export default async function ThoughtPage({ params }: PageProps<"/thoughts/[id]">) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const thought = await getThought(session.userId, id).catch((e) => {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  });

  return (
    <ThoughtView
      key={thought.id}
      thought={{
        id: thought.id,
        content: thought.content,
        updatedAt: thought.updatedAt.toISOString(),
        links: thought.links,
        backlinks: thought.backlinks,
      }}
    />
  );
}
