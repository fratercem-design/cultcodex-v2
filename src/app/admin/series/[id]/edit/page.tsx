export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { updateSeries } from "@/app/admin/actions";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSeriesPage({ params }: PageProps) {
  const { id } = await params;

  const series = await prisma.series.findUnique({ where: { id } });
  if (!series) notFound();

  async function handleSubmit(formData: FormData) {
    "use server";
    await updateSeries(id, formData);
    redirect("/admin/series");
  }

  return (
    <main id="main-content" className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-accent-gold">
          Edit Series
        </h1>
        <Link
          href="/admin/series"
          className="font-mono text-xs text-text-muted hover:text-accent-gold-text transition-colors"
        >
          &larr; Back to Series
        </Link>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminFormField
            label="Title"
            name="title"
            defaultValue={series.title}
            required
          />
          <AdminFormField
            label="Slug"
            name="slug"
            defaultValue={series.slug}
            required
          />
        </div>

        <AdminFormField
          label="Description"
          name="description"
          type="textarea"
          defaultValue={series.description}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <AdminFormField
            label="Type"
            name="type"
            type="select"
            defaultValue={series.type}
            options={[
              { label: "Recurring Series", value: "recurring_series" },
              { label: "Mini Series", value: "mini_series" },
              { label: "One Off", value: "one_off" },
              { label: "Other", value: "other" },
            ]}
          />
          <AdminFormField
            label="Status"
            name="status"
            type="select"
            defaultValue={series.status}
            options={[
              { label: "Published", value: "published" },
              { label: "Draft", value: "draft" },
              { label: "Archived", value: "archived" },
            ]}
          />
          <AdminFormField
            label="Cover Image URL"
            name="coverImageUrl"
            type="url"
            defaultValue={series.coverImageUrl}
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
            href="/admin/series"
            className="font-mono text-xs text-text-muted hover:text-text-primary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
