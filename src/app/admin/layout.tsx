"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Přehled" },
  { href: "/admin/media", label: "Média" },
  { href: "/admin/displays", label: "Displeje" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen">
      <aside className="w-56 bg-zinc-900 text-white flex flex-col">
        <div className="p-4 text-lg font-bold border-b border-zinc-700">
          Cukrárna Signage
        </div>
        <nav className="flex-1 p-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-sm ${
                  isActive
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 bg-zinc-50 overflow-auto">{children}</main>
    </div>
  );
}
