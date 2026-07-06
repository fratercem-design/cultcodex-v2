"use client";

import { useEffect, useState } from "react";

export default function PremiumContent() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/premium/status")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  if (loading) return null;
  if (!data) return <div className="py-24 text-center"><p className="font-mono text-xs text-text-muted">Failed.</p></div>;
  return <div className="py-8 text-center"><p className="font-mono text-xs text-text-muted">Status: {data.subscription?.status||"none"}</p></div>;
}
