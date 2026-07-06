"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function SetupPage() {
  const [checking, setChecking] = useState(true);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [form, setForm] = useState({ secret: "", name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/setup")
      .then((r) => r.json())
      .then((data) => setAlreadyDone(Boolean(data.adminExists)))
      .finally(() => setChecking(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success("Store is ready!");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return <div className="mx-auto max-w-sm px-4 py-24 text-center text-muted text-sm">Checking setup status...</div>;
  }

  if (alreadyDone) {
    return (
      <div className="mx-auto max-w-sm px-4 py-24 text-center">
        <h1 className="font-display text-2xl mb-3">Setup already complete</h1>
        <p className="text-sm text-muted mb-6">An admin account already exists for this store.</p>
        <a href="/login" className="btn-primary inline-block">Go to sign in</a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-24">
      <h1 className="font-display text-3xl mb-2 text-center">Welcome to RAWAQ</h1>
      <p className="text-sm text-muted text-center mb-8">
        Let's create your admin account. This page only works once.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <input
          className="input-field"
          placeholder="Setup key (from your Vercel environment variables)"
          type="password"
          value={form.secret}
          onChange={(e) => setForm({ ...form, secret: e.target.value })}
          required
        />
        <input className="input-field" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input-field" placeholder="Admin email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="input-field" placeholder="Password (min 8 characters)" type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <button className="btn-primary w-full" disabled={loading}>{loading ? "Setting up..." : "Create my store"}</button>
      </form>
      <p className="text-xs text-muted text-center mt-6">
        The setup key is the <code>SETUP_SECRET</code> value you set in Vercel → Settings → Environment Variables.
      </p>
    </div>
  );
}
