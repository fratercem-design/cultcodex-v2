import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { updateEpisode } from "@/app/admin/actions";
import { PsychenomiconWidget } from "./psychenomicon-widget";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEpisodePage({ params }: PageProps) {
  const { id } = await params;

  const episode = await prisma.episode.findUnique({
    where: { id },
    include: {
      psychenomiconChapter: { select: { chapterNumber: true, title: true, slug: true } },
      _count: { select: { segments: true } },
    },
  });
  if (!episode) notFound();

  const hasTranscript = episode._count.segments > 0 || !!episode.transcriptRaw;

  async function handleSubmit(formData: FormData) {
    "use server";
    await updateEpisode(id, formData);
    redirect("/admin/episodes");
  }

  return (
    <main id="main-content" className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-accent-gold">
          Edit Episode
        </h1>
        <Link
          href="/admin/episodes"
          className="font-mono text-xs text-text-muted hover:text-accent-gold transition-colors"
        >
          &larr; Back to Episodes
        </Link>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminFormField
            label="Title"
            name="title"
            defaultValue={episode.title}
            required
          />
          <AdminFormField
            label="Slug"
            name="slug"
            defaultValue={episode.slug}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <AdminFormField
            label="Episode Number"
            name="episodeNumber"
            type="number"
            defaultValue={episode.episodeNumber}
          />
          <AdminFormField
            label="Air Date"
            name="airDate"
            type="date"
            defaultValue={episode.airDate?.toISOString().split("T")[0]}
          />
          <AdminFormField
            label="Status"
            name="status"
            type="select"
            defaultValue={episode.status}
            options={[
              { label: "Published", value: "published" },
              { label: "Draft", value: "draft" },
              { label: "Archived", value: "archived" },
            ]}
          />
        </div>

        <AdminFormField
          label="Content Type"
          name="contentType"
          type="select"
          defaultValue={episode.contentType}
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
          defaultValue={episode.summaryShort}
        />

        <AdminFormField
          label="Long Summary"
          name="summaryLong"
          type="textarea"
          defaultValue={episode.summaryLong}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminFormField
            label="YouTube Video ID"
            name="youtubeVideoId"
            defaultValue={episode.youtubeVideoId}
            placeholder="dQw4w9WgXcQ"
          />
          <AdminFormField
            label="Thumbnail URL"
            name="thumbnailUrl"
            type="url"
            defaultValue={episode.thumbnailUrl}
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
            href="/admin/episodes"
            className="font-mono text-xs text-text-muted hover:text-text-primary"
          >
            Cancel
          </Link>
        </div>
      </form>

      <div className="mt-8">
        <PsychenomiconWidget
          episodeId={id}
          hasTranscript={hasTranscript}
          chapter={episode.psychenomiconChapter}
        />
      </div>
    </main>
  );
}
