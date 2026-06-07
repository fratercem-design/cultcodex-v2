export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/auth";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { SlugField } from "@/components/admin/slug-field";
import { createSeries } from "@/app/admin/create-actions";

export const metadata = { title: "Create Series — CultCodex Admin" };

export default async function CreateSeriesPage() {
  await requireAdmin();

  return (
    <div className="max-w-2xl">
      <h1 className="font-mono text-xl font-bold text-text-primary mb-6">
        Create Series
      </h1>

      <form action={createSeries} className="space-y-4">
        <SlugField titleLabel="Title" titleName="title" />

        <AdminFormField
          label="Description"
          name="description"
          type="textarea"
        />
        <AdminFormField
          label="Series Type"
          name="type"
          type="select"
          options={[
            { label: "Music Video", value: "music_video" },
            { label: "Panel", value: "panel" },
            { label: "Tarot", value: "tarot" },
            { label: "Story", value: "story" },
            { label: "Documentary", value: "documentary" },
            { label: "Other", value: "other" },
          ]}
        />
        <AdminFormField
          label="Status"
          name="status"
          type="select"
          options={[
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
            { label: "Archived", value: "archived" },
          ]}
        />
        <AdminFormField
          label="Cover Image URL"
          name="coverImageUrl"
          type="url"
        />

        <button
          type="submit"
          className="rounded bg-accent-gold px-6 py-2 font-mono text-sm font-bold text-void uppercase tracking-wider hover:bg-accent-gold/90 transition-colors"
        >
          Create Series
        </button>
      </form>
    </div>
  );
}
