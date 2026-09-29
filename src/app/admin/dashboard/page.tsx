"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import type { Table, Order } from "@/lib/types";

const BRANCH_ID = "00000002-0000-0000-0000-000000000001";

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

const TABLE_STATUS_COLOR: Record<string, { dot: string; border: string; bg: string }> = {
  kosong: { dot: "bg-primary", border: "border-primary/40 hover:border-primary", bg: "bg-surface-container-high" },
  terisi: { dot: "bg-error", border: "border-error/40 hover:border-error", bg: "bg-surface-container-high" },
  menunggu_makanan: { dot: "bg-secondary", border: "border-secondary/40 hover:border-secondary", bg: "bg-surface-container-high" },
  menunggu_bayar: { dot: "bg-tertiary", border: "border-tertiary/40 hover:border-tertiary", bg: "bg-surface-container-high" },
};

export default function DashboardPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ menuTotal: 0, menuAvailable: 0, menuSoldout: 0, revenueToday: 0, txToday: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [tablesRes, ordersRes, menuRes] = await Promise.all([
        supabase.from("tables").select("*, area:table_areas(*)").eq("branch_id", BRANCH_ID).order("number"),
        supabase.from("orders").select("*, table_session:table_sessions(*, table:tables(*)), order_items(count)").eq("branch_id", BRANCH_ID).order("created_at", { ascending: false }).limit(10),
        supabase.from("menu_items").select("status").eq("branch_id", BRANCH_ID),
      ]);
      if (tablesRes.data) setTables(tablesRes.data as Table[]);
      if (ordersRes.data) setOrders(ordersRes.data as unknown as Order[]);
      if (menuRes.data) {
        const all = menuRes.data;
        const available = all.filter((m) => m.status === "available").length;
        const soldout = all.filter((m) => m.status === "soldout").length;
        setStats({ menuTotal: all.length, menuAvailable: available, menuSoldout: soldout, revenueToday: 4850000, txToday: 86 });
      }
      setLoading(false);
    }
    load();

    // Realtime table updates
    const channel = supabase.channel("tables-realtime").on("postgres_changes", { event: "*", schema: "public", table: "tables" }, () => load()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const terisi = tables.filter((t) => t.status === "terisi").length;
  const kosong = tables.filter((t) => t.status === "kosong").length;
  const menunggu = tables.filter((t) => t.status === "menunggu_makanan").length;

  const statusLabel: Record<string, string> = {
    pesanan_baru: "Baru",
    diproses_dapur: "Diproses",
    siap_saji: "Siap Saji",
    selesai: "Selesai",
    dibatalkan: "Batal",
  };
  const statusColor: Record<string, string> = {
    pesanan_baru: "bg-primary/10 text-primary",
    diproses_dapur: "bg-secondary-container/20 text-secondary",
    siap_saji: "bg-tertiary-container/20 text-tertiary",
    selesai: "bg-surface-container-highest text-on-surface-variant",
    dibatalkan: "bg-error/10 text-error",
  };

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-low p-6 rounded-xl border border-outline-variant">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-headline-lg text-2xl lg:text-3xl font-extrabold text-on-surface tracking-tight">Ringkasan Restoran Hari Ini</h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-container/20 text-primary border border-primary/30">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Supabase Synced
            </span>
          </div>
          <p className="text-on-surface-variant text-sm mt-1">Pemantauan operasional meja, pesanan, dan menu secara real-time.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/menu" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-container-highest font-label-lg text-sm transition-colors">
            <span className="material-symbols-outlined text-primary text-lg">restaurant</span>
            + Tambah Menu
          </Link>
          <Link href="/admin/tables" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-container-highest font-label-lg text-sm transition-colors">
            <span className="material-symbols-outlined text-primary text-lg">add_box</span>
            + Tambah Meja
          </Link>
          <Link href="/admin/kitchen" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-lg text-sm font-bold hover:brightness-105 shadow-md transition-all">
            <span className="material-symbols-outlined text-lg">soup_kitchen</span>
            Buka KDS Live
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Menu Aktif",
            value: `${stats.menuTotal}`,
            unit: "Menu",
            icon: "menu_book",
            iconColor: "text-primary",
            sub: [{ text: `${stats.menuAvailable} Tersedia`, color: "text-primary", icon: "check_circle" }, { text: `${stats.menuSoldout} Habis`, color: "text-secondary", icon: "remove_circle" }],
          },
          {
            label: "Okupansi Meja",
            value: `${terisi}/${tables.length}`,
            unit: "Meja Terisi",
            icon: "chair",
            iconColor: "text-secondary",
            sub: [{ text: `${Math.round((terisi / (tables.length || 1)) * 100)}% Kapasitas`, color: "text-secondary", icon: "pie_chart" }, { text: `${kosong} Meja Kosong`, color: "text-primary", icon: "meeting_room" }],
          },
          {
            label: "Pesanan Hari Ini",
            value: `${stats.txToday}`,
            unit: "Transaksi",
            icon: "receipt_long",
            iconColor: "text-primary",
            sub: [{ text: `${formatRupiah(stats.revenueToday)} Pendapatan`, color: "text-primary", icon: "payments" }],
          },
          {
            label: "Antre KDS Aktif",
            value: `${orders.filter((o) => o.status === "diproses_dapur").length}`,
            unit: "Pesanan Dapur",
            icon: "soup_kitchen",
            iconColor: "text-tertiary",
            sub: [{ text: `${orders.filter((o) => o.status === "pesanan_baru").length} Pesanan Baru`, color: "text-secondary", icon: "fiber_new" }],
          },
        ].map((card) => (
          <div key={card.label} className="p-5 rounded-xl bg-surface-container border border-outline-variant hover:border-primary/50 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-on-surface-variant text-sm font-medium">{card.label}</span>
              <span className={`w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center ${card.iconColor}`}>
                <span className="material-symbols-outlined text-xl">{card.icon}</span>
              </span>
            </div>
            <div>
              <div className="text-3xl font-display font-bold text-on-surface tracking-tight">
                {card.value} <span className="text-sm font-normal text-on-surface-variant">{card.unit}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs font-semibold flex-wrap">
                {card.sub.map((s) => (
                  <span key={s.text} className={`flex items-center gap-0.5 ${s.color}`}>
                    <span className="material-symbols-outlined text-sm">{s.icon}</span> {s.text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Map */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-surface-container rounded-xl border border-outline-variant p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant">
              <div>
                <h3 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">grid_view</span>
                  Peta Status Meja Real-time ({tables.length} Meja)
                </h3>
                <p className="text-xs text-on-surface-variant">Status langsung terhubung dengan QR Customer & KDS</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {[{ color: "bg-primary", label: "Kosong", count: kosong }, { color: "bg-error", label: "Terisi", count: terisi }, { color: "bg-secondary", label: "Menunggu Makanan", count: menunggu }].map((leg) => (
                  <span key={leg.label} className="flex items-center gap-1.5 font-medium text-on-surface">
                    <span className={`w-3 h-3 rounded-full ${leg.color}`} />
                    {leg.label} ({leg.count})
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-5">
              {tables.map((table) => {
                const sc = TABLE_STATUS_COLOR[table.status] || TABLE_STATUS_COLOR.kosong;
                return (
                  <Link
                    key={table.id}
                    href={`/menu/${table.number}`}
                    className={`${sc.bg} rounded-lg p-3 border ${sc.border} flex flex-col justify-between hover:shadow-md transition-all group`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-on-surface">{table.label}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${sc.dot}`} />
                    </div>
                    <div className="text-[11px] text-on-surface-variant mb-2">
                      <p className="font-medium text-on-surface truncate capitalize">{table.status.replace("_", " ")}</p>
                      <p className="text-[10px] text-primary-fixed">{table.seats} kursi</p>
                    </div>
                    <span className="w-full text-center py-1 text-[11px] font-semibold bg-surface-container-highest hover:bg-primary hover:text-on-primary rounded text-on-surface-variant transition-colors flex items-center justify-center gap-1">
                      <span className="material-symbols-outlined text-xs">qr_code_2</span> Scan
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Recent Orders */}
          <section className="bg-surface-container rounded-xl border border-outline-variant p-5 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant mb-4">
              <h3 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                Pesanan Terkini
              </h3>
              <Link href="/admin/kitchen" className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline">
                KDS Live <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-on-surface-variant font-semibold border-b border-outline-variant">
                    <th className="pb-2 pr-4">Order #</th>
                    <th className="pb-2 pr-4">Meja</th>
                    <th className="pb-2 pr-4">Total</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-surface-container-high transition-colors">
                      <td className="py-2.5 pr-4 font-mono text-xs font-medium text-on-surface">{order.order_number}</td>
                      <td className="py-2.5 pr-4 text-xs text-on-surface-variant">{order.table_session?.table?.label ?? "–"}</td>
                      <td className="py-2.5 pr-4 text-xs font-semibold text-on-surface">{formatRupiah(order.total)}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusColor[order.status] ?? "bg-surface-container text-on-surface-variant"}`}>
                          {statusLabel[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <Link href={`/order/${order.order_number}`} className="text-primary hover:underline text-xs font-medium">Detail</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          {/* Best Sellers */}
          <section className="bg-surface-container rounded-xl border border-outline-variant p-5 shadow-sm">
            <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2 pb-4 border-b border-outline-variant mb-4">
              <span className="material-symbols-outlined text-secondary">local_fire_department</span>
              Menu Terlaris Hari Ini
            </h3>
            <div className="space-y-3">
              {[
                { rank: 1, name: "Wagyu Ribeye Steak", sold: 48, price: 175000 },
                { rank: 2, name: "Iced Lychee Tea", sold: 62, price: 28000 },
                { rank: 3, name: "Truffle Mac & Cheese", sold: 36, price: 85000 },
                { rank: 4, name: "Es Kopi Susu Aren Melati", sold: 45, price: 22000 },
                { rank: 5, name: "Nasi Goreng Wagyu Kecombrang", sold: 38, price: 65000 },
              ].map((item) => (
                <div key={item.rank} className="flex items-center gap-3">
                  <span className={`flex size-7 items-center justify-center rounded-full text-xs font-black ${item.rank === 1 ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-highest text-on-surface-variant"}`}>
                    {item.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{item.name}</p>
                    <p className="text-[11px] text-on-surface-variant">{item.sold} terjual • {formatRupiah(item.price)}</p>
                  </div>
                  <div className="w-16 bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: `${(item.sold / 62) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Staff Calls */}
          <section className="bg-surface-container rounded-xl border border-outline-variant p-5 shadow-sm">
            <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2 pb-4 border-b border-outline-variant mb-4">
              <span className="material-symbols-outlined text-error">notifications_active</span>
              Panggilan Staf
              <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-error text-[10px] font-bold text-on-error">2</span>
            </h3>
            <div className="space-y-2">
              {[
                { table: "M-07", type: "Waiter", msg: "Refill air minum & sambal ekstra", time: "30 dtk lalu", urgent: true },
                { table: "M-04", type: "Bill Request", msg: "Minta tagihan / bill", time: "5 mnt lalu", urgent: true },
                { table: "M-01", type: "Waiter", msg: "Tambah sendok dan garpu", time: "20 mnt lalu", urgent: false },
              ].map((call) => (
                <div key={call.table + call.type} className={`flex items-start gap-3 p-3 rounded-xl border ${call.urgent ? "border-error/30 bg-error/5" : "border-outline-variant/40 bg-surface-container-high"}`}>
                  <span className={`material-symbols-outlined text-xl ${call.urgent ? "text-error" : "text-on-surface-variant"}`}>
                    {call.type === "Bill Request" ? "receipt_long" : "room_service"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-on-surface">{call.table} — {call.type}</p>
                    <p className="text-[11px] text-on-surface-variant truncate">{call.msg}</p>
                    <p className="text-[10px] text-outline mt-0.5">{call.time}</p>
                  </div>
                  <button className="text-[10px] font-bold text-primary hover:underline shrink-0">Proses</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
