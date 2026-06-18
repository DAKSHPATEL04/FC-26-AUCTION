"use client";

import { useState } from "react";
import { useUserStore } from "@/store/userStore";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useUserStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const adminLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Players", href: "/players" },
    { name: "Teams", href: "/teams" },
    { name: "Manage Squads", href: "/admin/squads" },
    { name: "Auction Pool", href: "/auction-pool" },
    { name: "Live Auction", href: "/auction/live" },
    { name: "Statistics", href: "/statistics" },
  ];

  const ownerLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Players", href: "/players" },
    { name: "Watchlist", href: "/watchlist" },
    { name: "My Squad", href: "/squad" },
    { name: "Live Auction", href: "/auction/live" },
  ];

  const links = user?.role === "admin" ? adminLinks : ownerLinks;

  const getPageTitle = () => {
    const segments = pathname.split("/");
    const main = segments[1];
    if (!main) return "FC 26 Auction";
    return main.charAt(0).toUpperCase() + main.slice(1).replace("-", " ");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-surface px-6 md:pl-[286px]">
      <h2 className="text-lg font-bold tracking-tight text-text-primary">
        {getPageTitle()}
      </h2>

      {/* Mobile Hamburger Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="text-text-secondary hover:text-text-primary md:hidden"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 border-b border-border bg-surface p-6 shadow-xl md:hidden z-50 animate-in fade-in slide-in-from-top-5 duration-200">
          <nav className="flex flex-col space-y-4">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm font-semibold transition-all ${
                  pathname === link.href ? "text-accent-blue" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <hr className="border-border" />
            <div className="flex items-center gap-3 py-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-elevated border border-border">
                <UserIcon size={18} className="text-text-secondary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{user?.name}</p>
                <span className="text-xs text-text-secondary uppercase">{user?.role}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-2 text-sm font-bold text-accent-red"
            >
              <LogOut size={16} />
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
