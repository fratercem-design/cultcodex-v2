"use client";

import { useTransition, useState } from "react";
import { updateNotificationPreference } from "./actions";

interface NotificationToggleProps {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}

export function NotificationToggle({
  name,
  label,
  description,
  defaultChecked,
}: NotificationToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useState(defaultChecked);

  function handleChange(newValue: boolean) {
    setChecked(newValue);
    startTransition(async () => {
      await updateNotificationPreference(name, newValue);
    });
  }

  return (
    <div
      className="flex items-center justify-between gap-4 cursor-pointer group"
      onClick={() => !isPending && handleChange(!checked)}
    >
      <div>
        <p className="font-mono text-sm text-text-primary group-hover:text-accent-gold transition-colors">
          {label}
        </p>
        <p className="font-mono text-[10px] text-text-muted">{description}</p>
      </div>
      <div
        className={`relative h-6 w-11 rounded-full border transition-colors ${
          isPending ? "opacity-50" : ""
        } ${checked ? "bg-accent-gold/20 border-accent-gold" : "bg-elevated border-border"}`}
      >
        <div
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full transition-all ${
            checked ? "translate-x-5 bg-accent-gold" : "bg-text-muted"
          }`}
        />
      </div>
    </div>
  );
}
