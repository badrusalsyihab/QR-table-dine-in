"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

type PaymentTab = "qris" | "va" | "cashier";

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

const VA_BANKS = [
  { bank: "BCA", code: "8801 2024 0904 12", logo: "BCA" },
  { bank: "Mandiri", code: "8932 0240 9041 2", logo: "MDR" },
  { bank: "BRI", code: "1280 0240 9041 2", logo: "BRI" },
];

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<PaymentTab>("qris");
  const [countdown, setCountdown] = useState(899);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("orders")
        .select("*, table_session:table_sessions(*, table:tables(*)), order_items(*, menu_item:menu_items(*))")
        .eq("order_number", orderId)
        .single();
      if (data) setOrder(data as unknown as Order);
      setLoading(false);
    }
    load();
  }, [orderId]);

  // QRIS countdown timer
  useEffect(() => {
    if (tab !== "qris") return;
    const timer = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [tab]);

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function copyCode(code: string, bank: string) {
    navigator.clipboard.writeText(code.replace(/\s/g, ""));
    setCopiedBank(bank);
    setTimeout(() => setCopiedBank(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="size-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-slate-600">
        <span className="material-symbols-outlined text-5xl text-slate-300">receipt_long</span>
        <p className="font-display font-bold text-slate-700">Pesanan tidak ditemukan</p>
        <Link href="/admin/dashboard" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Dashboard</Link>
      </div>
    );
  }

  const tableLabel = order.table_session?.table?.label ?? "04";
  const guestName = order.table_session?.guest_name ?? "Tamu";

  return (
    <div className="bg-slate-50 text-slate-800 font-sans min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/order/${orderId}`} className="size-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>
            <div>
              <h1 className="font-display font-bold text-lg text-slate-900 leading-tight">Pembayaran Pesanan</h1>
              <p className="text-xs text-slate-500 font-medium">Epicure Kitchen Bistro & Dining</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="material-symbols-outlined text-[16px] text-emerald-700">table_restaurant</span>
            {tableLabel}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Order Metadata */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-slate-900">#{order.order_number}</span>
                <span className="bg-amber-100 text-amber-800 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  Menunggu Bayar
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemesan: <strong className="text-slate-700 font-semibold">{guestName}</strong> • {tableLabel} (Indoor AC)
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            {new Date(order.created_at).toLocaleString("id-ID")}
          </p>
        </div>

        {/* Total Card */}
        <section className="bg-white rounded-2xl border-2 border-emerald-500/30 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-emerald-100/90">Total Yang Harus Dibayar</span>
                <div className="text-3xl font-display font-extrabold tracking-tight mt-1">{formatRupiah(order.total)}</div>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-xl p-2.5">
                <span className="material-symbols-outlined text-[28px]">payments</span>
              </div>
            </div>
          </div>
          <details className="group" open>
            <summary className="flex cursor-pointer items-center justify-between px-5 py-3.5 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-200/80 select-none">
              <span className="font-medium text-xs sm:text-sm text-slate-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">shopping_bag</span>
                Rincian Tagihan ({order.order_items?.length ?? 0} Menu)
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 group-open:text-emerald-700 font-medium">
                <span>Detail</span>
                <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-open:rotate-180">expand_more</span>
              </div>
            </summary>
            <div className="p-5 space-y-3 bg-white text-xs sm:text-sm">
              <div className="space-y-2 pb-3 border-b border-dashed border-slate-200 text-slate-600">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.quantity}x {item.menu_item?.name}</span>
                    <span className="font-medium text-slate-800">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 text-slate-600 pt-1">
                <div className="flex justify-between"><span>Subtotal Menu</span><span className="font-semibold text-slate-800">{formatRupiah(order.subtotal)}</span></div>
                <div className="flex justify-between"><span>Pajak Restoran (PB1 10%)</span><span className="font-semibold text-slate-800">{formatRupiah(order.tax_amount)}</span></div>
                <div className="flex justify-between"><span>Biaya Layanan / Service (5%)</span><span className="font-semibold text-slate-800">{formatRupiah(order.service_charge_amount)}</span></div>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                <span>Total Akhir</span>
                <span className="text-emerald-600 font-display">{formatRupiah(order.total)}</span>
              </div>
            </div>
          </details>
        </section>

        {/* Payment Methods */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-slate-900 text-base">Pilih Metode Pembayaran</h2>
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Proses Otomatis</span>
          </div>
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-200/80 rounded-xl">
            {(["qris", "va", "cashier"] as PaymentTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg font-medium text-xs transition ${tab === t ? "bg-white shadow-sm font-semibold text-emerald-700 border border-emerald-200" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
              >
                <span className="material-symbols-outlined text-[20px] mb-0.5">{t === "qris" ? "qr_code_scanner" : t === "va" ? "account_balance" : "point_of_sale"}</span>
                <span>{t === "qris" ? "QRIS Instan" : t === "va" ? "Transfer VA" : "Kasir / EDC"}</span>
              </button>
            ))}
          </div>

          {/* QRIS Panel */}
          {tab === "qris" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200/80 px-3.5 py-2.5 rounded-xl">
                <div className="flex items-center gap-2 text-amber-800 text-xs font-medium">
                  <span className="material-symbols-outlined text-[18px] text-amber-500">timer</span>
                  <span>QR kedaluwarsa dalam</span>
                  <span className="font-display font-bold text-base text-amber-900">{formatTime(countdown)}</span>
                </div>
                <button onClick={() => setCountdown(899)} className="text-[11px] font-bold text-amber-700 hover:underline">Perbarui</button>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="w-48 h-48 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                  <div className="grid grid-cols-5 grid-rows-5 gap-1 p-4">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div key={i} className={`w-4 h-4 rounded-sm ${Math.random() > 0.5 ? "bg-slate-800" : "bg-white"}`} />
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-900">Epicure Resto</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">NMID: ID102039201923</p>
                  <p className="text-xs text-slate-500 mt-1">Scan dengan aplikasi bank / e-wallet manapun</p>
                </div>
                <div className="flex items-center gap-3 w-full">
                  {["GoPay", "OVO", "Dana", "ShopeePay", "BSI"].map((e) => (
                    <div key={e} className="flex-1 text-center py-1.5 px-1 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-semibold text-slate-500">{e}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VA Panel */}
          {tab === "va" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <p className="text-sm font-semibold text-slate-700">Pilih Bank Tujuan Transfer:</p>
              {VA_BANKS.map((bank) => (
                <div key={bank.bank} className="border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 hover:border-emerald-300 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white text-[11px] font-bold">{bank.logo}</div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Virtual Account {bank.bank}</p>
                      <p className="font-mono font-bold text-slate-900 text-sm tracking-widest">{bank.code}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyCode(bank.code, bank.bank)}
                    className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition ${copiedBank === bank.bank ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{copiedBank === bank.bank ? "check" : "content_copy"}</span>
                    {copiedBank === bank.bank ? "Disalin!" : "Salin"}
                  </button>
                </div>
              ))}
              <p className="text-[11px] text-slate-400 bg-slate-50 p-3 rounded-xl">Nominal transfer harus tepat <strong className="text-slate-700">{formatRupiah(order.total)}</strong>. Pembayaran dikonfirmasi otomatis dalam 1–5 menit.</p>
            </div>
          )}

          {/* Cashier Panel */}
          {tab === "cashier" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="size-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-emerald-600">point_of_sale</span>
                </div>
                <div className="text-center">
                  <p className="font-display font-bold text-slate-900">Bayar di Kasir / EDC</p>
                  <p className="text-sm text-slate-500 mt-1">Tunjukkan nomor pesanan ini ke kasir</p>
                  <div className="mt-3 inline-block bg-slate-900 text-white font-mono font-bold text-xl px-6 py-3 rounded-2xl tracking-widest">{order.order_number}</div>
                </div>
                <p className="text-xs text-slate-400 text-center">Meja {tableLabel} • Total {formatRupiah(order.total)} • Kasir menerima: Tunai, Debit, Kredit, QRIS</p>
              </div>
            </div>
          )}
        </section>

        <Link href={`/order/${orderId}`} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 font-medium text-sm text-slate-700 hover:bg-slate-50 transition">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke Detail Pesanan
        </Link>
      </main>
    </div>
  );
}
