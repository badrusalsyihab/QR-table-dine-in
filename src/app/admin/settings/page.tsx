"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { CashierSettings } from "@/lib/types";

const BRANCH_ID = "00000002-0000-0000-0000-000000000001";

function Toggle({ value, onChange, label, desc }: { value: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-outline-variant/30 last:border-0">
      <div>
        <p className="text-sm font-semibold text-on-surface">{label}</p>
        {desc && <p className="text-xs text-on-surface-variant mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${value ? "bg-primary" : "bg-outline-variant"}`}
      >
        <span className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<CashierSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("cashier_settings").select("*").eq("branch_id", BRANCH_ID).single();
      if (data) setSettings(data as CashierSettings);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    await supabase.from("cashier_settings").update(settings).eq("id", settings.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function update<K extends keyof CashierSettings>(key: K, value: CashierSettings[K]) {
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (!settings) return (
    <div className="flex min-h-[60vh] items-center justify-center text-on-surface-variant">
      <p>Data pengaturan tidak ditemukan</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline-lg text-2xl font-extrabold text-on-surface tracking-tight">Pengaturan Kasir</h2>
          <p className="text-on-surface-variant text-sm mt-1">Konfigurasi WhatsApp Kasir, pajak, dan metode pembayaran</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition shadow-md ${saved ? "bg-primary text-on-primary" : "bg-primary-container text-on-primary hover:brightness-105"} disabled:opacity-60`}
        >
          <span className="material-symbols-outlined text-base">{saved ? "check" : "save"}</span>
          {saving ? "Menyimpan..." : saved ? "Tersimpan!" : "Simpan Perubahan"}
        </button>
      </div>

      {/* WhatsApp Settings */}
      <section className="bg-surface-container rounded-2xl border border-outline-variant p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-outline-variant">
          <span className="material-symbols-outlined text-primary text-xl">chat</span>
          <h3 className="font-display font-bold text-on-surface">Konfigurasi WhatsApp Kasir</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Nomor WhatsApp Kasir</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant font-medium">+62</span>
              <input
                value={(settings.wa_number ?? "").replace("+62", "")}
                onChange={(e) => update("wa_number", "+62" + e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-high text-on-surface text-sm focus:outline-none focus:border-primary"
                placeholder="812-3456-7890"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Label / Nama Kasir</label>
            <input
              value={settings.wa_label ?? ""}
              onChange={(e) => update("wa_label", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-high text-on-surface text-sm focus:outline-none focus:border-primary"
              placeholder="Kasir Utama Epicure Dining"
            />
          </div>
        </div>

        <div className="bg-surface-container-high rounded-xl p-3 flex items-center gap-2 text-xs text-on-surface-variant border border-outline-variant/40">
          <span className="material-symbols-outlined text-primary text-base">link</span>
          <span>Preview: </span>
          <span className="font-mono text-primary break-all">wa.me/{(settings.wa_number ?? "").replace("+", "")}</span>
        </div>

        <Toggle value={settings.auto_open_wa} onChange={(v) => update("auto_open_wa", v)} label="Auto-buka WhatsApp setelah checkout" desc="WhatsApp terbuka otomatis saat pelanggan konfirmasi pesanan" />
        <Toggle value={settings.kitchen_bot_enabled} onChange={(v) => update("kitchen_bot_enabled", v)} label="Aktifkan Kitchen Bot" desc="Teruskan notifikasi pesanan ke grup WhatsApp dapur" />
      </section>

      {/* Tax & Service */}
      <section className="bg-surface-container rounded-2xl border border-outline-variant p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-outline-variant">
          <span className="material-symbols-outlined text-secondary text-xl">percent</span>
          <h3 className="font-display font-bold text-on-surface">Pajak & Biaya Layanan</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Pajak PB1 (%)</label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={30}
                step={0.5}
                value={settings.tax_pb1_pct}
                onChange={(e) => update("tax_pb1_pct", parseFloat(e.target.value))}
                className="w-full px-4 pr-10 py-2.5 rounded-xl border border-outline-variant bg-surface-container-high text-on-surface text-sm focus:outline-none focus:border-primary"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-bold">%</span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">Pajak daerah PB1 sesuai UU No.28 Tahun 2009</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Service Charge (%)</label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={20}
                step={0.5}
                value={settings.service_charge_pct}
                onChange={(e) => update("service_charge_pct", parseFloat(e.target.value))}
                className="w-full px-4 pr-10 py-2.5 rounded-xl border border-outline-variant bg-surface-container-high text-on-surface text-sm focus:outline-none focus:border-primary"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-bold">%</span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">Biaya layanan staf restoran</p>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-3 text-xs text-on-surface-variant border border-outline-variant/40 space-y-1">
          <p className="font-semibold text-on-surface">Simulasi tagihan Rp 100.000:</p>
          <p>PB1 {settings.tax_pb1_pct}% = Rp {(100000 * settings.tax_pb1_pct / 100).toLocaleString("id-ID")}</p>
          <p>Service {settings.service_charge_pct}% = Rp {(100000 * settings.service_charge_pct / 100).toLocaleString("id-ID")}</p>
          <p className="font-bold text-on-surface pt-1 border-t border-outline-variant/40">Total = Rp {(100000 * (1 + settings.tax_pb1_pct / 100 + settings.service_charge_pct / 100)).toLocaleString("id-ID")}</p>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="bg-surface-container rounded-2xl border border-outline-variant p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-2 pb-3 border-b border-outline-variant mb-1">
          <span className="material-symbols-outlined text-tertiary text-xl">payments</span>
          <h3 className="font-display font-bold text-on-surface">Metode Pembayaran Aktif</h3>
        </div>
        <Toggle value={settings.qris_enabled} onChange={(v) => update("qris_enabled", v)} label="QRIS Instan" desc="Bayar via GoPay, OVO, Dana, ShopeePay, BSI dll" />
        <Toggle value={settings.va_enabled} onChange={(v) => update("va_enabled", v)} label="Transfer Virtual Account" desc="BCA, Mandiri, BRI Virtual Account" />
        <Toggle value={settings.cash_enabled} onChange={(v) => update("cash_enabled", v)} label="Tunai (Cash)" desc="Pembayaran langsung ke kasir" />
        <Toggle value={settings.edc_enabled} onChange={(v) => update("edc_enabled", v)} label="EDC / Debit / Kredit" desc="Mesin EDC di kasir, semua jaringan" />
      </section>

      {/* QRIS Merchant */}
      <section className="bg-surface-container rounded-2xl border border-outline-variant p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-outline-variant">
          <span className="material-symbols-outlined text-primary text-xl">qr_code_scanner</span>
          <h3 className="font-display font-bold text-on-surface">Identitas Merchant QRIS</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Nama Merchant</label>
            <input defaultValue="Epicure Resto" className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-high text-on-surface text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">NMID (Bank Indonesia)</label>
            <input defaultValue="ID102039201923" className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-high text-on-surface font-mono text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>
        <div className="bg-surface-container-low rounded-xl p-3 flex items-start gap-2 border border-outline-variant/40 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-primary text-sm shrink-0 mt-0.5">info</span>
          <p>NMID terdaftar di Bank Indonesia. Perubahan NMID harus melalui verifikasi ulang dengan bank penerbit QRIS Anda.</p>
        </div>
      </section>
    </div>
  );
}
