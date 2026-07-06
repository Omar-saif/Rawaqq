"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ImageUploader from "@/components/ImageUploader";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  ctaLabel: string | null;
  position: number;
  active: boolean;
};

const empty = { title: "", subtitle: "", imageUrl: "", linkUrl: "", ctaLabel: "Shop now", position: 0, active: true };

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/banners");
    setBanners(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function createBanner() {
    if (!form.imageUrl) {
      toast.error("Upload an image first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, position: banners.length }),
      });
      if (!res.ok) {
        toast.error("Could not create banner.");
        return;
      }
      setForm(empty);
      toast.success("Banner added");
      load();
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(b: Banner) {
    await fetch(`/api/admin/banners/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !b.active }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this banner?")) return;
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-2">Banners</h1>
      <p className="text-muted text-sm mb-8">Manage the rotating banner(s) shown at the top of your homepage.</p>

      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="label-eyebrow mb-4">Add a new banner</h2>
          <div className="space-y-3">
            {form.imageUrl ? (
              <div className="relative aspect-video bg-line/30">
                <Image src={form.imageUrl} alt="preview" fill className="object-cover" />
              </div>
            ) : (
              <div className="aspect-video bg-line/30 flex items-center justify-center text-muted text-sm">No image yet</div>
            )}
            <ImageUploader onUploaded={(url) => setForm({ ...form, imageUrl: url })} />

            <input className="input-field" placeholder="Title (e.g. New Season Arrivals)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="input-field" placeholder="Subtitle / eyebrow text (optional)" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            <input className="input-field" placeholder="Link URL (e.g. /products)" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} />
            <input className="input-field" placeholder="Button text" value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} />
            <button onClick={createBanner} disabled={loading} className="btn-primary w-full">
              {loading ? "Adding..." : "Add Banner"}
            </button>
          </div>
        </div>

        <div>
          <h2 className="label-eyebrow mb-4">Current banners</h2>
          <div className="space-y-4">
            {banners.map((b) => (
              <div key={b.id} className="border border-line flex gap-4 p-3">
                <div className="relative w-28 h-20 bg-line/30 flex-shrink-0">
                  <Image src={b.imageUrl} alt={b.title} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{b.title}</p>
                  <p className="text-xs text-muted">{b.subtitle}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => remove(b.id)} className="text-muted hover:text-danger">
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => toggleActive(b)}
                    className={`text-xs uppercase tracking-wide px-2 py-1 ${b.active ? "bg-success/10 text-success" : "bg-line text-muted"}`}
                  >
                    {b.active ? "Active" : "Hidden"}
                  </button>
                </div>
              </div>
            ))}
            {banners.length === 0 && <p className="text-sm text-muted">No banners yet — add one on the left.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
