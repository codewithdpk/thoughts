import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-full">
      <Sidebar email={session.email} />
      <main className="min-w-0 flex-1 bg-white">{children}</main>
    </div>
  );
}
