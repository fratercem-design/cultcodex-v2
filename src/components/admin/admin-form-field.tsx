interface AdminFormFieldProps {
  label: string;
  name: string;
  type?: "text" | "textarea" | "select" | "date" | "number" | "url";
  defaultValue?: string | number | null;
  options?: { label: string; value: string }[];
  required?: boolean;
  placeholder?: string;
  error?: string;
}

export function AdminFormField({
  label,
  name,
  type = "text",
  defaultValue,
  options,
  required,
  placeholder,
  error,
}: AdminFormFieldProps) {
  const baseClasses =
    "w-full rounded border border-border bg-elevated px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-green focus:outline-none";

  return (
    <div className="space-y-1">
      <label
        htmlFor={name}
        className="block font-mono text-xs font-medium text-text-muted uppercase tracking-wider"
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          required={required}
          rows={4}
          className={baseClasses}
        />
      ) : type === "select" && options ? (
        <select
          id={name}
          name={name}
          defaultValue={defaultValue ?? ""}
          required={required}
          className={baseClasses}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          required={required}
          className={baseClasses}
        />
      )}

      {error && (
        <p className="font-mono text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
