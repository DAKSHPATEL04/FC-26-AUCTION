"use client";

import { useEffect, useState, useCallback } from "react";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { useUserStore } from "@/store/userStore";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import {
  BarChart3,
  Coins,
  Users,
  Award,
  TrendingUp,
  Star,
  Activity,
  ArrowUpRight,
  Shield,
  Loader2,
  LayoutDashboard,
} from "lucide-react";

interface TeamStat {
  _id: string;
  teamName: string;
  color: string;
  remainingBudget: number;
  totalBudget: number;
  spent: number;
  squadSize: number;
  teamValue: number;
  avgRating: number;
}

interface GeneralStats {
  totalTeams: number;
  totalPlayers: number;
  soldPlayers: number;
  unsoldPlayers: number;
  availablePlayers: number;
}

interface ExpensivePlayer {
  _id: string;
  name: string;
  commonName?: string;
  rating: number;
  position: string;
  soldPrice: number;
  image?: string;
  soldTo: {
    teamName: string;
    color: string;
  };
}

export default function DashboardPage() {
  const { user } = useUserStore();
  const [teamStats, setTeamStats] = useState<TeamStat[]>([]);
  const [generalStats, setGeneralStats] = useState<GeneralStats | null>(null);
  const [expensivePlayers, setExpensivePlayers] = useState<ExpensivePlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/stats");
      setTeamStats(res.data.teamStats);
      setGeneralStats(res.data.general);
      setExpensivePlayers(res.data.expensivePlayers);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Find league-wide metrics
  const totalLeagueBudget = teamStats.reduce((sum, t) => sum + t.totalBudget, 0);
  const totalLeagueSpent = teamStats.reduce((sum, t) => sum + t.spent, 0);
  const spendPercentage = totalLeagueBudget > 0 ? (totalLeagueSpent / totalLeagueBudget) * 100 : 0;

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-primary flex items-center gap-2">
              <LayoutDashboard className="text-accent-blue" /> Dashboard
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Welcome back, <span className="font-semibold text-text-primary">{user?.name}</span>. You are logged in as <span className="text-accent-blue font-semibold uppercase">{user?.role}</span>.
            </p>
          </div>
          <button
            onClick={fetchStats}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition-all flex items-center gap-1.5"
          >
            <Activity size={14} className="text-accent-blue" /> Refresh Live Dashboard
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
              <p className="mt-4 text-sm text-text-secondary">Generating live analytics dashboard...</p>
            </div>
          </div>
        ) : !generalStats ? (
          <div className="text-center py-12 text-text-secondary">No data available yet. Please complete some drafts.</div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Overview Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-border bg-surface p-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Total Teams</span>
                <p className="font-display text-3xl font-black text-text-primary mt-1">{generalStats.totalTeams}</p>
                <div className="mt-2 text-xs text-text-secondary flex items-center gap-1">
                  <Shield size={12} className="text-accent-blue" /> Active registered squads
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Drafted Players</span>
                <p className="font-display text-3xl font-black text-text-primary mt-1">{generalStats.soldPlayers}</p>
                <div className="mt-2 text-xs text-text-secondary">
                  Out of <span className="font-semibold">{generalStats.totalPlayers}</span> in database
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">League Spent Cash</span>
                <p className="font-display text-3xl font-black text-accent-amber mt-1">
                  {totalLeagueSpent} <span className="text-xs text-text-secondary">/ {totalLeagueBudget}</span>
                </p>
                <div className="mt-2 w-full bg-border h-1.5 rounded-full overflow-hidden">
                  <div className="bg-accent-amber h-full" style={{ width: `${spendPercentage}%` }} />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Unsold Catalog</span>
                <p className="font-display text-3xl font-black text-text-primary mt-1">{generalStats.unsoldPlayers}</p>
                <div className="mt-2 text-xs text-text-secondary">
                  Passed players to review later
                </div>
              </div>
            </div>

            {/* Custom SVG Charts Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              
              {/* Spent vs Remaining Budget Bar Chart (col-span-2) */}
              <div className="lg:col-span-2 border border-border bg-surface rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-text-primary mb-1">Budget Utilization</h3>
                  <p className="text-xs text-text-secondary mb-6">Compare remaining wallet space (coins) and total drafting spend per team.</p>
                </div>

                <div className="space-y-5 flex-1 flex flex-col justify-center">
                  {teamStats.map((team) => {
                    const spentPct = (team.spent / team.totalBudget) * 100;
                    const remainingPct = 100 - spentPct;

                    return (
                      <div key={team._id} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-text-primary truncate max-w-[150px] sm:max-w-none flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
                            {team.teamName}
                          </span>
                          <span className="text-text-secondary">
                            Spent: <span className="text-text-primary font-bold">{team.spent}</span> | Remaining: <span className="text-accent-green font-bold">{team.remainingBudget}</span>
                          </span>
                        </div>
                        {/* Custom Stacked Bar */}
                        <div className="w-full h-5 rounded-lg bg-background border border-border overflow-hidden flex relative">
                          <motion.div
                            className="h-full flex items-center justify-end pr-2 text-[10px] font-black text-black"
                            style={{ backgroundColor: team.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${spentPct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          >
                            {spentPct > 12 && `${Math.round(spentPct)}%`}
                          </motion.div>
                          <motion.div
                            className="h-full bg-accent-green/10 flex items-center pl-2 text-[10px] font-bold text-accent-green"
                            initial={{ width: 0 }}
                            animate={{ width: `${remainingPct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          >
                            {remainingPct > 12 && `${Math.round(remainingPct)}%`}
                          </motion.div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Roster & Squad Progression (col-span-1) */}
              <div className="lg:col-span-1 border border-border bg-surface rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-text-primary mb-1">Squad Space</h3>
                  <p className="text-xs text-text-secondary mb-6">Visual draft counts compared to the 22-player squad limit.</p>
                </div>

                <div className="space-y-6 flex-1 flex flex-col justify-center">
                  {teamStats.map((team) => {
                    const squadPct = Math.min((team.squadSize / 22) * 100, 100);
                    return (
                      <div key={team._id} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-text-primary font-semibold">{team.teamName}</span>
                          <span className="text-text-secondary font-bold">
                            {team.squadSize} <span className="text-text-muted">/ 22</span>
                          </span>
                        </div>
                        <div className="relative w-full h-3 rounded-full bg-background border border-border overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: team.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${squadPct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Bottom Row: Expensive Leaderboard & Average Rating Comparisons */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Top 5 Expensive Drafts (col-span-2) */}
              <div className="lg:col-span-2 border border-border bg-surface rounded-2xl p-5">
                <h3 className="font-display text-lg font-bold text-text-primary mb-1 flex items-center gap-1.5">
                  <Award size={18} className="text-accent-amber" /> Premium Signings
                </h3>
                <p className="text-xs text-text-secondary mb-4">The most expensive drafts completed in this live session.</p>

                {expensivePlayers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-text-secondary">No player has been drafted yet.</div>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border text-text-secondary">
                          <th className="py-3 font-semibold uppercase tracking-wider">Player</th>
                          <th className="py-3 font-semibold uppercase tracking-wider text-center">Rating</th>
                          <th className="py-3 font-semibold uppercase tracking-wider text-center">Position</th>
                          <th className="py-3 font-semibold uppercase tracking-wider">Drafted Team</th>
                          <th className="py-3 font-semibold uppercase tracking-wider text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {expensivePlayers.map((player) => {
                          const posGroupColor =
                            player.position === "GK" ? "#F59E0B" :
                            ["CB", "LB", "RB", "LWB", "RWB"].includes(player.position) ? "#3B82F6" :
                            ["CDM", "CM", "CAM", "LM", "RM"].includes(player.position) ? "#22C55E" : "#EF4444";

                          return (
                            <tr key={player._id} className="hover:bg-surface-elevated/20 transition-colors">
                              <td className="py-3 font-bold text-text-primary flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full border overflow-hidden bg-background">
                                  {player.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={player.image.startsWith("http") ? `/api/image-proxy?url=${encodeURIComponent(player.image)}` : player.image} alt={player.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <span className="flex h-full w-full items-center justify-center text-[10px]">⚽</span>
                                  )}
                                </div>
                                <span className="truncate max-w-[120px] sm:max-w-none">{player.commonName || player.name}</span>
                              </td>
                              <td className="py-3 text-center font-display font-black text-text-primary">{player.rating}</td>
                              <td className="py-3 text-center">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: posGroupColor, backgroundColor: `${posGroupColor}10` }}>
                                  {player.position}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: player.soldTo.color }}>
                                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: player.soldTo.color }} />
                                  {player.soldTo.teamName}
                                </span>
                              </td>
                              <td className="py-3 text-right font-display font-black text-accent-amber flex justify-end items-center gap-1">
                                <Coins size={12} /> {player.soldPrice}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Roster Average Quality / Rating (col-span-1) */}
              <div className="lg:col-span-1 border border-border bg-surface rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-text-primary mb-1 flex items-center gap-1.5">
                    <Star size={18} className="text-accent-amber" /> Average Squad Rating
                  </h3>
                  <p className="text-xs text-text-secondary mb-4">Draft strategy comparison based on average player ratings.</p>
                </div>

                <div className="space-y-4 flex-1 flex flex-col justify-center">
                  {teamStats
                    .sort((a, b) => b.avgRating - a.avgRating)
                    .map((team) => (
                      <div key={team._id} className="flex items-center justify-between border-b border-border/40 pb-2">
                        <span className="text-xs font-bold text-text-primary truncate max-w-[150px] flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: team.color }} />
                          {team.teamName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Star size={13} className="text-accent-amber fill-accent-amber" />
                          <span className="font-display text-sm font-black text-text-primary">
                            {team.avgRating > 0 ? team.avgRating.toFixed(1) : "0.0"}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
