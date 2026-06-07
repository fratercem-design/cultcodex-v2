export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/auth";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { SlugField } from "@/components/admin/slug-field";
import { createPerson } from "@/app/admin/create-actions";

export const metadata = { title: "Create Person — CultCodex Admin" };

export default async function CreatePersonPage() {
  await requireAdmin();

  return (
    <div className="max-w-2xl">
      <h1 className="font-mono text-xl font-bold text-text-primary mb-6">
        Create Person
      </h1>

      <form action={createPerson} className="space-y-4">
        <SlugField titleLabel="Display Name" titleName="displayName" />

        <AdminFormField
          label="Person Type"
          name="personType"
          type="select"
          options={[
            { label: "Guest", value: "guest" },
            { label: "Host", value: "host" },
            { label: "Recurring", value: "recurring" },
            { label: "Mentioned", value: "mentioned" },
          ]}
        />
        <AdminFormField
          label="Short Bio"
          name="shortBio"
          type="textarea"
        />
        <AdminFormField
          label="Lore Summary"
          name="loreSummary"
          type="textarea"
        />
        <AdminFormField
          label="Avatar URL"
          name="avatarUrl"
          type="url"
        />
        <AdminFormField
          label="Alt Names (comma-separated)"
          name="altNames"
          type="text"
          placeholder="e.g. Nick, Nicholas, The Alchemist"
        />

        <button
          type="submit"
          className="rounded bg-accent-gold px-6 py-2 font-mono text-sm font-bold text-void uppercase tracking-wider hover:bg-accent-gold/90 transition-colors"
        >
          Create Person
        </button>
      </form>
    </div>
  );
}
