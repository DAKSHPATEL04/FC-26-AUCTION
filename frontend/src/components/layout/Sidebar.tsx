"use client";

import { usePathname, useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Shield,
  Layers,
  Tv2,
  BarChart3,
  History,
  Download,
  LogOut,
  User as UserIcon,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useUserStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Admin menu links
  const adminLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Player Database", href: "/players", icon: Users },
    { name: "Team Management", href: "/teams", icon: Shield },
    { name: "Manage Squads", href: "/admin/squads", icon: Users },
    { name: "Auction Pool", href: "/auction-pool", icon: Layers },
    { name: "Live Auction", href: "/auction/live", icon: Tv2 },
    { name: "Statistics", href: "/statistics", icon: BarChart3 },
    { name: "History", href: "/history", icon: History },
    { name: "Export Summary", href: "/export", icon: Download },
  ];

  // Owner menu links
  const ownerLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Players List", href: "/players", icon: Users },
    { name: "Watchlist", href: "/watchlist", icon: BarChart3 },
    { name: "My Squad", href: "/squad", icon: Shield },
    { name: "Live Auction", href: "/auction/live", icon: Tv2 },
  ];

  const links = user?.role === "admin" ? adminLinks : ownerLinks;

  return (
    <aside className="fixed bottom-0 top-0 left-0 hidden w-[260px] flex-col border-r border-border bg-surface text-text-primary md:flex z-40">
      {/* Top Brand */}
      <div className="flex h-16 items-center px-6 border-b border-border">
        <span className="font-display text-lg font-black tracking-wider text-text-primary">
          FC 26 AUCTION
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? "bg-surface-elevated text-text-primary border-l-4 border-accent-blue"
                  : "text-text-secondary hover:bg-surface-elevated/50 hover:text-text-primary"
              }`}
            >
              <Icon size={18} className={isActive ? "text-accent-blue" : ""} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* Profile / Footer */}
      <div className="border-t border-border p-4">
        {user && (
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-elevated border border-border">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={
                    typeof user.avatar === "string" && user.avatar.startsWith("http")
                      ? `/api/image-proxy?url=${encodeURIComponent(user.avatar)}`
                      : user.avatar
                  }
                  alt={user.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <UserIcon size={18} className="text-text-secondary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-text-primary">{user.name}</p>
              <span className="inline-block rounded-full bg-accent-blue/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-blue">
                {user.role}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-accent-red hover:bg-accent-red/10 transition-all"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
