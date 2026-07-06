"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ImageUploader from "@/components/ImageUploader";
import toast from "react-hot-toast";
import { Trash2, Plus } from "lucide-react";

type Variant = {
  id?: string;
  sku: string;
  size: string;
  color: string;
  price: string; // SAR as string for the input, converted to halalas on save
  stock: number;
  lowStockAt: number;
};

type Category = { id: string; name: string };

type ProductFormProps = {
  productId?: string;
  initial?: {
    name: string;
    description: string;
    categoryId: string | null;
    basePrice: number;
    compareAt: number | null;
    images: string[];
    active: boolean;
    variants: Variant[];
  };
};

const blankVariant = (): Variant => ({ sku: "", size: "", color: "", price: "", stock: 0, lowStockAt: 3 });

export default function ProductForm({ productId, initial }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [basePrice, setBasePrice] = useState(initial ? String(initial.basePrice / 100) : "");
  const [compareAt, setCompareAt] = useState(initial?.compareAt ? String(initial.compareAt / 100) : "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [active, setActive] = useState(initial?.active ?? true);
  const [variants, setVariants] = useState<Variant[]>(
    initial?.variants.length ? initial.variants : [blankVariant()]
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/categories").then((r) => r.json()).then(setCategories);
  }, []);

  async function addCategory() {
    if (!newCategory.trim()) return;
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory }),
    });
    const cat = await res.json();
    setCategories((c) => [...c, cat]);
    setCategoryId(cat.id);
    setNewCategory("");
  }

  function updateVariant(i: number, field: keyof Variant, value: any) {
    setVariants((v) => v.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  }

  async function removeVariantRow(i: number) {
    const row = variants[i];
    if (row.id && !confirm("Delete this variant? This cannot be undone.")) return;
    if (row.id) {
      await fetch(`/api/admin/variants/${row.id}`, { method: "DELETE" });
    }
    setVariants((v) => v.filter((_, idx) => idx !== i));
  }

  async function save() {
    if (!name.trim() || !basePrice) {
      toast.error("Name and base price are required.");
      return;
    }
    if (variants.some((v) => !v.sku.trim())) {
      toast.error("Every variant needs a SKU.");
      return;
    }

    setSaving(true);
    const payload = {
      name,
      description,
      categoryId: categoryId || null,
      basePrice: Math.round(parseFloat(basePrice) * 100),
      compareAt: compareAt ? Math.round(parseFloat(compareAt) * 100) : null,
      images,
      active,
      variants: variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        size: v.size || undefined,
        color: v.color || undefined,
        price: v.price ? Math.round(parseFloat(v.price) * 100) : null,
        stock: Number(v.stock),
        lowStockAt: Number(v.lowStockAt),
      })),
    };

    try {
      const res = await fetch(productId ? `/api/admin/products/${productId}` : "/api/admin/products", {
        method: productId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not save product.");
        return;
      }
      toast.success("Product saved");
      router.push("/admin/products");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid md:grid-cols-[1.3fr,1fr] gap-10">
      <div className="space-y-4">
        <div>
          <p className="label-eyebrow mb-2">Product Name</p>
          <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Oxford Slim-Fit Shirt" />
        </div>

        <div>
          <p className="label-eyebrow mb-2">Description</p>
          <textarea className="input-field min-h-[120px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Fabric, fit, care instructions..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="label-eyebrow mb-2">Base Price (SAR)</p>
            <input className="input-field" type="number" step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="199.00" />
          </div>
          <div>
            <p className="label-eyebrow mb-2">Compare-at Price (optional)</p>
            <input className="input-field" type="number" step="0.01" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} placeholder="249.00" />
          </div>
        </div>

        <div>
          <p className="label-eyebrow mb-2">Category</p>
          <div className="flex gap-2">
            <select className="input-field" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-2">
            <input className="input-field" placeholder="New category name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            <button onClick={addCategory} className="btn-secondary whitespace-nowrap">Add</button>
          </div>
        </div>

        <div>
          <p className="label-eyebrow mb-2">Images</p>
          <div className="flex gap-3 flex-wrap mb-3">
            {images.map((img, i) => (
              <div key={i} className="relative w-20 h-24 bg-line/30">
                <Image src={img} alt="" fill className="object-cover" />
                <button
                  onClick={() => setImages((imgs) => imgs.filter((_, idx) => idx !== i))}
                  className="absolute -top-2 -right-2 bg-ink text-paper rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <ImageUploader onUploaded={(url) => setImages((imgs) => [...imgs, url])} />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Visible in store
        </label>
      </div>

      <div>
        <p className="label-eyebrow mb-2">Variants & Inventory</p>
        <p className="text-xs text-muted mb-4">Each size/color combination is its own SKU with its own stock count.</p>

        <div className="space-y-3">
          {variants.map((v, i) => (
            <div key={i} className="border border-line p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input className="input-field text-sm" placeholder="SKU" value={v.sku} onChange={(e) => updateVariant(i, "sku", e.target.value)} />
                <input className="input-field text-sm" placeholder="Price override (optional)" type="number" step="0.01" value={v.price} onChange={(e) => updateVariant(i, "price", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="input-field text-sm" placeholder="Size (e.g. M)" value={v.size} onChange={(e) => updateVariant(i, "size", e.target.value)} />
                <input className="input-field text-sm" placeholder="Color (e.g. Navy)" value={v.color} onChange={(e) => updateVariant(i, "color", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2 items-center">
                <div>
                  <label className="text-xs text-muted">Stock on hand</label>
                  <input className="input-field text-sm" type="number" min={0} value={v.stock} onChange={(e) => updateVariant(i, "stock", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted">Low-stock alert at</label>
                  <input className="input-field text-sm" type="number" min={0} value={v.lowStockAt} onChange={(e) => updateVariant(i, "lowStockAt", e.target.value)} />
                </div>
              </div>
              <button onClick={() => removeVariantRow(i)} className="text-xs text-danger flex items-center gap-1">
                <Trash2 size={12} /> Remove variant
              </button>
            </div>
          ))}
        </div>

        <button onClick={() => setVariants((v) => [...v, blankVariant()])} className="btn-secondary w-full mt-3 flex items-center justify-center gap-2">
          <Plus size={14} /> Add variant
        </button>

        <button onClick={save} disabled={saving} className="btn-primary w-full mt-8">
          {saving ? "Saving..." : "Save Product"}
        </button>
      </div>
    </div>
  );
}
