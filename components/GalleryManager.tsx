"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { galleryImages } from "@/lib/gita-data";
import { Download, Edit2, Trash2, Eye, Plus, X, Check, Upload, Image as ImageIcon } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type GalleryItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  focus?: string;
  isUserUploaded?: boolean;
  addedAt?: string;
};

type AddEditForm = {
  title: string;
  description: string;
  imageFile: File | null;
  imagePreview: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const GALLERY_KEY = "krishna-ai-user-gallery";

function readUserGallery(): GalleryItem[] {
  try {
    const raw = localStorage.getItem(GALLERY_KEY);
    return raw ? (JSON.parse(raw) as GalleryItem[]) : [];
  } catch { return []; }
}

function saveUserGallery(items: GalleryItem[]) {
  localStorage.setItem(GALLERY_KEY, JSON.stringify(items));
}

function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function staticToGalleryItem(img: (typeof galleryImages)[number]): GalleryItem {
  return { id: img.id, title: img.title, description: img.description, image: img.image, focus: img.focus, isUserUploaded: false };
}

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const emptyForm = (): AddEditForm => ({ title: "", description: "", imageFile: null, imagePreview: "" });

// ─── Sub-components ───────────────────────────────────────────────────────────
function Spinner() {
  return <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />;
}

function ActionBtn({ icon, label, onClick, variant = "default" }: {
  icon: React.ReactNode; label: string; onClick: () => void; variant?: "default" | "danger" | "success";
}) {
  const cls = {
    default: "border-white/20 bg-black/40 text-white hover:border-yellow-400/60 hover:bg-yellow-400/10 hover:text-yellow-300",
    danger: "border-red-400/30 bg-black/40 text-red-300 hover:border-red-400 hover:bg-red-500/20",
    success: "border-teal-400/30 bg-black/40 text-teal-300 hover:border-teal-400 hover:bg-teal-500/20",
  };
  return (
    <button
      aria-label={label}
      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold backdrop-blur transition ${cls[variant]}`}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={label}
      type="button"
    >
      {icon} {label}
    </button>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewModal({ item, onClose, onDownload }: { item: GalleryItem; onClose: () => void; onDownload: () => void }) {
  return (
    <motion.div
      animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
      exit={{ opacity: 0 }} initial={{ opacity: 0 }} onClick={onClose}
    >
      <motion.div
        animate={{ scale: 1, y: 0 }} className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/12 bg-[#08050f] shadow-2xl"
        initial={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()} transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        <button className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-xl bg-black/60 text-white backdrop-blur transition hover:bg-black/80" onClick={onClose} type="button">
          <X className="h-5 w-5" />
        </button>
        <img alt={item.title} className={`max-h-[72vh] w-full object-cover ${item.focus ?? "object-center"}`} src={item.image} />
        <div className="flex items-end justify-between gap-4 p-5">
          <div>
            <h3 className="text-2xl font-bold text-white">{item.title}</h3>
            <p className="mt-1 text-sm leading-6 text-white/64">{item.description}</p>
          </div>
          <button
            className="flex shrink-0 items-center gap-2 rounded-xl border border-teal-400/40 bg-teal-500/10 px-4 py-2.5 text-sm font-semibold text-teal-300 transition hover:bg-teal-500/20"
            onClick={onDownload} type="button"
          >
            <Download className="h-4 w-4" /> Download
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function AddEditModal({
  mode, item, onClose, onSave
}: {
  mode: "add" | "edit";
  item?: GalleryItem;
  onClose: () => void;
  onSave: (form: AddEditForm) => Promise<void>;
}) {
  const [form, setForm] = useState<AddEditForm>(() =>
    item ? { title: item.title, description: item.description, imageFile: null, imagePreview: item.image } : emptyForm()
  );
  const [errors, setErrors] = useState<{ title?: string; image?: string }>({});
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function validate() {
    const e: { title?: string; image?: string } = {};
    if (!form.title.trim()) e.title = "Title is required.";
    if (mode === "add" && !form.imageFile) e.image = "Please select an image.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleFile(file: File) {
    if (!ACCEPTED.includes(file.type)) { setErrors((p) => ({ ...p, image: "Only JPG, PNG, WEBP allowed." })); return; }
    if (file.size > 5 * 1024 * 1024) { setErrors((p) => ({ ...p, image: "Image must be under 5 MB." })); return; }
    const base64 = await toBase64(file);
    setForm((p) => ({ ...p, imageFile: file, imagePreview: base64 }));
    setErrors((p) => ({ ...p, image: undefined }));
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    await onSave(form);
    setLoading(false);
  }

  return (
    <motion.div
      animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
      exit={{ opacity: 0 }} initial={{ opacity: 0 }} onClick={onClose}
    >
      <motion.div
        animate={{ scale: 1, y: 0 }} className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/12 bg-[#09060e] shadow-2xl"
        initial={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()} transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <h3 className="text-lg font-bold text-white">{mode === "add" ? "✨ Add New Photo" : "✏️ Edit Photo"}</h3>
          <button className="grid h-9 w-9 place-items-center rounded-xl border border-white/12 text-white/60 transition hover:text-white" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Image Upload */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/46">
              {mode === "edit" ? "Replace Photo (optional)" : "Photo *"}
            </p>
            <div
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition ${errors.image ? "border-red-400/60 bg-red-500/5" : "border-white/15 bg-white/[0.03] hover:border-yellow-400/40 hover:bg-yellow-400/5"}`}
              onClick={() => fileRef.current?.click()}
              style={{ minHeight: form.imagePreview ? 180 : 120 }}
            >
              {form.imagePreview ? (
                <img alt="Preview" className="max-h-44 w-full rounded-xl object-cover" src={form.imagePreview} />
              ) : (
                <div className="flex flex-col items-center gap-2 py-8">
                  <Upload className="h-8 w-8 text-white/30" />
                  <p className="text-sm text-white/46">Click to upload JPG, PNG, WEBP</p>
                  <p className="text-xs text-white/28">Max 5 MB</p>
                </div>
              )}
            </div>
            <input accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} ref={fileRef} type="file" />
            {errors.image && <p className="mt-1.5 text-xs text-red-400">{errors.image}</p>}
          </div>

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.22em] text-white/46">Title *</label>
            <input
              className={`w-full rounded-2xl border bg-night/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-yellow-400/60 focus:ring-2 focus:ring-yellow-400/10 ${errors.title ? "border-red-400/60" : "border-white/10"}`}
              maxLength={80}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Krishna with Flute"
              value={form.title}
            />
            {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.22em] text-white/46">Description</label>
            <textarea
              className="w-full resize-none rounded-2xl border border-white/10 bg-night/60 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-yellow-400/60 focus:ring-2 focus:ring-yellow-400/10"
              maxLength={220}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Brief spiritual description..."
              rows={3}
              value={form.description}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-yellow-400/40 bg-yellow-400/12 py-3 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-400/20 disabled:opacity-50"
              disabled={loading}
              onClick={handleSubmit}
              type="button"
            >
              {loading ? <Spinner /> : <Check className="h-4 w-4" />}
              {mode === "add" ? "Add to Gallery" : "Save Changes"}
            </button>
            <button className="rounded-2xl border border-white/12 px-5 py-3 text-sm text-white/60 transition hover:text-white" onClick={onClose} type="button">
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Delete Confirmation ──────────────────────────────────────────────────────
function DeleteConfirm({ item, onClose, onConfirm }: { item: GalleryItem; onClose: () => void; onConfirm: () => void }) {
  return (
    <motion.div
      animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
      exit={{ opacity: 0 }} initial={{ opacity: 0 }} onClick={onClose}
    >
      <motion.div
        animate={{ scale: 1 }} className="w-full max-w-sm rounded-[2rem] border border-red-400/20 bg-[#0e0610] p-6 shadow-2xl"
        initial={{ scale: 0.93 }} onClick={(e) => e.stopPropagation()} transition={{ duration: 0.25 }}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/10 text-2xl">🗑️</div>
        <h3 className="text-lg font-bold text-white">Delete Photo?</h3>
        <p className="mt-2 text-sm leading-6 text-white/60">
          "<strong className="text-white">{item.title}</strong>" will be permanently removed from your gallery.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            className="flex-1 rounded-2xl border border-red-400/40 bg-red-500/12 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/25"
            onClick={onConfirm} type="button"
          >
            Yes, Delete
          </button>
          <button className="flex-1 rounded-2xl border border-white/12 py-2.5 text-sm text-white/60 transition hover:text-white" onClick={onClose} type="button">
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Gallery Card ─────────────────────────────────────────────────────────────
function GalleryCard({
  item, onView, onEdit, onDelete, onDownload
}: {
  item: GalleryItem;
  onView: () => void; onEdit: () => void; onDelete: () => void; onDownload: () => void;
}) {
  return (
    <motion.div
      className="group glass-card krishna-card relative overflow-hidden rounded-[1.25rem]"
      data-reveal
      layout
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative h-60 overflow-hidden cursor-pointer" onClick={onView}>
        <img
          alt={item.title}
          className={`h-full w-full object-cover transition duration-700 group-hover:scale-110 ${item.focus ?? "object-center"}`}
          src={item.image}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        {item.isUserUploaded && (
          <div className="absolute left-3 top-3 rounded-full border border-yellow-400/40 bg-yellow-400/15 px-2.5 py-1 text-xs font-semibold text-yellow-300 backdrop-blur">
            ✨ Custom
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="rounded-2xl border border-white/30 bg-black/50 px-4 py-2 backdrop-blur">
            <Eye className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white line-clamp-1">{item.title}</h3>
        <p className="mt-1 text-xs leading-5 text-white/56 line-clamp-2">{item.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <ActionBtn icon={<Eye className="h-3.5 w-3.5" />} label="View" onClick={onView} variant="success" />
          <ActionBtn icon={<Download className="h-3.5 w-3.5" />} label="Download" onClick={onDownload} variant="success" />
          <ActionBtn icon={<Edit2 className="h-3.5 w-3.5" />} label="Edit" onClick={onEdit} />
          <ActionBtn icon={<Trash2 className="h-3.5 w-3.5" />} label="Delete" onClick={onDelete} variant="danger" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main GalleryManager ──────────────────────────────────────────────────────
export function GalleryManager() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [viewItem, setViewItem] = useState<GalleryItem | null>(null);
  const [editItem, setEditItem] = useState<GalleryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<GalleryItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const userItems = readUserGallery();
    const staticItems = galleryImages.map(staticToGalleryItem).filter(
      (s) => !userItems.some((u) => u.id === s.id)
    );
    setItems([...staticItems, ...userItems]);
    setMounted(true);
  }, []);

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  function getUserItems(all: GalleryItem[]) {
    return all.filter((i) => i.isUserUploaded);
  }

  async function handleDownload(item: GalleryItem) {
    try {
      const link = document.createElement("a");
      if (item.image.startsWith("data:")) {
        link.href = item.image;
      } else {
        const res = await fetch(item.image);
        const blob = await res.blob();
        link.href = URL.createObjectURL(blob);
      }
      link.download = `${item.title.replace(/\s+/g, "-").toLowerCase()}.jpg`;
      link.click();
      showToast("Download started!");
    } catch { showToast("Download failed.", "error"); }
  }

  async function handleAdd(form: AddEditForm) {
    if (!form.imageFile) return;
    try {
      const base64 = await toBase64(form.imageFile);
      const newItem: GalleryItem = {
        id: `user-${Date.now()}`,
        title: form.title.trim(),
        description: form.description.trim(),
        image: base64,
        isUserUploaded: true,
        addedAt: new Date().toISOString()
      };
      setItems((prev) => {
        const next = [newItem, ...prev];
        saveUserGallery(getUserItems(next).concat([newItem]).filter((i, idx, arr) => arr.findIndex((x) => x.id === i.id) === idx));
        return next;
      });
      setShowAdd(false);
      showToast("Photo added to gallery! 🙏");
    } catch { showToast("Failed to add photo.", "error"); }
  }

  async function handleEdit(form: AddEditForm) {
    if (!editItem) return;
    const imageToUse = form.imageFile ? await toBase64(form.imageFile) : editItem.image;
    setItems((prev) => {
      const next = prev.map((i) =>
        i.id === editItem.id ? { ...i, title: form.title.trim(), description: form.description.trim(), image: imageToUse } : i
      );
      saveUserGallery(getUserItems(next));
      return next;
    });
    setEditItem(null);
    showToast("Photo updated! ✨");
  }

  function handleDelete() {
    if (!deleteItem) return;
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== deleteItem.id);
      saveUserGallery(getUserItems(next));
      return next;
    });
    setDeleteItem(null);
    showToast("Photo removed from gallery.");
  }

  return (
    <section className="px-4 py-16" id="gallery">
      {/* Header */}
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-yellow-400/72">Krishna Gallery</p>
        <h2 className="mt-3 text-4xl font-bold text-white md:text-5xl">Sacred Visual Atmosphere</h2>
        <p className="mt-4 leading-7 text-white/56">
          A devotional image sanctuary. View, download, and curate your personal collection of Krishna&apos;s divine imagery.
        </p>
      </div>

      {/* Add Button */}
      <div className="mx-auto mb-8 flex max-w-7xl justify-end">
        <motion.button
          className="flex items-center gap-2 rounded-2xl border border-yellow-400/40 bg-yellow-400/10 px-5 py-2.5 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-400/20"
          onClick={() => setShowAdd(true)}
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus className="h-4 w-4" /> Add New Photo
        </motion.button>
      </div>

      {/* Grid */}
      <div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {items.map((item) => (
            <GalleryCard
              item={item}
              key={item.id}
              onDelete={() => setDeleteItem(item)}
              onDownload={() => handleDownload(item)}
              onEdit={() => setEditItem(item)}
              onView={() => setViewItem(item)}
            />
          ))}
        </AnimatePresence>
        {mounted && items.length === 0 && (
          <div className="col-span-3 flex flex-col items-center gap-3 py-16 text-center text-white/40">
            <ImageIcon className="h-12 w-12" />
            <p className="text-lg">Gallery is empty. Add your first photo!</p>
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={`fixed bottom-6 right-6 z-[100] rounded-2xl border px-5 py-3 text-sm font-semibold backdrop-blur shadow-xl ${toast.type === "success" ? "border-teal-400/40 bg-teal-500/15 text-teal-200" : "border-red-400/40 bg-red-500/15 text-red-200"}`}
            exit={{ opacity: 0, y: 8 }}
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3 }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {viewItem && <ViewModal item={viewItem} onClose={() => setViewItem(null)} onDownload={() => handleDownload(viewItem)} />}
        {showAdd && <AddEditModal mode="add" onClose={() => setShowAdd(false)} onSave={handleAdd} />}
        {editItem && <AddEditModal item={editItem} mode="edit" onClose={() => setEditItem(null)} onSave={handleEdit} />}
        {deleteItem && <DeleteConfirm item={deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} />}
      </AnimatePresence>
    </section>
  );
}

export default GalleryManager;
