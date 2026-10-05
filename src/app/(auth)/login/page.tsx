import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const target = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/notes";
  return (
    <main className="flex h-full items-center justify-center bg-neutral-100">
      <LoginForm next={target} />
    </main>
  );
}
