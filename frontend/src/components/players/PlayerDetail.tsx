"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Footprints, Info, Edit } from "lucide-react";
import { Player } from "@/types/player.types";
import { useState } from "react";
import AdminEditPlayerModal from "./AdminEditPlayerModal";

interface PlayerDetailModalProps {
  player: Player;
  onClose: () => void;
  onAddToPool?: () => void;
  onAddToWatchlist?: () => void;
  isAdmin?: boolean;
  onPlayerUpdated?: (updatedPlayer: Player) => void;
}

const getStatColor = (val: number) => {
  if (val >= 80) return "#22C55E"; // Green
  if (val >= 70) return "#EAB308"; // Yellow
  if (val >= 60) return "#F97316"; // Orange
  return "#EF4444"; // Red
};

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="w-10 text-right text-xs font-bold" style={{ color: getStatColor(value) }}>
        {value}
      </span>
      <div className="flex-1 h-2 rounded-full bg-[#374151] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: getStatColor(value) }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 99)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <span className="w-20 text-xs text-[#9CA3AF] uppercase tracking-wider">{label}</span>
    </div>
  );
}

const getCardStyle = (rating: number) => {
  if (rating >= 75) {
    return {
      bg: "bg-gradient-to-br from-[#FCEBAF] via-[#C99846] to-[#FCEBAF]",
      text: "text-[#3D2C10]",
      border: "border-[#FCEBAF]/50"
    };
  } else if (rating >= 65) {
    return {
      bg: "bg-gradient-to-br from-[#E2E8F0] via-[#94A3B8] to-[#E2E8F0]",
      text: "text-[#1E293B]",
      border: "border-[#E2E8F0]/50"
    };
  } else {
    return {
      bg: "bg-gradient-to-br from-[#FDBA74] via-[#B45309] to-[#FDBA74]",
      text: "text-[#451A03]",
      border: "border-[#FDBA74]/50"
    };
  }
};

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= value ? "text-[#EAB308] fill-[#EAB308]" : "text-[#4B5563]"}
        />
      ))}
    </div>
  );
}

