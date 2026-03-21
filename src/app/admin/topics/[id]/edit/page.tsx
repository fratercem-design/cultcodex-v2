import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { updateTopic } from "@/app/admin/actions";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTopicPage({ params }: PageProps) {
  const { id } = await params;

  const topic = await prisma.topic.findUnique({ where: { id } });
  if (!topic) notFound();

  async function handleSubmit(formData: FormData) {
    "use server";
    await updateTopic(id, formData);
    redirect("/admin/topics");
  }

  return (
    <main id="main-content" className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-accent-gold">
          Edit Topic
        </h1>
        <Link
          href="/admin/topics"
          className="font-mono text-xs text-text-muted hover:text-accent-green transition-colors"
        >
          &larr; Back to Topics
        </Link>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminFormField
            label="Title"
            name="title"
            defaultValue={topic.title}
            required
          />
          <AdminFormField
            label="Slug"
            name="slug"
            defaultValue={topic.slug}
            required
          />
        </div>

        <AdminFormField
          label="Description"
          name="description"
          type="textarea"
          defaultValue={topic.description}
        />

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            className="rounded bg-accent-green px-6 py-2 font-mono text-sm font-bold text-void transition-colors hover:bg-accent-green/80"
          >
            Save Changes
          </button>
          <Link
            href="/admin/topics"
            className="font-mono text-xs text-text-muted hover:text-text-primary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
