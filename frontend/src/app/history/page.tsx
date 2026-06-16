"use client";

import { useEffect, useState, useCallback } from "react";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { api } from "@/lib/api";
import { Player } from "@/types/player.types";
import { motion } from "framer-motion";
import { History, Coins, Loader2, ArrowRightLeft, Calendar } from "lucide-react";

export default function HistoryPage() {
  const [historyList, setHistoryList] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/players", {
        params: {
          status: "sold",
          sortBy: "updatedAt",
          sortOrder: "desc",
          limit: 100,
        },
      });
      setHistoryList(res.data.players);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load draft history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-primary flex items-center gap-2">
              <History className="text-accent-blue" /> Draft History Log
            </h1>
            <p className="text-sm text-text-secondary">
              Chronological log of completed drafts and team allocations.
            </p>
          </div>
          <button
            onClick={fetchHistory}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition-all"
          >
            Refresh Log
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-accent-red/20 bg-accent-red/5 p-4 text-sm text-accent-red text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent-blue" />
              <p className="mt-4 text-sm text-text-secondary">Retrieving transaction logs...</p>
            </div>
          </div>
        ) : historyList.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 text-center">
            <History size={48} className="text-text-muted mb-4" />
            <h3 className="font-display text-lg font-bold text-text-primary">No Draft History</h3>
            <p className="mt-2 text-sm text-text-secondary max-w-sm">
              Bids and resolved sales will show up here chronologically once the live auction has begun.
            </p>
          </div>
        ) : (
          /* Transaction Feed */
          <div className="border border-border bg-surface rounded-2xl p-5">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-text-secondary font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Player Details</th>
                    <th className="py-3.5 px-4 text-center">Position</th>
                    <th className="py-3.5 px-4">Acquired By</th>
                    <th className="py-3.5 px-4 text-right">Draft Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {historyList.map((player) => {
                    const posColor =
                      player.positionGroup === "GK" ? "#F59E0B" :
                      player.positionGroup === "DEF" ? "#3B82F6" :
                      player.positionGroup === "MID" ? "#22C55E" : "#EF4444";

                    const dateObj = (player as any).updatedAt ? new Date((player as any).updatedAt) : null;
                    const dateStr = dateObj ? dateObj.toLocaleDateString() : "N/A";
                    const timeStr = dateObj ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

                    return (
                      <motion.tr
                        key={player._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-surface-elevated/20 transition-colors"
                      >
                        <td className="py-4 px-4 text-text-secondary">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-text-muted" />
                            <span>{dateStr} <span className="text-[10px] text-text-muted">{timeStr}</span></span>
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full border overflow-hidden bg-background flex-shrink-0">
                              {player.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={player.image} alt={player.name} className="h-full w-full object-cover" />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-xs">⚽</span>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-text-primary">{player.commonName || player.name}</p>
                              <p className="text-[10px] text-text-secondary">{player.club} | {player.nation}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-bold">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{ color: posColor, backgroundColor: `${posColor}10` }}
                          >
                            {player.position}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {player.soldTo ? (
                            <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: player.soldTo.color || "#3B82F6" }}>
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: player.soldTo.color || "#3B82F6" }} />
                              {player.soldTo.teamName}
                            </span>
                          ) : (
                            <span className="text-text-muted font-medium">Unassigned</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right font-display font-black text-accent-amber">
                          <span className="inline-flex items-center gap-1 justify-end w-full">
                            <Coins size={13} /> {player.soldPrice || 10}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
