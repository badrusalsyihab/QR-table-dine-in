"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import type { Table, TableArea, TableSession } from "@/lib/types";

const BRANCH_ID = "00000002-0000-0000-0000-000000000001";

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function sessionDuration(startedAt: string) {
  const mins = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
  if (mins < 60) return `${mins} mnt`;
  return `${Math.floor(mins / 60)} jam ${mins % 60} mnt`;
}

const STATUS_CONFIG = {
  kosong: { label: "Kosong", color: "text-primary", bg: "bg-primary/10", dot: "bg-primary", border: "border-primary/30" },
  terisi: { label: "Terisi", color: "text-error", bg: "bg-error/10", dot: "bg-error", border: "border-error/30" },
  menunggu_makanan: { label: "Menunggu Makanan", color: "text-secondary", bg: "bg-secondary/10", dot: "bg-secondary", border: "border-secondary/30" },
  menunggu_bayar: { label: "Menunggu Bayar", color: "text-tertiary", bg: "bg-tertiary/10", dot: "bg-tertiary", border: "border-tertiary/30" },
};

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [areas, setAreas] = useState<TableArea[]>([]);
  const [sessions, setSessions] = useState<Record<string, TableSession>>({});
  const [filterArea, setFilterArea] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [tablesRes, areasRes, sessionsRes] = await Promise.all([
      supabase.from("tables").select("*, area:table_areas(*)").eq("branch_id", BRANCH_ID).order("number"),
      supabase.from("table_areas").select("*").eq("branch_id", BRANCH_ID),
      supabase.from("table_sessions").select("*").eq("status", "active"),
    ]);
    if (tablesRes.data) setTables(tablesRes.data as Table[]);
    if (areasRes.data) setAreas(areasRes.data);
    if (sessionsRes.data) {
      const map: Record<string, TableSession> = {};
      sessionsRes.data.forEach((s) => { map[s.table_id] = s as TableSession; });
      setSessions(map);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const ch = supabase.channel("tables-watch").on("postgres_changes", { event: "*", schema: "public", table: "tables" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function updateTableStatus(tableId: string, status: string) {
    await supabase.from("tables").update({ status }).eq("id", tableId);
    setTables((prev) => prev.map((t) => t.id === tableId ? { ...t, status: status as Table["status"] } : t));
  }

  const filtered = tables.filter((t) => {
    const matchArea = filterArea === "all" || t.area_id === filterArea;
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    return matchArea && matchStatus;
  });

  const terisi = tables.filter((t) => t.status === "terisi").length;
  const kosong = tables.filter((t) => t.status === "kosong").length;
  const menungguBayar = tables.filter((t) => t.status === "menunggu_bayar").length;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-2xl font-extrabold text-on-surface tracking-tight">Manajemen Meja & QR</h2>
          <p className="text-on-surface-variant text-sm mt-1">Kelola status meja, sesi tamu, dan QR token secara real-time</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant bg-surface-container text-on-surface text-sm hover:bg-surface-container-high transition">
            <span className="material-symbols-outlined text-primary text-lg">qr_code</span>
            Generate QR Baru
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-sm hover:brightness-105 shadow-md transition">
            <span className="material-symbols-outlined text-lg">add</span>
            Tambah Meja
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Meja", value: tables.length, icon: "table_restaurant", color: "text-on-surface" },
          { label: "Meja Terisi", value: terisi, icon: "people", color: "text-error" },
          { label: "Meja Kosong", value: kosong, icon: "chair", color: "text-primary" },
          { label: "Menunggu Bayar", value: menungguBayar, icon: "payments", color: "text-secondary" },
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
      <div className="flex gap-3 flex-wrap">
        <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)} className="px-3 py-2 text-sm rounded-xl border border-outline-variant bg-surface-container-high text-on-surface focus:outline-none focus:border-primary">
          <option value="all">Semua Area ({tables.length})</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.name} ({tables.filter((t) => t.area_id === a.id).length})</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm rounded-xl border border-outline-variant bg-surface-container-high text-on-surface focus:outline-none focus:border-primary">
          <option value="all">Semua Status</option>
          {Object.entries(STATUS_CONFIG).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
        </select>
      </div>

      {/* Table Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((table) => {
            const sc = STATUS_CONFIG[table.status] ?? STATUS_CONFIG.kosong;
            const session = sessions[table.id];
            return (
              <div key={table.id} className={`bg-surface-container rounded-2xl border ${sc.border} p-4 shadow-sm hover:shadow-md transition-all`}>
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-lg text-on-surface">{table.label}</h3>
                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                        <span className={`size-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">{table.area?.name ?? "–"} • {table.seats} kursi</p>
                  </div>
                  <button className="size-8 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition">
                    <span className="material-symbols-outlined text-base">more_vert</span>
                  </button>
                </div>

                {/* Session Info */}
                {session ? (
                  <div className="bg-surface-container-high rounded-xl p-3 space-y-2 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-on-surface-variant">Tamu</span>
                      <span className="font-semibold text-on-surface">{session.guest_name ?? "–"}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-on-surface-variant">Durasi</span>
                      <span className="font-semibold text-secondary">{sessionDuration(session.started_at)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-on-surface-variant">Token</span>
                      <span className="font-mono text-[10px] text-primary">{session.token}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface-container-high rounded-xl p-3 mb-3 flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-base">chair_alt</span>
                    <span className="text-xs">Meja kosong, siap digunakan</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/menu/${table.number}`}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/10 transition"
                  >
                    <span className="material-symbols-outlined text-sm">qr_code_2</span>
                    E-Menu
                  </Link>
                  {table.status !== "kosong" ? (
                    <button
                      onClick={() => updateTableStatus(table.id, "kosong")}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface-variant text-xs font-semibold hover:border-error hover:text-error transition"
                    >
                      <span className="material-symbols-outlined text-sm">logout</span>
                      Checkout
                    </button>
                  ) : (
                    <button
                      onClick={() => updateTableStatus(table.id, "terisi")}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary hover:text-on-primary transition"
                    >
                      <span className="material-symbols-outlined text-sm">login</span>
                      Check In
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
