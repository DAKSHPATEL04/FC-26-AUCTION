"use client";

import { motion } from "framer-motion";
import { Plus, Eye, Bookmark, Minus } from "lucide-react";
import { Player } from "@/types/player.types";

const POSITION_COLORS: Record<string, string> = {
  GK: "#F59E0B",
  DEF: "#3B82F6",
  MID: "#22C55E",
  FWD: "#EF4444",
};

const STATUS_STYLES: Record<string, string> = {
  available: "bg-accent-green/10 text-accent-green border border-accent-green/30",
  pool: "bg-accent-amber/10 text-accent-amber border border-accent-amber/30",
  sold: "bg-accent-red/10 text-accent-red border border-accent-red/30",
  unsold: "bg-text-muted/10 text-text-muted border border-text-muted/30",
};

interface PlayerCardProps {
  player: Player;
  isAdmin?: boolean;
  onView: (player: Player) => void;
  onAddToPool?: (player: Player) => void;
  onAddToWatchlist?: (player: Player) => void;
}

export default function PlayerCard({
  player,
  isAdmin,
  onView,
  onAddToPool,
  onAddToWatchlist,
}: PlayerCardProps) {
  const posColor = POSITION_COLORS[player.positionGroup] || "#FFFFFF";
  const initials = (player.commonName || player.name)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const displayName =
    player.commonName || player.name.split(" ").slice(-1)[0] || player.name;

  return (
    <motion.div
      className="group relative flex w-full flex-col rounded-xl border overflow-hidden cursor-pointer select-none"
      style={{
        background: `linear-gradient(160deg, ${posColor}18 0%, #141414 60%)`,
        borderColor: `${posColor}30`,
        aspectRatio: "3/4",
      }}
      whileHover={{
        scale: 1.04,
        borderColor: posColor,
        transition: { duration: 0.15, ease: "easeOut" },
      }}
      onClick={() => onView(player)}
    >
      {/* Rating + Position */}
      <div className="absolute top-3 left-3 flex flex-col items-center leading-none">
        <span className="font-display text-2xl font-black text-text-primary">{player.rating}</span>
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: posColor }}>
          {player.position}
        </span>
      </div>

      {/* Status badge */}
      <div className="absolute top-3 right-3">
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${STATUS_STYLES[player.status]}`}>
          {player.status === "sold" && player.soldTo?.teamName
            ? player.soldTo.teamName.slice(0, 8)
            : player.status}
        </span>
      </div>

      {/* Player Photo */}
      <div className="flex flex-1 items-center justify-center pt-4">
        <div
          className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 overflow-hidden"
          style={{ borderColor: `${posColor}60` }}
        >
          {player.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={
                typeof player.image === "string" && player.image.startsWith("http")
                  ? `/api/image-proxy?url=${encodeURIComponent(player.image)}`
                  : player.image
              }
              alt={player.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = "none";
                const parent = el.parentElement;
                if (parent) {
                  const fallback = document.createElement("span");
                  fallback.className = "font-display text-lg font-bold text-text-primary";
                  fallback.textContent = initials;
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <span className="font-display text-lg font-bold text-text-primary">{initials}</span>
          )}
        </div>
      </div>

      {/* Name */}
      <div className="px-3 pb-2 text-center">
        <p className="truncate text-sm font-bold text-text-primary leading-tight">{displayName}</p>
      </div>

      {/* Club + Nation */}
      <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex h-6 w-6 items-center justify-center">
          {player.clubLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={
                typeof player.clubLogo === "string" && player.clubLogo.startsWith("http")
                  ? `/api/image-proxy?url=${encodeURIComponent(player.clubLogo)}`
                  : player.clubLogo
              }
              alt={player.club}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-[10px] text-text-muted">{player.club?.slice(0, 3)}</span>
          )}
        </div>
        <div className="flex h-5 w-7 items-center justify-center">
          {player.nationFlag ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={
                typeof player.nationFlag === "string" && player.nationFlag.startsWith("http")
                  ? `/api/image-proxy?url=${encodeURIComponent(player.nationFlag)}`
                  : player.nationFlag
              }
              alt={player.nation}
              className="h-full w-full object-cover rounded-sm"
            />
          ) : (
            <span className="text-[10px] text-text-muted">{player.nation?.slice(0, 3)}</span>
          )}
        </div>
      </div>

      {/* Hover Action Buttons */}
      <motion.div
        className="absolute inset-0 flex items-end justify-center gap-2 px-3 pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 40%, transparent)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onView(player); }}
          title="View Details"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
        >
          <Eye size={15} />
        </button>

        {isAdmin && player.status === "available" && onAddToPool && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToPool(player); }}
            title="Add to Pool"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-accent-amber bg-accent-amber/10 text-accent-amber hover:bg-accent-amber hover:text-black transition-all"
          >
            <Plus size={15} />
          </button>
        )}

        {isAdmin && player.status === "pool" && onAddToPool && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToPool(player); }}
            title="Remove from Pool"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-accent-red bg-accent-red/10 text-accent-red hover:bg-accent-red hover:text-white transition-all"
          >
            <Minus size={15} />
          </button>
        )}

        {!isAdmin && onAddToWatchlist && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToWatchlist(player); }}
            title="Add to Watchlist"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-accent-blue bg-accent-blue/10 text-accent-blue hover:bg-accent-blue hover:text-white transition-all"
          >
            <Bookmark size={15} />
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
