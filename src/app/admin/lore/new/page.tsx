export const dynamic = "force-dynamic";

import { requireAdminPage } from "@/lib/auth";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { SlugField } from "@/components/admin/slug-field";
import { createLoreEntry } from "@/app/admin/create-actions";

export const metadata = { title: "Create Lore Entry — CultCodex Admin" };

export default async function CreateLoreEntryPage() {
  await requireAdminPage();

  return (
    <div className="max-w-2xl">
      <h1 className="font-mono text-xl font-bold text-text-primary mb-6">
        Create Lore Entry
      </h1>

      <form action={createLoreEntry} className="space-y-4">
        <SlugField titleLabel="Title" titleName="title" />

        <AdminFormField
          label="Summary"
          name="summary"
          type="textarea"
        />
        <AdminFormField
          label="Full Entry"
          name="fullEntry"
          type="textarea"
        />
        <AdminFormField
          label="Category"
          name="category"
          type="text"
        />
        <AdminFormField
          label="Canon Status"
          name="canonStatus"
          type="select"
          options={[
            { label: "Canonical", value: "canonical" },
            { label: "Speculative", value: "speculative" },
            { label: "Community Myth", value: "community_myth" },
            { label: "Disputed", value: "disputed" },
            { label: "Humorous", value: "humorous" },
          ]}
        />

        <button
          type="submit"
          className="rounded bg-accent-gold px-6 py-2 font-mono text-sm font-bold text-void uppercase tracking-wider hover:bg-accent-gold/90 transition-colors"
        >
          Create Lore Entry
        </button>
      </form>
    </div>
  );
}
