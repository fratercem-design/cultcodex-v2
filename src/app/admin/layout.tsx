import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata = {
  title: "Admin — CULT CODEX",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/auth/signin");
  }

  return (
    <div className="flex min-h-screen bg-void">
      <AdminSidebar userName={user.displayName} userAvatar={user.avatarUrl} />
      <div className="ml-60 flex-1">
        {children}
      </div>
    </div>
  );
}
