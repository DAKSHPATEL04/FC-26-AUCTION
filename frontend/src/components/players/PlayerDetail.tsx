"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Footprints } from "lucide-react";
import { Player } from "@/types/player.types";

const POSITION_COLORS: Record<string, string> = {
  GK: "#F59E0B",
  DEF: "#3B82F6",
  MID: "#22C55E",
  FWD: "#EF4444",
};

const getStatColor = (val: number) => {
  if (val >= 75) return "#22C55E";
  if (val >= 60) return "#F59E0B";
  return "#EF4444";
};

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 text-right text-xs font-bold" style={{ color: getStatColor(value) }}>
        {value}
      </span>
      <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: getStatColor(value) }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 99)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <span className="w-20 text-xs text-text-secondary uppercase tracking-wider">{label}</span>
    </div>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= value ? "text-accent-amber fill-accent-amber" : "text-border"}
        />
      ))}
    </div>
  );
}

interface PlayerDetailModalProps {
  player: Player;
  onClose: () => void;
  onAddToPool?: () => void;
  onAddToWatchlist?: () => void;
  isAdmin?: boolean;
}

export default function PlayerDetailModal({
  player,
  onClose,
  onAddToPool,
  onAddToWatchlist,
  isAdmin,
}: PlayerDetailModalProps) {
  const posColor = POSITION_COLORS[player.positionGroup] || "#FFFFFF";
  const initials = (player.commonName || player.name)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          className="relative z-10 w-full max-w-2xl rounded-2xl border border-border bg-surface overflow-hidden shadow-2xl"
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: "spring", duration: 0.4 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Banner */}
          <div
            className="relative h-32 flex items-end px-6 pb-4"
            style={{
              background: `linear-gradient(135deg, ${posColor}33 0%, #141414 100%)`,
              borderBottom: `1px solid ${posColor}44`,
            }}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full bg-surface-elevated p-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-end gap-5">
              {/* Player Image */}
              <div
                className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 overflow-hidden flex-shrink-0"
                style={{ borderColor: posColor, boxShadow: `0 0 20px ${posColor}44` }}
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
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="font-display text-lg font-bold text-text-primary">{initials}</span>
                )}
              </div>

              {/* Identity */}
              <div className="mb-1">
                <div className="flex items-center gap-3">
                  <span className="font-display text-4xl font-black text-text-primary">{player.rating}</span>
                  <span
                    className="rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
                    style={{ backgroundColor: `${posColor}22`, color: posColor }}
                  >
                    {player.position}
                  </span>
                </div>
                <h2 className="font-display text-xl font-bold text-text-primary">
                  {player.commonName || player.name}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  {player.nationFlag && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        typeof player.nationFlag === "string" && player.nationFlag.startsWith("http")
                          ? `/api/image-proxy?url=${encodeURIComponent(player.nationFlag)}`
                          : player.nationFlag
                      }
                      alt={player.nation}
                      className="h-4 w-6 object-cover rounded-sm"
                    />
                  )}
                  <span className="text-sm text-text-secondary">{player.nation}</span>
                  <span className="text-text-muted">·</span>
                  <span className="text-sm text-text-secondary">{player.club}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* Stats */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary">Player Stats</h3>
              {player.positionGroup === "GK" ? (
                <>
                  <StatBar label="Diving" value={player.pace ?? 0} />
                  <StatBar label="Handling" value={player.shooting ?? 0} />
                  <StatBar label="Kicking" value={player.passing ?? 0} />
                  <StatBar label="Reflexes" value={player.dribbling ?? 0} />
                  <StatBar label="Speed" value={player.defending ?? 0} />
                  <StatBar label="Positioning" value={player.physical ?? 0} />
                </>
              ) : (
                <>
                  <StatBar label="Pace" value={player.pace ?? 0} />
                  <StatBar label="Shooting" value={player.shooting ?? 0} />
                  <StatBar label="Passing" value={player.passing ?? 0} />
                  <StatBar label="Dribbling" value={player.dribbling ?? 0} />
                  <StatBar label="Defending" value={player.defending ?? 0} />
                  <StatBar label="Physical" value={player.physical ?? 0} />
                </>
              )}
            </div>

            {/* Info */}
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3">Personal Info</h3>
                <div className="space-y-2 text-sm">
                  {player.age ? (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Age</span>
                      <span className="text-text-primary font-medium">{player.age}</span>
                    </div>
                  ) : null}
                  {player.height ? (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Height</span>
                      <span className="text-text-primary font-medium">{player.height} cm</span>
                    </div>
                  ) : null}
                  {player.weight ? (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Weight</span>
                      <span className="text-text-primary font-medium">{player.weight} kg</span>
                    </div>
                  ) : null}
                  {player.preferredFoot ? (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Preferred Foot</span>
                      <div className="flex items-center gap-1">
                        <Footprints size={14} className="text-text-secondary" />
                        <span className="text-text-primary font-medium">{player.preferredFoot}</span>
                      </div>
                    </div>
                  ) : null}
                  {player.weakFoot ? (
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Weak Foot</span>
                      <StarRating value={player.weakFoot} />
                    </div>
                  ) : null}
                  {player.skillMoves ? (
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Skill Moves</span>
                      <StarRating value={player.skillMoves} />
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3">Auction Status</h3>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    player.status === "sold"
                      ? "bg-accent-red/10 text-accent-red"
                      : player.status === "pool"
                      ? "bg-accent-amber/10 text-accent-amber"
                      : player.status === "unsold"
                      ? "bg-text-muted/10 text-text-muted"
                      : "bg-accent-green/10 text-accent-green"
                  }`}
                >
                  {player.status}
                </span>
                {player.status === "sold" && player.soldTo && (
                  <p className="mt-2 text-sm text-text-secondary">
                    Sold to <span className="font-semibold text-text-primary">{player.soldTo.teamName}</span>{" "}
                    for <span className="font-semibold text-accent-amber">{player.soldPrice} coins</span>
                  </p>
                )}
              </div>

              {/* PlayStyles */}
              {player.playStyles && player.playStyles.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3">PlayStyles</h3>
                  <div className="flex flex-wrap gap-2">
                    {player.playStyles.map((ps) => (
                      <span
                        key={ps}
                        className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-secondary"
                      >
                        {ps}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
            {isAdmin && player.status === "available" && onAddToPool && (
              <button
                onClick={onAddToPool}
                className="rounded-lg bg-accent-amber px-4 py-2 text-sm font-bold text-black transition-all hover:bg-accent-amber/80"
              >
                + Add to Pool
              </button>
            )}
            {isAdmin && player.status === "pool" && onAddToPool && (
              <button
                onClick={onAddToPool}
                className="rounded-lg bg-accent-red/10 border border-accent-red px-4 py-2 text-sm font-bold text-accent-red transition-all hover:bg-accent-red/20"
              >
                Remove from Pool
              </button>
            )}
            {!isAdmin && onAddToWatchlist && (
              <button
                onClick={onAddToWatchlist}
                className="rounded-lg bg-accent-blue/10 border border-accent-blue px-4 py-2 text-sm font-bold text-accent-blue transition-all hover:bg-accent-blue/20"
              >
                + Watchlist
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
