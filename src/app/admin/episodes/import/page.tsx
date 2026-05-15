import { requireAdmin } from "@/lib/auth";
import { ImportForm } from "./import-form";

export const metadata = { title: "Import Episodes — CultCodex Admin" };

export default async function ImportEpisodesPage() {
  await requireAdmin();

  return (
    <div className="max-w-4xl">
      <h1 className="font-mono text-xl font-bold text-text-primary mb-2">
        Import Episodes from CSV
      </h1>
      <p className="font-mono text-xs text-text-muted mb-6">
        Paste CSV data or upload a .csv file. Expected columns: title, episodeNumber, airDate, youtubeVideoId, summaryShort, status
      </p>
      <ImportForm />
    </div>
  );
}
