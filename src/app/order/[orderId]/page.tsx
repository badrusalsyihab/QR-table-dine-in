"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

const ORDER_STEPS = [
  { key: "pesanan_baru", label: "Pesanan Diterima Sistem", desc: "Berhasil terkirim dari meja ke POS kasir", icon: "check_circle" },
  { key: "diproses_dapur", label: "Dikonfirmasi Kepala Dapur", desc: "Tiket order cetak & bahan disiapkan", icon: "check_circle" },
  { key: "sedang_dimasak", label: "Sedang Dimasak / Disiapkan", desc: "Koki sedang meracik pesanan utama Anda", icon: "skillet" },
  { key: "siap_saji", label: "Siap Disajikan ke Meja", desc: "Waiter akan segera mengantarkan pesanan", icon: "room_service" },
];

function getStepIndex(status: string) {
  const map: Record<string, number> = {
    pesanan_baru: 0,
    diproses_dapur: 1,
    siap_saji: 3,
    selesai: 3,
  };
  return map[status] ?? 1;
}

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("orders")
        .select(`
          *,
          table_session:table_sessions(*, table:tables(*, area:table_areas(*))),
          order_items(*, menu_item:menu_items(*))
        `)
        .eq("order_number", orderId)
        .single();
      if (data) setOrder(data as unknown as Order);
      setLoading(false);
    }
    load();

    // Realtime subscription
    const channel = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        if ((payload.new as Order).order_number === orderId) {
          setOrder((prev) => prev ? { ...prev, ...payload.new } as Order : prev);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500">Memuat status pesanan...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 text-slate-600">
        <span className="material-symbols-outlined text-5xl text-slate-300">receipt_long</span>
        <p className="font-display font-bold text-slate-700">Pesanan tidak ditemukan</p>
        <Link href="/admin/dashboard" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Kembali ke Dashboard</Link>
      </div>
    );
  }

  const stepIdx = getStepIndex(order.status);
  const tableLabel = order.table_session?.table?.label ?? "–";
  const areaName = order.table_session?.table?.area?.name ?? "Indoor AC";
  const guestName = order.table_session?.guest_name ?? "–";

  return (
    <div className="bg-slate-100 text-slate-800 font-sans min-h-screen pb-14">
      <main className="max-w-md mx-auto min-h-screen bg-[#f8fafc] border-x border-slate-200/80 shadow-xl flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/menu/${order.table_session?.table?.number ?? "04"}`} className="size-10 rounded-full flex items-center justify-center text-slate-700 bg-slate-100 hover:bg-slate-200 transition active:scale-95">
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </Link>
            <div>
              <h1 className="font-display font-bold text-slate-900 text-lg leading-tight">Detail Pesanan</h1>
              <p className="text-xs font-semibold text-slate-500 font-mono">#{order.order_number}</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-sm">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Live Track</span>
          </div>
        </header>

        <div className="p-4 space-y-4 flex-1">
          {/* Stepper */}
          <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs tracking-wide uppercase">
                  <span className="material-symbols-outlined fill text-[15px]">schedule</span>
                  Estimasi Waktu Saji
                </div>
                <h2 className="text-xl font-display font-extrabold text-slate-900 mt-0.5">15 – 20 Menit lagi</h2>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                Tahap {stepIdx + 1} dari 4
              </span>
            </div>

            <div className="pt-4 space-y-0">
              {ORDER_STEPS.map((step, i) => {
                const done = i < stepIdx;
                const active = i === stepIdx;
                const pending = i > stepIdx;
                return (
                  <div key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`size-7 rounded-full flex items-center justify-center shadow-sm ${done ? "bg-emerald-600 text-white" : active ? "bg-amber-500 ring-4 ring-amber-100 text-white" : "bg-slate-100 border-2 border-slate-300 text-slate-400"}`}>
                        <span className={`material-symbols-outlined text-base ${active && step.icon === "skillet" ? "animate-spin" : ""}`} style={active && step.icon === "skillet" ? { animationDuration: "4s" } : {}}>
                          {done ? "check" : step.icon}
                        </span>
                      </div>
                      {i < ORDER_STEPS.length - 1 && (
                        <div className={`w-0.5 h-10 ${done ? "bg-emerald-500" : "bg-slate-200"}`} />
                      )}
                    </div>
                    <div className={`pb-3 pt-0.5 flex-1 ${pending ? "opacity-50" : ""}`}>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-bold ${done ? "text-slate-900" : active ? "text-amber-700" : "text-slate-400"}`}>
                          {step.label}
                        </p>
                        {done && <span className="text-[11px] text-slate-400 font-mono">selesai</span>}
                        {active && <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Proses</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                      {active && (
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full w-[65%] transition-all duration-700" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Table Info */}
          <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
              <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">table_restaurant</span>
                Informasi Meja & Pemesan
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">{areaName}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: "Nomor Meja", value: tableLabel, large: true },
                { label: "Nama Pemesan", value: guestName },
                { label: "Waktu Transaksi", value: new Date(order.created_at).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }) },
                { label: "Status Pembayaran", value: order.payment_status === "lunas" ? "Lunas" : order.payment_status === "menunggu_bayar" ? "Bayar di Kasir" : "Belum Bayar", badge: true },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-medium">{item.label}</p>
                  <p className={`font-semibold mt-0.5 ${item.large ? "text-slate-900 text-base font-bold" : "text-slate-800 text-sm"}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Order Items */}
          <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
              <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">restaurant_menu</span>
                Rincian Item yang Dipesan
              </h3>
              <span className="text-xs font-semibold text-slate-500 font-mono">{order.order_items?.length ?? 0} Menu</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {order.order_items?.map((item) => (
                <li key={item.id} className="py-2.5 flex items-start gap-3">
                  <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${item.status === "done" ? "bg-emerald-100 text-emerald-700" : item.status === "cooking" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                    {item.quantity}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{item.menu_item?.name}</p>
                    {item.notes && <p className="text-[11px] text-slate-400 italic mt-0.5">&ldquo;{item.notes}&rdquo;</p>}
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${item.status === "done" ? "bg-emerald-50 text-emerald-700" : item.status === "cooking" ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-500"}`}>
                    {item.status === "done" ? "Selesai" : item.status === "cooking" ? "Dimasak" : "Antri"}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 ml-2">{formatRupiah(item.subtotal)}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Customer Note */}
          {order.customer_note && (
            <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">note</span>
                Catatan Khusus
              </p>
              <p className="text-sm text-amber-700">{order.customer_note}</p>
            </section>
          )}

          {/* Total */}
          <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2 text-sm">
            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span className="font-semibold text-slate-800">{formatRupiah(order.subtotal)}</span></div>
            <div className="flex justify-between text-slate-500"><span>PB1 (10%)</span><span className="font-semibold text-slate-800">{formatRupiah(order.tax_amount)}</span></div>
            <div className="flex justify-between text-slate-500"><span>Service (5%)</span><span className="font-semibold text-slate-800">{formatRupiah(order.service_charge_amount)}</span></div>
            <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
              <span>Total Akhir</span>
              <span className="text-emerald-700 font-display text-base">{formatRupiah(order.total)}</span>
            </div>
          </section>

          <Link
            href={`/payment/${order.order_number}`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 font-display font-bold text-white shadow-lg hover:bg-emerald-700 active:scale-95 transition"
          >
            <span className="material-symbols-outlined">payments</span>
            Lanjut ke Pembayaran
          </Link>
        </div>
      </main>
    </div>
  );
}
