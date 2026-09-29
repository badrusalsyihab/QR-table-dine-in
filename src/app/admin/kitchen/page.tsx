"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Order, OrderItem } from "@/lib/types";

const BRANCH_ID = "00000002-0000-0000-0000-000000000001";

const LANE_CONFIG = [
  { key: "pesanan_baru", label: "Pesanan Baru Masuk", icon: "inbox", color: "text-error", borderColor: "border-error/30", bgColor: "bg-error/5" },
  { key: "diproses_dapur", label: "Sedang Dimasak", icon: "skillet", color: "text-secondary", borderColor: "border-secondary/30", bgColor: "bg-secondary/5" },
  { key: "siap_saji", label: "Siap Disajikan", icon: "room_service", color: "text-primary", borderColor: "border-primary/30", bgColor: "bg-primary/5" },
  { key: "selesai", label: "Selesai / Terkirim", icon: "check_circle", color: "text-on-surface-variant", borderColor: "border-outline-variant", bgColor: "bg-surface-container" },
];

function ElapsedTimer({ since }: { since: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(since).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [since]);
  const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const s = (elapsed % 60).toString().padStart(2, "0");
  return <span className={`font-mono font-bold text-sm ${elapsed > 600 ? "text-error" : elapsed > 300 ? "text-secondary" : "text-primary"}`}>{m}:{s}</span>;
}

function KDSCard({ order, onMove }: { order: Order; onMove: (id: string, status: string) => void }) {
  const itemsDone = order.order_items?.filter((i) => i.status === "done").length ?? 0;
  const itemsTotal = order.order_items?.length ?? 0;
  const progress = itemsTotal > 0 ? (itemsDone / itemsTotal) * 100 : 0;

  const nextStatus: Record<string, string> = {
    pesanan_baru: "diproses_dapur",
    diproses_dapur: "siap_saji",
    siap_saji: "selesai",
  };
  const nextLabel: Record<string, string> = {
    pesanan_baru: "Proses Dapur",
    diproses_dapur: "Siap Saji",
    siap_saji: "Selesai",
  };

  return (
    <div className="bg-surface-container-high rounded-2xl border border-outline-variant p-4 shadow-sm hover:shadow-md transition-all space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-mono text-xs font-bold text-on-surface-variant">#{order.order_number}</span>
            {order.table_session?.table && (
              <span className="text-[10px] font-bold bg-surface-container-highest px-1.5 py-0.5 rounded text-secondary">
                {order.table_session.table.label}
              </span>
            )}
          </div>
          <p className="text-[11px] text-on-surface-variant">{order.table_session?.guest_name ?? "Tamu"}</p>
        </div>
        <ElapsedTimer since={order.created_at} />
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-[11px] text-on-surface-variant mb-1.5">
          <span>Progress Masakan</span>
          <span className="font-bold text-primary">{itemsDone}/{itemsTotal} siap</span>
        </div>
        <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Order Items Checklist */}
      <ul className="space-y-1.5">
        {order.order_items?.map((item: OrderItem) => (
          <li key={item.id} className="flex items-center gap-2">
            <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${item.status === "done" ? "bg-primary text-on-primary" : item.status === "cooking" ? "bg-secondary text-on-secondary" : "bg-surface-container-highest text-on-surface-variant"}`}>
              {item.status === "done" ? "✓" : item.quantity}
            </span>
            <span className={`text-xs flex-1 ${item.status === "done" ? "line-through text-on-surface-variant" : "text-on-surface font-medium"}`}>
              {item.menu_item?.name}
            </span>
            {item.notes && (
              <span className="text-[10px] text-secondary italic truncate max-w-[80px]" title={item.notes}>*{item.notes}</span>
            )}
          </li>
        ))}
      </ul>

      {/* Note */}
      {order.customer_note && (
        <div className="rounded-xl bg-secondary-container/15 border border-secondary/20 px-3 py-2 text-[11px] text-secondary">
          <span className="font-bold">Catatan: </span>{order.customer_note}
        </div>
      )}

      {/* Actions */}
      {nextStatus[order.status] && (
        <button
          onClick={() => onMove(order.id, nextStatus[order.status])}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-container py-2 text-xs font-bold text-on-primary hover:brightness-105 transition active:scale-95"
        >
          <span className="material-symbols-outlined text-base">arrow_forward</span>
          {nextLabel[order.status]}
        </button>
      )}
    </div>
  );
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  async function load() {
    const { data } = await supabase
      .from("orders")
      .select("*, table_session:table_sessions(*, table:tables(*)), order_items(*, menu_item:menu_items(name))")
      .eq("branch_id", BRANCH_ID)
      .in("status", ["pesanan_baru", "diproses_dapur", "siap_saji", "selesai"])
      .order("created_at", { ascending: true });
    if (data) setOrders(data as unknown as Order[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase.channel("kds-orders").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function handleMove(orderId: string, newStatus: string) {
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus as Order["status"] } : o));
  }

  const ordersByLane: Record<string, Order[]> = {};
  LANE_CONFIG.forEach((lane) => { ordersByLane[lane.key] = orders.filter((o) => o.status === lane.key); });

  const activeCount = orders.filter((o) => o.status !== "selesai").length;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* KDS Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-surface-container-low border-b border-outline-variant shrink-0">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">soup_kitchen</span>
          <div>
            <h2 className="font-headline-md text-lg font-bold text-on-surface">Kitchen Display System</h2>
            <p className="text-[11px] text-on-surface-variant">Epicure Resto — Dapur Live</p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 text-xs font-semibold ml-2">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            {activeCount} Pesanan Aktif
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm font-bold text-on-surface-variant">
            {time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          <button onClick={load} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container text-on-surface-variant hover:text-primary text-xs font-medium transition">
            <span className="material-symbols-outlined text-sm">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Kanban Lanes */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="size-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-4 h-full min-w-[900px]">
            {LANE_CONFIG.map((lane) => (
              <div key={lane.key} className="flex-1 flex flex-col gap-3 min-w-[260px]">
                {/* Lane Header */}
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${lane.borderColor} ${lane.bgColor}`}>
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-xl ${lane.color}`}>{lane.icon}</span>
                    <span className={`text-sm font-bold ${lane.color}`}>{lane.label}</span>
                  </div>
                  <span className={`flex size-6 items-center justify-center rounded-full text-[11px] font-black ${lane.color} bg-surface-container-highest`}>
                    {ordersByLane[lane.key].length}
                  </span>
                </div>

                {/* Tickets */}
                <div className="flex-1 space-y-3 overflow-y-auto pb-4 no-scrollbar">
                  {ordersByLane[lane.key].length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-on-surface-variant/40">
                      <span className="material-symbols-outlined text-3xl">inbox</span>
                      <p className="text-xs">Kosong</p>
                    </div>
                  ) : (
                    ordersByLane[lane.key].map((order) => (
                      <KDSCard key={order.id} order={order} onMove={handleMove} />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
