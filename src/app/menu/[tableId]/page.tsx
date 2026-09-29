"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import type { MenuItem, MenuCategory, CartItem, TableSession } from "@/lib/types";

const BRANCH_ID = "00000002-0000-0000-0000-000000000001";

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function EMenuPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [session, setSession] = useState<TableSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [callStaffOpen, setCallStaffOpen] = useState(false);
  const [customerNote, setCustomerNote] = useState("");

  useEffect(() => {
    async function load() {
      const [catRes, menuRes, sessionRes] = await Promise.all([
        supabase
          .from("menu_categories")
          .select("*")
          .eq("branch_id", BRANCH_ID)
          .order("sort_order"),
        supabase
          .from("menu_items")
          .select("*, category:menu_categories(*), variants:menu_item_variants(*)")
          .eq("branch_id", BRANCH_ID)
          .order("sort_order"),
        supabase
          .from("table_sessions")
          .select("*, table:tables(*, area:table_areas(*))")
          .eq("status", "active")
          .ilike("table_sessions.table.label", `M-${tableId.padStart(2, "0")}`)
          .maybeSingle(),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (menuRes.data) setMenuItems(menuRes.data as MenuItem[]);
      if (sessionRes.data) setSession(sessionRes.data as TableSession);
      setLoading(false);
    }
    load();
  }, [tableId]);

  const filtered = menuItems.filter((item) => {
    const matchCat = activeCategory === "all" || item.category_id === activeCategory;
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const cartTotal = cart.reduce((s, c) => s + c.menuItem.price * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  const updateQty = useCallback((item: MenuItem, delta: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.menuItem.id === item.id);
      if (idx === -1 && delta > 0) return [...prev, { menuItem: item, quantity: 1, notes: "" }];
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + delta };
      return updated.filter((c) => c.quantity > 0);
    });
  }, []);

  const getQty = (id: string) => cart.find((c) => c.menuItem.id === id)?.quantity ?? 0;

  const tableLabel = tableId.padStart(2, "0");

  async function handleCheckoutWA() {
    const lines = cart.map((c) => `• ${c.quantity}x ${c.menuItem.name} — ${formatRupiah(c.menuItem.price * c.quantity)}${c.notes ? ` [${c.notes}]` : ""}`).join("\n");
    const msg = `*Pesanan Baru — Meja #${tableLabel}*\n\n${lines}\n\n*Total: ${formatRupiah(cartTotal)}*\n\nCatatan: ${customerNote || "-"}`;
    window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(msg)}`, "_blank");
    setCartOpen(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-on-surface-variant">Memuat menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-surface pb-36 shadow-2xl overflow-x-hidden border-x border-outline-variant/30">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-outline-variant/30 bg-surface/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary-container/20 text-primary border border-primary/20">
            <span className="material-symbols-outlined text-2xl">restaurant_menu</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-display text-base font-bold tracking-tight text-on-surface">Epicure Resto</h1>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">LIVE</span>
            </div>
            <p className="text-xs text-on-surface-variant">Table ID: #{tableLabel} • Indoors</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCallStaffOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg border border-outline-variant bg-surface-container text-on-surface-variant hover:text-primary transition"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
          </button>
          <button className="flex size-9 items-center justify-center rounded-lg border border-outline-variant bg-surface-container text-on-surface-variant hover:text-primary transition">
            <span className="material-symbols-outlined text-xl">wifi</span>
          </button>
        </div>
      </header>

      {/* Welcome Banner */}
      <section className="p-4 pt-3">
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-surface-container-low via-surface-container to-surface-container-high p-4 shadow-lg">
          <div className="absolute -right-6 -top-6 size-24 rounded-full bg-primary/10 blur-xl" />
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1 z-10">
              <div className="flex items-center gap-1.5">
                <span className="flex size-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs text-primary font-bold uppercase tracking-wider">Token QR Terverifikasi ✓</span>
              </div>
              <h2 className="font-display text-lg font-bold text-on-surface leading-snug">Selamat Datang di Epicure Resto</h2>
              <p className="text-xs text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-secondary">table_restaurant</span>
                Meja #{tableLabel} (Area Indoor AC) • Sesi Aktif
              </p>
            </div>
            <button className="flex items-center gap-1 rounded-lg border border-outline-variant/60 bg-surface-container-highest/80 px-2.5 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-bright transition shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
              <span>Ganti Meja</span>
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-outline-variant/40 pt-2.5 text-[11px] text-on-surface-variant">
            <span>Token: <span className="font-mono font-medium text-primary">tk_8f2a</span></span>
            <span className="flex items-center gap-1 text-secondary">
              <span className="material-symbols-outlined text-xs">schedule</span>
              Pemesanan Langsung Meja
            </span>
          </div>
        </div>
      </section>

      {/* Search + Category Filter */}
      <div className="sticky top-14 z-20 bg-surface/95 backdrop-blur-md pb-2 pt-1 border-b border-outline-variant/20">
        <div className="px-4 pb-2">
          <label className="relative flex items-center w-full">
            <span className="absolute left-3.5 flex items-center text-outline pointer-events-none">
              <span className="material-symbols-outlined text-xl">search</span>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-xl border border-outline-variant bg-surface-container-high pl-10 pr-10 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
              placeholder="Cari makanan, minuman, camilan..."
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3.5 flex items-center text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </label>
        </div>
        <nav className="flex gap-2 px-4 overflow-x-auto no-scrollbar py-1 text-sm font-medium">
          <button
            onClick={() => setActiveCategory("all")}
            className={`flex h-8 shrink-0 items-center justify-center rounded-full px-4 text-xs font-semibold transition ${activeCategory === "all" ? "bg-primary-container text-on-primary shadow-sm" : "border border-outline-variant bg-surface-container text-on-surface hover:bg-surface-bright"}`}
          >
            Semua ({menuItems.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex h-8 shrink-0 items-center justify-center rounded-full px-3.5 text-xs font-semibold transition ${activeCategory === cat.id ? "bg-primary-container text-on-primary shadow-sm" : "border border-outline-variant bg-surface-container text-on-surface hover:bg-surface-bright"}`}
            >
              {cat.name} ({menuItems.filter((m) => m.category_id === cat.id).length})
            </button>
          ))}
        </nav>
      </div>

      {/* Menu Items */}
      <main className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold tracking-tight text-on-surface">
            {search ? `Hasil "${search}"` : "Menu Rekomendasi Hari Ini"}
          </h3>
          <span className="text-xs text-secondary font-medium flex items-center gap-0.5">
            <span className="material-symbols-outlined text-sm">local_fire_department</span>
            Chef&apos;s Selection
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl opacity-30">search_off</span>
            <p className="text-sm">Menu tidak ditemukan</p>
          </div>
        ) : (
          filtered.map((item) => {
            const qty = getQty(item.id);
            return (
              <div
                key={item.id}
                className={`flex gap-3.5 rounded-2xl border bg-surface-container p-3.5 shadow-sm transition ${item.status === "soldout" ? "opacity-60 border-outline-variant/20" : "border-outline-variant/40 hover:border-primary/40"}`}
              >
                <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-high">
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-outline">
                      <span className="material-symbols-outlined text-3xl">restaurant</span>
                    </div>
                  )}
                  {item.badge_label && (
                    <span className={`absolute top-1.5 left-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${item.badge_label === "Best Seller" ? "bg-secondary-container text-on-secondary-container" : item.badge_label.includes("Pedas") ? "bg-error/90 text-on-error" : "bg-tertiary-container/80 text-on-tertiary-container"}`}>
                      {item.badge_label}
                    </span>
                  )}
                  {item.status === "soldout" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface-container-highest/80">
                      <span className="text-[10px] font-bold text-error">Habis</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h4 className="font-display text-sm font-bold text-on-surface leading-snug">{item.name}</h4>
                    <p className="mt-1 line-clamp-2 text-[11px] text-on-surface-variant">{item.description}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-display text-sm font-bold text-primary">{formatRupiah(item.price)}</span>
                    {item.status !== "soldout" ? (
                      qty > 0 ? (
                        <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary-container/10 px-2 py-1">
                          <button onClick={() => updateQty(item, -1)} className="text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-base">remove</span>
                          </button>
                          <span className="text-xs font-bold text-primary min-w-[12px] text-center">{qty}</span>
                          <button onClick={() => updateQty(item, 1)} className="text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-base">add</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => updateQty(item, 1)}
                          className="flex items-center gap-1 rounded-lg border border-primary/50 bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary hover:text-on-primary transition"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                          <span>Tambah</span>
                        </button>
                      )
                    ) : (
                      <span className="text-xs font-medium text-error bg-error/10 px-2 py-1 rounded-lg">Habis</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md px-3 pb-3">
          <div className="flex items-center justify-between rounded-2xl border border-primary/40 bg-surface-container-high/95 p-3 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="relative flex size-11 items-center justify-center rounded-xl bg-primary text-on-primary font-bold shadow-md">
                <span className="material-symbols-outlined text-2xl">shopping_bag</span>
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-on-secondary ring-2 ring-surface">{cartCount}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-on-surface-variant">{cartCount} Menu Terpilih</span>
                <span className="font-display text-base font-extrabold text-on-surface">{formatRupiah(cartTotal)}</span>
              </div>
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 font-display text-xs font-bold text-on-primary shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition"
            >
              <span>Pesan Sekarang</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end" onClick={(e) => e.target === e.currentTarget && setCartOpen(false)}>
          <div className="relative max-h-[85dvh] w-full max-w-md mx-auto rounded-t-3xl border-t border-outline-variant/50 bg-surface-container-high p-5 shadow-2xl overflow-y-auto no-scrollbar">
            <div className="flex flex-col items-center">
              <div className="h-1.5 w-12 rounded-full bg-outline-variant mb-4" />
              <div className="flex w-full items-center justify-between border-b border-outline-variant/40 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-2xl">receipt_long</span>
                  <div>
                    <h3 className="font-display text-base font-bold text-on-surface">Detail Pesanan Meja #{tableLabel}</h3>
                    <p className="text-[11px] text-on-surface-variant">Konfirmasi sebelum dikirim ke Kasir & Dapur</p>
                  </div>
                </div>
                <button onClick={() => setCartOpen(false)} className="flex size-8 items-center justify-center rounded-full bg-surface-container text-on-surface-variant hover:text-white">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {cart.map((c) => (
                <div key={c.menuItem.id} className="flex items-center gap-3 rounded-xl bg-surface-container p-3 border border-outline-variant/30">
                  <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary-container/10 px-2 py-1">
                    <button onClick={() => updateQty(c.menuItem, -1)} className="text-primary"><span className="material-symbols-outlined text-base">remove</span></button>
                    <span className="text-xs font-bold text-primary min-w-[12px] text-center">{c.quantity}</span>
                    <button onClick={() => updateQty(c.menuItem, 1)} className="text-primary"><span className="material-symbols-outlined text-base">add</span></button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-on-surface">{c.menuItem.name}</p>
                    <input
                      value={c.notes}
                      onChange={(e) => setCart((prev) => prev.map((x) => x.menuItem.id === c.menuItem.id ? { ...x, notes: e.target.value } : x))}
                      placeholder="Catatan (opsional)"
                      className="mt-1 w-full text-[11px] text-on-surface-variant bg-transparent border-b border-outline-variant/30 focus:outline-none focus:border-primary placeholder:text-outline"
                    />
                  </div>
                  <span className="text-sm font-bold text-primary">{formatRupiah(c.menuItem.price * c.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 text-sm border-t border-outline-variant/30 pt-4">
              <div className="flex justify-between text-on-surface-variant"><span>Subtotal</span><span className="font-semibold text-on-surface">{formatRupiah(cartTotal)}</span></div>
              <div className="flex justify-between text-on-surface-variant"><span>PB1 (10%)</span><span className="font-semibold text-on-surface">{formatRupiah(Math.round(cartTotal * 0.1))}</span></div>
              <div className="flex justify-between text-on-surface-variant"><span>Service (5%)</span><span className="font-semibold text-on-surface">{formatRupiah(Math.round(cartTotal * 0.05))}</span></div>
              <div className="flex justify-between font-bold text-on-surface border-t border-outline-variant/30 pt-2">
                <span>Total</span>
                <span className="text-primary font-display text-base">{formatRupiah(Math.round(cartTotal * 1.15))}</span>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-medium text-on-surface-variant mb-1 block">Catatan Khusus untuk Dapur</label>
              <textarea
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Contoh: Sambal dipisah, kurangi garam, alergi kacang..."
                rows={2}
                className="w-full rounded-xl border border-outline-variant bg-surface-container p-3 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={handleCheckoutWA}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-primary-container py-3.5 font-display font-bold text-on-primary shadow-lg hover:brightness-110 active:scale-95 transition"
            >
              <span className="material-symbols-outlined">send</span>
              Kirim Pesanan via WhatsApp Kasir
            </button>
          </div>
        </div>
      )}

      {/* Call Staff Modal */}
      {callStaffOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center" onClick={(e) => e.target === e.currentTarget && setCallStaffOpen(false)}>
          <div className="w-full max-w-md rounded-t-3xl bg-surface-container-high p-5 border-t border-outline-variant/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-on-surface">Panggil Bantuan</h3>
              <button onClick={() => setCallStaffOpen(false)} className="size-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-white">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "room_service", label: "Panggil Waiter", type: "waiter" },
                { icon: "receipt_long", label: "Minta Bill", type: "bill_request" },
                { icon: "water_drop", label: "Refill Air", type: "refill" },
                { icon: "help", label: "Bantuan Lain", type: "other" },
              ].map((item) => (
                <button
                  key={item.type}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container p-4 hover:border-primary hover:bg-primary/5 transition"
                >
                  <span className="material-symbols-outlined text-2xl text-primary">{item.icon}</span>
                  <span className="text-xs font-semibold text-on-surface">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
