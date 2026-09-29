"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/admin/menu", icon: "menu_book", label: "Menu Manager" },
  { href: "/admin/tables", icon: "table_restaurant", label: "Denah Meja" },
  { href: "/admin/kitchen", icon: "soup_kitchen", label: "KDS Live" },
  { href: "/admin/settings", icon: "settings", label: "Pengaturan" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md antialiased">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-surface-container border-b border-outline-variant px-6 lg:px-10 py-3 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 text-on-surface">
              <div className="w-8 h-8 rounded-lg bg-primary-container/20 border border-primary/20 flex items-center justify-center text-primary shadow-md">
                <span className="material-symbols-outlined text-xl">restaurant_menu</span>
              </div>
              <div>
                <h1 className="text-on-surface font-headline-sm text-lg font-bold leading-tight">In-Dine Admin POS</h1>
                <p className="text-on-surface-variant text-[11px] leading-none font-medium">Bistro & Table Management Engine</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-1 font-label-md">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-colors ${active ? "bg-surface-container-high text-primary font-semibold" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"}`}
                  >
                    <span className="material-symbols-outlined text-base">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block w-56 lg:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
              <input
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-surface-container-high border border-outline-variant text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
                placeholder="Cari pesanan / meja..."
              />
            </div>
            <Link
              href="/admin/kitchen"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-on-primary font-label-lg font-bold text-xs hover:brightness-105 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">tv</span>
              <span>Buka KDS Live</span>
            </Link>
            <div className="flex items-center gap-2 border-l border-outline-variant pl-4">
              <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center font-bold text-xs text-primary">
                AD
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container border-t border-outline-variant grid grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition ${active ? "text-primary" : "text-on-surface-variant"}`}>
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="pb-20 md:pb-0">{children}</main>
    </div>
  );
}
