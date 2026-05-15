"use client";

import { useState } from "react";
import Link from "next/link";

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface Action<T> {
  label: string;
  href?: (row: T) => string;
  onClick?: (row: T) => void;
  variant?: "default" | "danger";
}

interface BulkAction {
  label: string;
  value: string;
  variant?: "default" | "danger";
}

interface AdminTableProps<T extends { id: string }> {
  columns: Column<T>[];
  rows: T[];
  actions?: Action<T>[];
  bulkActions?: BulkAction[];
  onBulkAction?: (action: string, ids: string[]) => void;
  getRowKey?: (row: T) => string;
}

export function AdminTable<T extends { id: string }>({
  columns,
  rows,
  actions,
  bulkActions,
  onBulkAction,
  getRowKey,
}: AdminTableProps<T>) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkValue, setBulkValue] = useState("");

  const toggleAll = () => {
    if (selected.size === rows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((r) => getRowKey?.(r) ?? r.id)));
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div>
      {/* Bulk actions bar */}
      {bulkActions && bulkActions.length > 0 && selected.size > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded border border-accent-gold/20 bg-accent-gold/5 px-3 py-2">
          <span className="font-mono text-xs text-text-muted">
            {selected.size} selected
          </span>
          <select
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            className="rounded border border-border bg-elevated px-2 py-1 font-mono text-xs text-text-primary"
          >
            <option value="">Choose action...</option>
            {bulkActions.map((ba) => (
              <option key={ba.value} value={ba.value}>
                {ba.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (bulkValue && onBulkAction) {
                onBulkAction(bulkValue, Array.from(selected));
                setSelected(new Set());
                setBulkValue("");
              }
            }}
            disabled={!bulkValue}
            className="rounded bg-accent-gold px-3 py-1 font-mono text-xs font-bold text-void disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-elevated">
              {bulkActions && (
                <th className="w-8 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.size === rows.length && rows.length > 0}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted"
                >
                  {col.label}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => {
              const key = getRowKey?.(row) ?? row.id;
              return (
                <tr
                  key={key}
                  className="transition-colors hover:bg-elevated/50"
                >
                  {bulkActions && (
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(key)}
                        onChange={() => toggle(key)}
                        className="rounded"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-3 py-2 font-mono text-xs text-text-primary"
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {actions.map((action) =>
                          action.href ? (
                            <Link
                              key={action.label}
                              href={action.href(row)}
                              className="font-mono text-[10px] text-accent-gold hover:underline"
                            >
                              {action.label}
                            </Link>
                          ) : (
                            <button
                              key={action.label}
                              onClick={() => action.onClick?.(row)}
                              className={`font-mono text-[10px] hover:underline ${
                                action.variant === "danger"
                                  ? "text-red-400"
                                  : "text-accent-gold"
                              }`}
                            >
                              {action.label}
                            </button>
                          ),
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={
                    columns.length +
                    (bulkActions ? 1 : 0) +
                    (actions ? 1 : 0)
                  }
                  className="px-3 py-8 text-center font-mono text-xs text-text-muted"
                >
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
