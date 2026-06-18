"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { Player } from "@/types/player.types";
import { api } from "@/lib/api";

interface AdminEditPlayerModalProps {
  player: Player;
  onClose: () => void;
  onSave: (updatedPlayer: Player) => void;
}

export default function AdminEditPlayerModal({ player, onClose, onSave }: AdminEditPlayerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [status, setStatus] = useState(player.status);
  const [name, setName] = useState(player.name || "");
  const [commonName, setCommonName] = useState(player.commonName || "");
  const [rating, setRating] = useState(player.rating || 0);
  const [position, setPosition] = useState(player.position || "");
  
  const [pace, setPace] = useState(player.pace || 0);
  const [shooting, setShooting] = useState(player.shooting || 0);
  const [passing, setPassing] = useState(player.passing || 0);
  const [dribbling, setDribbling] = useState(player.dribbling || 0);
  const [defending, setDefending] = useState(player.defending || 0);
  const [physical, setPhysical] = useState(player.physical || 0);

  const [weakFoot, setWeakFoot] = useState(player.weakFoot || 1);
  const [skillMoves, setSkillMoves] = useState(player.skillMoves || 1);
  const [preferredFoot, setPreferredFoot] = useState(player.preferredFoot || "Right");
  const [height, setHeight] = useState(player.height || 0);
  const [weight, setWeight] = useState(player.weight || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.put(`/api/players/${player._id}`, {
        status,
        name,
        commonName,
        rating,
        position,
        pace,
        shooting,
        passing,
        dribbling,
        defending,
        physical,
        weakFoot,
        skillMoves,
        preferredFoot,
        height,
        weight
      });
      onSave(res.data.player);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update player.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

        <motion.div
          className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-surface border border-border shadow-2xl flex flex-col"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-surface z-20">
            <h2 className="text-xl font-bold text-text-primary">Edit Player Details</h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
            {error && (
              <div className="text-sm text-accent-red bg-accent-red/10 border border-accent-red/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-text-primary border-b border-border pb-2">Basic Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-text-secondary">Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required className="bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:border-accent-blue outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-text-secondary">Common Name</label>
                  <input type="text" value={commonName} onChange={e => setCommonName(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:border-accent-blue outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-text-secondary">Position</label>
                  <input type="text" value={position} onChange={e => setPosition(e.target.value)} required className="bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:border-accent-blue outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-text-secondary">Rating</label>
                  <input type="number" value={rating} onChange={e => setRating(Number(e.target.value))} required className="bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:border-accent-blue outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-text-secondary">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:border-accent-blue outline-none">
                    <option value="available">Available</option>
                    <option value="pool">In Pool</option>
                    <option value="unsold">Unsold</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-text-primary border-b border-border pb-2">Attributes</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-text-secondary">PAC</label>
                  <input type="number" value={pace} onChange={e => setPace(Number(e.target.value))} className="bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:border-accent-blue outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-text-secondary">SHO</label>
                  <input type="number" value={shooting} onChange={e => setShooting(Number(e.target.value))} className="bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:border-accent-blue outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-text-secondary">PAS</label>
                  <input type="number" value={passing} onChange={e => setPassing(Number(e.target.value))} className="bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:border-accent-blue outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-text-secondary">DRI</label>
                  <input type="number" value={dribbling} onChange={e => setDribbling(Number(e.target.value))} className="bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:border-accent-blue outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-text-secondary">DEF</label>
                  <input type="number" value={defending} onChange={e => setDefending(Number(e.target.value))} className="bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:border-accent-blue outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-text-secondary">PHY</label>
                  <input type="number" value={physical} onChange={e => setPhysical(Number(e.target.value))} className="bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:border-accent-blue outline-none" />
                </div>
              </div>
            </div>

            {/* Profile */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-text-primary border-b border-border pb-2">Profile Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-text-secondary">Weak Foot</label>
                  <input type="number" min="1" max="5" value={weakFoot} onChange={e => setWeakFoot(Number(e.target.value))} className="bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:border-accent-blue outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-text-secondary">Skill Moves</label>
                  <input type="number" min="1" max="5" value={skillMoves} onChange={e => setSkillMoves(Number(e.target.value))} className="bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:border-accent-blue outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-text-secondary">Preferred Foot</label>
                  <select value={preferredFoot} onChange={e => setPreferredFoot(e.target.value as "Right" | "Left")} className="bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:border-accent-blue outline-none">
                    <option value="Right">Right</option>
                    <option value="Left">Left</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-text-secondary">Height (cm)</label>
                  <input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} className="bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:border-accent-blue outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-text-secondary">Weight (kg)</label>
                  <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} className="bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:border-accent-blue outline-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border sticky bottom-0 bg-surface z-20 pb-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-accent-blue hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
