export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { updatePerson } from "@/app/admin/actions";
import { MergePersonForm } from "./merge-form";
import { YouTubeSync } from "./youtube-sync";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPersonPage({ params }: PageProps) {
  await requireAdminPage();

  const { id } = await params;

  const person = await prisma.person.findUnique({ where: { id } });
  if (!person) notFound();

  async function handleSubmit(formData: FormData) {
    "use server";
    await updatePerson(id, formData);
    redirect("/admin/people");
  }

  return (
    <main id="main-content" className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-accent-gold">Edit Person</h1>
        <Link href="/admin/people" className="font-mono text-xs text-text-muted hover:text-accent-gold-text">← Back</Link>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminFormField label="Display Name" name="displayName" defaultValue={person.displayName} required />
          <AdminFormField label="Slug" name="slug" defaultValue={person.slug} required />
        </div>

        <AdminFormField
          label="Person Type"
          name="personType"
          type="select"
          defaultValue={person.personType}
          options={[
            { label: "Host", value: "host" },
            { label: "Recurring", value: "recurring" },
            { label: "Guest", value: "guest" },
            { label: "Mentioned", value: "mentioned" },
          ]}
        />

        <AdminFormField label="Short Bio" name="shortBio" type="textarea" defaultValue={person.shortBio} />
        <AdminFormField label="Lore Summary" name="loreSummary" type="textarea" defaultValue={person.loreSummary} />
        <AdminFormField label="Avatar URL" name="avatarUrl" type="url" defaultValue={person.avatarUrl} />
        <AdminFormField label="Alt Names (comma-separated)" name="altNames" defaultValue={person.altNames.join(", ")} />

        {/* YouTube channel — syncs avatar + stores channel link */}
        <YouTubeSync
          personId={id}
          initialChannelUrl={person.youtubeChannelUrl ?? null}
          initialAvatarUrl={person.avatarUrl ?? null}
        />

        <div className="flex items-center gap-3 pt-4">
          <button type="submit" className="rounded bg-accent-gold px-6 py-2 font-mono text-sm font-bold text-void hover:bg-accent-gold/80">
            Save Changes
          </button>
          <Link href="/admin/people" className="font-mono text-xs text-text-muted hover:text-text-primary">Cancel</Link>
        </div>
      </form>

      {/* Merge section */}
      <div className="mt-10 border-t border-border pt-6">
        <h2 className="font-display text-lg font-bold text-accent-gold-text mb-3">Merge Into Another Person</h2>
        <p className="text-xs text-text-muted mb-4">
          All appearances, quotes, and connections will be moved to the target person. This person will be marked as merged.
        </p>
        <MergePersonForm sourceId={id} sourceName={person.displayName} />
      </div>
    </main>
  );
}
