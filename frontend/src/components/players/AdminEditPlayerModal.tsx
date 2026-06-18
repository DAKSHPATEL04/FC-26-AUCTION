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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.put(`/api/players/${player._id}`, {
        status,
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
          className="relative z-10 w-full max-w-md rounded-2xl bg-surface border border-border shadow-2xl flex flex-col my-auto"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-bold text-text-primary">Edit Player</h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
            {error && (
              <div className="text-sm text-accent-red bg-accent-red/10 border border-accent-red/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text-secondary">Player Name</label>
              <input
                type="text"
                value={player.name}
                disabled
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-text-primary opacity-50 cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text-secondary">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-text-primary focus:border-accent-blue outline-none transition-colors"
              >
                <option value="available">Available</option>
                <option value="pool">In Pool</option>
                <option value="unsold">Unsold</option>
                <option value="sold">Sold</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-border">
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
