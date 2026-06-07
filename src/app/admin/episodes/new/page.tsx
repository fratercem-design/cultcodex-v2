export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/auth";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { SlugField } from "@/components/admin/slug-field";
import { createEpisode } from "@/app/admin/create-actions";

export const metadata = { title: "Create Episode — CultCodex Admin" };

export default async function CreateEpisodePage() {
  await requireAdmin();

  return (
    <div className="max-w-2xl">
      <h1 className="font-mono text-xl font-bold text-text-primary mb-6">
        Create Episode
      </h1>

      <form action={createEpisode} className="space-y-4">
        <SlugField titleLabel="Title" titleName="title" />

        <AdminFormField
          label="Episode Number"
          name="episodeNumber"
          type="number"
        />
        <AdminFormField label="Air Date" name="airDate" type="date" />
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
          label="Content Type"
          name="contentType"
          type="select"
          options={[
            { label: "Livestream", value: "livestream" },
            { label: "Original", value: "original" },
            { label: "Short", value: "short" },
            { label: "Clip", value: "clip" },
          ]}
        />
        <AdminFormField
          label="Short Summary"
          name="summaryShort"
          type="textarea"
        />
        <AdminFormField
          label="Long Summary"
          name="summaryLong"
          type="textarea"
        />
        <AdminFormField
          label="YouTube Video ID"
          name="youtubeVideoId"
          type="text"
        />
        <AdminFormField
          label="Thumbnail URL"
          name="thumbnailUrl"
          type="url"
        />

        <button
          type="submit"
          className="rounded bg-accent-gold px-6 py-2 font-mono text-sm font-bold text-void uppercase tracking-wider hover:bg-accent-gold/90 transition-colors"
        >
          Create Episode
        </button>
      </form>
    </div>
  );
}
