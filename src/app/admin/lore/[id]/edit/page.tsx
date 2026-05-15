import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { updateLoreEntry } from "@/app/admin/actions";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLoreEntryPage({ params }: PageProps) {
  const { id } = await params;

  const entry = await prisma.loreEntry.findUnique({ where: { id } });
  if (!entry) notFound();

  async function handleSubmit(formData: FormData) {
    "use server";
    await updateLoreEntry(id, formData);
    redirect("/admin/lore");
  }

  return (
    <main id="main-content" className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-accent-gold">
          Edit Lore Entry
        </h1>
        <Link
          href="/admin/lore"
          className="font-mono text-xs text-text-muted hover:text-accent-gold transition-colors"
        >
          &larr; Back to Lore
        </Link>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminFormField
            label="Title"
            name="title"
            defaultValue={entry.title}
            required
          />
          <AdminFormField
            label="Slug"
            name="slug"
            defaultValue={entry.slug}
            required
          />
        </div>

        <AdminFormField
          label="Summary"
          name="summary"
          type="textarea"
          defaultValue={entry.summary}
        />

        <AdminFormField
          label="Full Entry"
          name="fullEntry"
          type="textarea"
          defaultValue={entry.fullEntry}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminFormField
            label="Category"
            name="category"
            defaultValue={entry.category}
          />
          <AdminFormField
            label="Canon Status"
            name="canonStatus"
            type="select"
            defaultValue={entry.canonStatus}
            options={[
              { label: "Canonical", value: "canonical" },
              { label: "Speculative", value: "speculative" },
              { label: "Community Myth", value: "community_myth" },
              { label: "Disputed", value: "disputed" },
              { label: "Humorous", value: "humorous" },
            ]}
          />
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            className="rounded bg-accent-gold px-6 py-2 font-mono text-sm font-bold text-void transition-colors hover:bg-accent-gold/80"
          >
            Save Changes
          </button>
          <Link
            href="/admin/lore"
            className="font-mono text-xs text-text-muted hover:text-text-primary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
