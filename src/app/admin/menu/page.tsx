"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import type { MenuItem, MenuCategory } from "@/lib/types";

const BRANCH_ID = "00000002-0000-0000-0000-000000000001";

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function MenuCatalogPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [itemsRes, catRes] = await Promise.all([
      supabase.from("menu_items").select("*, category:menu_categories(*), kitchen_station:kitchen_stations(*), variants:menu_item_variants(*)").eq("branch_id", BRANCH_ID).order("sort_order"),
      supabase.from("menu_categories").select("*").eq("branch_id", BRANCH_ID).order("sort_order"),
    ]);
    if (itemsRes.data) setItems(itemsRes.data as MenuItem[]);
    if (catRes.data) setCategories(catRes.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleStatus(item: MenuItem) {
    const newStatus = item.status === "available" ? "soldout" : "available";
    await supabase.from("menu_items").update({ status: newStatus }).eq("id", item.id);
    setItems((prev) => prev.map((m) => m.id === item.id ? { ...m, status: newStatus } : m));
  }

  const filtered = items.filter((item) => {
    const matchCat = filterCat === "all" || item.category_id === filterCat;
    const matchStatus = filterStatus === "all" || item.status === filterStatus;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || (item.sku || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchStatus && matchSearch;
  });

  const stats = {
    total: items.length,
    available: items.filter((i) => i.status === "available").length,
    soldout: items.filter((i) => i.status === "soldout").length,
    categories: categories.length,
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-2xl font-extrabold text-on-surface tracking-tight">Katalog Menu</h2>
          <p className="text-on-surface-variant text-sm mt-1">Kelola semua menu restoran, harga, ketersediaan & varian</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:brightness-105 shadow-md transition-all">
          <span className="material-symbols-outlined text-lg">add</span>
          Tambah Menu Baru
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Menu", value: stats.total, icon: "restaurant_menu", color: "text-primary" },
          { label: "Tersedia", value: stats.available, icon: "check_circle", color: "text-primary" },
          { label: "Habis / Soldout", value: stats.soldout, icon: "remove_circle", color: "text-error" },
          { label: "Kategori Aktif", value: stats.categories, icon: "category", color: "text-secondary" },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container rounded-xl border border-outline-variant p-4 flex items-center gap-3">
            <span className={`material-symbols-outlined text-2xl ${s.color}`}>{s.icon}</span>
            <div>
              <p className="text-2xl font-display font-bold text-on-surface">{s.value}</p>
              <p className="text-xs text-on-surface-variant">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama menu atau SKU..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-outline-variant bg-surface-container-high text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-outline-variant bg-surface-container-high text-on-surface focus:outline-none focus:border-primary"
        >
          <option value="all">Semua Kategori</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-outline-variant bg-surface-container-high text-on-surface focus:outline-none focus:border-primary"
        >
          <option value="all">Semua Status</option>
          <option value="available">Tersedia</option>
          <option value="soldout">Habis</option>
          <option value="low">Stok Menipis</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  {["Foto & Nama Menu", "SKU / Kategori", "Harga", "Station", "Rating/Terjual", "Status", "Aksi"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-high transition-colors">
                    {/* Name + Image */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative size-12 shrink-0 rounded-xl overflow-hidden border border-outline-variant bg-surface-container-high">
                          {item.image_url ? (
                            <Image src={item.image_url} alt={item.name} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="flex h-full items-center justify-center text-outline">
                              <span className="material-symbols-outlined text-xl">restaurant</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-on-surface">{item.name}</p>
                          {item.badge_label && (
                            <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">{item.badge_label}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* SKU */}
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-on-surface-variant">{item.sku}</p>
                      <p className="text-xs text-primary mt-0.5">{item.category?.name}</p>
                    </td>
                    {/* Price */}
                    <td className="px-4 py-3 font-display font-bold text-primary">{formatRupiah(item.price)}</td>
                    {/* Station */}
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container-high border border-outline-variant text-on-surface-variant">
                        {item.kitchen_station?.name ?? "–"}
                      </span>
                    </td>
                    {/* Rating */}
                    <td className="px-4 py-3">
                      <p className="flex items-center gap-1 text-xs font-semibold text-secondary">
                        <span className="material-symbols-outlined text-sm fill">star</span>
                        {item.rating ?? "–"}
                      </p>
                      <p className="text-[11px] text-on-surface-variant">{item.daily_sold} terjual</p>
                    </td>
                    {/* Status Toggle */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(item)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${item.status === "available" ? "bg-primary" : "bg-outline-variant"}`}
                      >
                        <span className={`inline-block size-3.5 transform rounded-full bg-white shadow transition-transform ${item.status === "available" ? "translate-x-4" : "translate-x-1"}`} />
                      </button>
                      <p className={`text-[10px] mt-1 font-semibold ${item.status === "available" ? "text-primary" : item.status === "soldout" ? "text-error" : "text-secondary"}`}>
                        {item.status === "available" ? "Tersedia" : item.status === "soldout" ? "Habis" : "Menipis"}
                      </p>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="flex size-8 items-center justify-center rounded-lg border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary transition">
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button className="flex size-8 items-center justify-center rounded-lg border border-outline-variant hover:border-error text-on-surface-variant hover:text-error transition">
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl opacity-30">search_off</span>
              <p>Menu tidak ditemukan</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
