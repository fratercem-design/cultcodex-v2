import { requireAdminPage } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

// Admin pages require authentication — never statically pre-render them.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — CULT CODEX",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Every admin page.tsx must also call requireAdminPage(): layouts and
  // pages render in parallel, so this check alone does not stop a page's
  // data from streaming out in the redirect response.
  const user = await requireAdminPage();

  return (
    <div className="flex min-h-screen bg-void">
      <AdminSidebar userName={user.displayName} userAvatar={user.avatarUrl} />
      <div className="ml-60 flex-1">
        {children}
      </div>
    </div>
  );
}