export default function PlayerDetailModal({
  player: initialPlayer,
  onClose,
  onAddToPool,
  onAddToWatchlist,
  isAdmin,
  onPlayerUpdated,
}: PlayerDetailModalProps) {
  const [player, setPlayer] = useState(initialPlayer);
  const [isEditing, setIsEditing] = useState(false);

  const cardStyle = getCardStyle(player.rating);
  const lastName = player.commonName || player.name.split(' ').pop() || player.name;

  const handlePlayerSave = (updatedPlayer: Player) => {
    setPlayer(updatedPlayer);
    if (onPlayerUpdated) {
      onPlayerUpdated(updatedPlayer);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md" />

        <motion.div
          className="relative z-10 w-full max-w-[1000px] rounded-2xl bg-[#1C1C1C] border border-[#333333] shadow-2xl flex flex-col my-auto max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-20 rounded-full bg-black/50 p-2 text-[#9CA3AF] hover:text-white hover:bg-black/80 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col md:flex-row flex-1 overflow-y-auto p-6 md:p-8 gap-8 custom-scrollbar">
            {/* Left Column: Card & Personal Info */}
            <div className="w-full md:w-[260px] flex flex-col gap-6 shrink-0">
              
              {/* Player Card */}
              <div className={`relative w-full aspect-[2/3] rounded-t-2xl rounded-b-xl shadow-xl flex flex-col p-4 border ${cardStyle.border} ${cardStyle.bg} ${cardStyle.text}`}>
                {/* Rating & Position */}
                <div className="absolute top-6 left-5 flex flex-col items-center">
                  <span className="text-5xl font-black leading-none tracking-tighter">{player.rating}</span>
                  <span className="text-xl font-bold mt-1">{player.position}</span>
                </div>
                
                {/* Image */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 h-48 flex items-end justify-center">
                  {player.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={player.image.startsWith("http") ? `/api/image-proxy?url=${encodeURIComponent(player.image)}` : player.image} 
                      alt={player.name} 
                      className="object-contain h-full w-full drop-shadow-xl"
                    />
                  ) : null}
                </div>

                {/* Name & Stats summary */}
                <div className="mt-auto flex flex-col items-center z-10">
                  <span className="text-3xl font-black uppercase tracking-wider mb-2 drop-shadow-sm">{lastName}</span>
                  <div className="grid grid-cols-6 w-full text-center border-t border-b border-current/30 py-2 mb-3">
                    <div className="flex flex-col"><span className="text-sm font-bold">{player.pace}</span><span className="text-[10px] uppercase font-semibold opacity-80">PAC</span></div>
                    <div className="flex flex-col"><span className="text-sm font-bold">{player.shooting}</span><span className="text-[10px] uppercase font-semibold opacity-80">SHO</span></div>
                    <div className="flex flex-col"><span className="text-sm font-bold">{player.passing}</span><span className="text-[10px] uppercase font-semibold opacity-80">PAS</span></div>
                    <div className="flex flex-col"><span className="text-sm font-bold">{player.dribbling}</span><span className="text-[10px] uppercase font-semibold opacity-80">DRI</span></div>
                    <div className="flex flex-col"><span className="text-sm font-bold">{player.defending}</span><span className="text-[10px] uppercase font-semibold opacity-80">DEF</span></div>
                    <div className="flex flex-col"><span className="text-sm font-bold">{player.physical}</span><span className="text-[10px] uppercase font-semibold opacity-80">PHY</span></div>
                  </div>
                  
                  {/* Logos */}
                  <div className="flex items-center gap-3 h-6">
                    {player.nationFlag && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={player.nationFlag.startsWith("http") ? `/api/image-proxy?url=${encodeURIComponent(player.nationFlag)}` : player.nationFlag} alt="nation" className="h-4 object-contain shadow-sm" />
                    )}
                  </div>
                </div>
              </div>

              {/* Info Panel */}
              <div className="bg-[#242424] rounded-xl p-5 flex flex-col gap-4 border border-[#333333]">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-[#9CA3AF]">Position</span>
                  <span className="text-sm font-bold bg-[#333333] text-white self-start px-2 py-0.5 rounded">{player.position}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-[#9CA3AF]">Weak Foot</span>
                  <div className="flex text-white"><StarRating value={player.weakFoot || 1} /></div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-[#9CA3AF]">Skill Moves</span>
                  <div className="flex text-white"><StarRating value={player.skillMoves || 1} /></div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-[#9CA3AF]">Preferred Foot</span>
                  <span className="text-sm font-bold text-white capitalize">{player.preferredFoot}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-[#9CA3AF]">Height</span>
                  <span className="text-sm font-bold text-white">{player.height ? `${player.height} cm` : '--'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-[#9CA3AF]">Weight</span>
                  <span className="text-sm font-bold text-white">{player.weight ? `${player.weight} kg` : '--'}</span>
                </div>
              </div>

            </div>

            {/* Right Column: Detailed Stats */}
            <div className="flex-1 flex flex-col gap-6 pt-4">
              
              {/* Header */}
              <div>
                <h1 className="text-4xl font-black text-white">{player.name}</h1>
                {/* Optional sub-info */}
                <h2 className="text-lg font-medium text-[#9CA3AF] mt-1 flex items-center gap-2">
                  {player.nation} <span className="text-[#4B5563]">|</span> {player.club}
                </h2>
              </div>

              {/* 6 Stats Blocks */}
              <div className="bg-[#242424] rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 border border-[#333333]">
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

              {/* Playstyles */}
              {player.playStyles && player.playStyles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {player.playStyles.map(ps => (
                    <div key={ps} className="bg-[#242424] border border-[#333333] rounded-xl p-3 flex items-center gap-3 shadow-sm hover:border-[#4B5563] transition-colors">
                      <div className="w-8 h-8 rounded-full bg-[#374151] flex items-center justify-center shrink-0">
                        {ps.includes('+') ? <Star size={14} className="text-[#EAB308]" /> : <Info size={14} className="text-[#9CA3AF]" />}
                      </div>
                      <span className="font-bold text-sm text-white truncate" title={ps}>{ps}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-[#1C1C1C] border-t border-[#333333] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">Status:</span>
              <span className={`px-3 py-1 text-xs font-bold uppercase rounded-md ${
                  player.status === "sold" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                  player.status === "pool" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                  player.status === "unsold" ? "bg-gray-500/10 text-gray-400 border border-gray-500/20" :
                  "bg-green-500/10 text-green-400 border border-green-500/20"
              }`}>
                {player.status}
              </span>
              {player.status === "sold" && player.soldTo && (
                <span className="text-sm text-[#9CA3AF]">Sold for <strong className="text-[#EAB308]">{player.soldPrice}</strong> coins</span>
              )}
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              {isAdmin && player.status === "available" && onAddToPool && (
                <button onClick={onAddToPool} className="flex-1 sm:flex-none bg-[#EAB308] hover:bg-[#CA8A04] text-black px-6 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-lg">
                  + Add to Pool
                </button>
              )}
              {isAdmin && player.status === "pool" && onAddToPool && (
                <button onClick={onAddToPool} className="flex-1 sm:flex-none bg-red-500/10 border border-red-500 hover:bg-red-500/20 text-red-500 px-6 py-2.5 rounded-lg font-bold text-sm transition-colors">
                  Remove from Pool
                </button>
              )}
              {isAdmin && (
                <button onClick={() => setIsEditing(true)} className="flex-1 sm:flex-none bg-blue-500/10 border border-blue-500 hover:bg-blue-500/20 text-blue-500 px-6 py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2">
                  <Edit size={16} /> Edit Player
                </button>
              )}
              {!isAdmin && onAddToWatchlist && (
                <button onClick={onAddToWatchlist} className="flex-1 sm:flex-none bg-blue-500/10 border border-blue-500 hover:bg-blue-500/20 text-blue-500 px-6 py-2.5 rounded-lg font-bold text-sm transition-colors">
                  + Watchlist
                </button>
              )}
              <button onClick={onClose} className="flex-1 sm:flex-none bg-[#333333] hover:bg-[#4B5563] text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors">
                Close
              </button>
            </div>
          </div>

        </motion.div>
      </motion.div>

      {isEditing && (
        <AdminEditPlayerModal
          player={player}
          onClose={() => setIsEditing(false)}
          onSave={handlePlayerSave}
        />
      )}
    </AnimatePresence>
  );
}
