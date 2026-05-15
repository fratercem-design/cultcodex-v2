"use client";

import { useState, useTransition } from "react";
import { bulkCreateEpisodes } from "@/app/admin/create-actions";

interface ParsedRow {
  title: string;
  episodeNumber?: number;
  airDate?: string;
  youtubeVideoId?: string;
  summaryShort?: string;
  status?: string;
  error?: string;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  // Parse header
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    // Simple CSV parsing (handles quoted fields)
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: ParsedRow = { title: "" };

    headers.forEach((header, i) => {
      const val = values[i] ?? "";
      switch (header) {
        case "title":
          row.title = val;
          break;
        case "episodenumber":
        case "episode_number":
        case "number":
          row.episodeNumber = val ? parseInt(val, 10) : undefined;
          break;
        case "airdate":
        case "air_date":
        case "date":
          row.airDate = val || undefined;
          break;
        case "youtubevideoid":
        case "youtube_video_id":
        case "videoid":
          row.youtubeVideoId = val || undefined;
          break;
        case "summaryshort":
        case "summary_short":
        case "summary":
          row.summaryShort = val || undefined;
          break;
        case "status":
          row.status = val || undefined;
          break;
      }
    });

    if (!row.title) {
      row.error = "Missing title";
    }

    return row;
  });
}

export function ImportForm() {
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedRow[] | null>(null);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleParse() {
    const rows = parseCSV(csvText);
    setParsedRows(rows);
    setResult(null);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvText(text);
      setParsedRows(parseCSV(text));
      setResult(null);
    };
    reader.readAsText(file);
  }

  function handleImport() {
    if (!parsedRows) return;

    const validRows = parsedRows.filter((r) => !r.error);

    startTransition(async () => {
      const res = await bulkCreateEpisodes(validRows);
      setResult(res);
    });
  }

  const validCount = parsedRows?.filter((r) => !r.error).length ?? 0;
  const errorCount = parsedRows?.filter((r) => r.error).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="space-y-3">
        <div>
          <label className="block font-mono text-xs text-text-muted mb-1">
            Upload CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="font-mono text-xs text-text-muted file:mr-3 file:rounded file:border-0 file:bg-accent-gold file:px-3 file:py-1.5 file:font-mono file:text-xs file:font-bold file:text-void file:cursor-pointer"
          />
        </div>

        <div>
          <label className="block font-mono text-xs text-text-muted mb-1">
            Or Paste CSV Data
          </label>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`title,episodeNumber,airDate,youtubeVideoId,summaryShort,status\nThe Void Speaks,42,2024-01-15,dQw4w9WgXcQ,A deep dive into the void,published`}
            rows={8}
            className="w-full rounded border border-border bg-elevated px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted/40 focus:border-accent-gold focus:outline-none"
          />
        </div>

        <button
          onClick={handleParse}
          disabled={!csvText.trim()}
          className="rounded bg-accent-cyan px-4 py-1.5 font-mono text-xs font-bold text-void uppercase disabled:opacity-50"
        >
          Parse CSV
        </button>
      </div>

      {/* Preview Table */}
      {parsedRows && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-text-primary">
              {validCount} valid rows
            </span>
            {errorCount > 0 && (
              <span className="font-mono text-xs text-red-400">
                {errorCount} errors
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full">
              <thead>
                <tr className="bg-elevated">
                  <th className="px-3 py-1.5 text-left font-mono text-[10px] text-text-muted uppercase">
                    Title
                  </th>
                  <th className="px-3 py-1.5 text-left font-mono text-[10px] text-text-muted uppercase">
                    #
                  </th>
                  <th className="px-3 py-1.5 text-left font-mono text-[10px] text-text-muted uppercase">
                    Date
                  </th>
                  <th className="px-3 py-1.5 text-left font-mono text-[10px] text-text-muted uppercase">
                    Video ID
                  </th>
                  <th className="px-3 py-1.5 text-left font-mono text-[10px] text-text-muted uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-t border-border ${
                      row.error ? "bg-red-500/10" : ""
                    }`}
                  >
                    <td className="px-3 py-1.5 font-mono text-xs text-text-primary">
                      {row.title || (
                        <span className="text-red-400">Missing</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-xs text-text-muted">
                      {row.episodeNumber ?? "—"}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-xs text-text-muted">
                      {row.airDate ?? "—"}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-xs text-text-muted">
                      {row.youtubeVideoId ?? "—"}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-xs text-text-muted">
                      {row.status ?? "draft"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleImport}
            disabled={isPending || validCount === 0}
            className="rounded bg-accent-gold px-6 py-2 font-mono text-sm font-bold text-void uppercase tracking-wider disabled:opacity-50"
          >
            {isPending
              ? "Importing..."
              : `Import ${validCount} Episode${validCount !== 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="rounded border border-border bg-surface p-4 space-y-2">
          <p className="font-mono text-sm text-accent-gold font-bold">
            Import Complete
          </p>
          <p className="font-mono text-xs text-text-primary">
            ✓ Created: {result.created}
          </p>
          {result.skipped > 0 && (
            <p className="font-mono text-xs text-accent-gold">
              ⊘ Skipped (duplicate slug): {result.skipped}
            </p>
          )}
          {result.errors.length > 0 && (
            <div>
              <p className="font-mono text-xs text-red-400 mb-1">
                ✗ Errors:
              </p>
              <ul className="space-y-0.5">
                {result.errors.map((err, i) => (
                  <li key={i} className="font-mono text-[10px] text-red-400">
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
