"use client";

import { useEffect, useState, useCallback } from "react";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { useUserStore } from "@/store/userStore";
import { api } from "@/lib/api";
import { Player } from "@/types/player.types";
import { Shield, Coins, Users, Star, Sparkles, Loader2, Trash2 } from "lucide-react";
import { toast, confirmAction } from "@/lib/toast";

interface TeamData {
  _id: string;
  teamName: string;
  logo?: string;
  color: string;
  totalBudget: number;
  remainingBudget: number;
  players: Player[];
  squadSize: number;
  teamValue: number;
  avgRating: number;
}

export default function AdminSquadsPage() {
  const { user } = useUserStore();
  const isAdmin = user?.role === "admin";
  
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/teams");
      setTeams(res.data);
      if (res.data.length > 0 && !selectedTeamId) {
        setSelectedTeamId(res.data[0]._id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load teams.");
    } finally {
      setLoading(false);
    }
  }, [selectedTeamId]);

  useEffect(() => {
    if (isAdmin) {
      fetchTeams();
    }
  }, [isAdmin, fetchTeams]);

  const handleRemovePlayer = async (teamId: string, playerId: string, playerName: string) => {
    confirmAction(`Are you sure you want to remove ${playerName} from this squad? Their draft price will be refunded.`, async () => {
      try {
        await api.delete(`/api/teams/${teamId}/players/${playerId}`);
        // Refresh teams data after deletion
        fetchTeams();
        toast.success("Player successfully removed and budget refunded.");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to remove player.");
      }
    });
  };

  if (!isAdmin) {
    return (
      <AuthenticatedLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Shield size={48} className="text-accent-red mb-4" />
          <h2 className="font-display text-2xl font-bold text-text-primary">Access Denied</h2>
          <p className="text-sm text-text-secondary mt-2">
            You do not have permission to view this page.
          </p>
        </div>
      </AuthenticatedLayout>
    );
  }

  const selectedTeam = teams.find(t => t._id === selectedTeamId) || null;

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-primary flex items-center gap-2">
              <Shield className="text-accent-blue" /> Manage Squads
            </h1>
            <p className="text-sm text-text-secondary">
              View all team rosters and manage mistaken drafts.
            </p>
          </div>
          
          {/* Team Selector */}
          {teams.length > 0 && (
            <div className="w-full sm:w-64">
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary text-sm font-bold rounded-xl p-3.5 outline-none focus:border-accent-blue transition-colors appearance-none"
              >
                {teams.map(t => (
                  <option key={t._id} value={t._id}>{t.teamName}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading && teams.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent-blue" />
              <p className="mt-4 text-sm text-text-secondary">Loading squads...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-accent-red/20 bg-accent-red/5 p-4 text-sm text-accent-red text-center">
            {error}
          </div>
        ) : !selectedTeam ? (
          <div className="text-center py-12 text-text-secondary border border-border rounded-xl bg-surface">
            No teams available.
          </div>
        ) : (
          <>
            {/* Team Header banner */}
            <div
              className="rounded-2xl border border-border bg-surface p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
              style={{ borderLeft: `6px solid ${selectedTeam.color || "#3B82F6"}` }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border text-2xl font-bold flex-shrink-0"
                  style={{
                    backgroundColor: `${selectedTeam.color}15`,
                    borderColor: `${selectedTeam.color}45`,
                    color: selectedTeam.color,
                  }}
                >
                  {selectedTeam.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        typeof selectedTeam.logo === "string" && selectedTeam.logo.startsWith("http")
                          ? `/api/image-proxy?url=${encodeURIComponent(selectedTeam.logo)}`
                          : selectedTeam.logo
                      }
                      alt={selectedTeam.teamName}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    selectedTeam.teamName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h2 className="font-display text-2xl font-extrabold tracking-tight text-text-primary">
                    {selectedTeam.teamName}
                  </h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Official Roster View
                  </p>
                </div>
              </div>

              {/* Top highlights */}
              <div className="flex flex-wrap gap-4">
                <div className="bg-background border border-border px-4 py-2 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-text-muted uppercase">Remaining Budget</span>
                  <span className="block font-display text-lg font-black text-accent-green mt-0.5">{selectedTeam.remainingBudget} coins</span>
                </div>
                <div className="bg-background border border-border px-4 py-2 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-text-muted uppercase">Squad Size</span>
                  <span className="block font-display text-lg font-black text-accent-blue mt-0.5">{selectedTeam.players.length} / 22</span>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface border border-border p-4 rounded-xl flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-surface-elevated flex items-center justify-center text-accent-amber">
                  <Star size={18} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-muted">Average Rating</p>
                  <p className="text-base font-black text-text-primary mt-0.5">{selectedTeam.avgRating > 0 ? selectedTeam.avgRating.toFixed(1) : "0.0"}</p>
                </div>
              </div>

              <div className="bg-surface border border-border p-4 rounded-xl flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-surface-elevated flex items-center justify-center text-text-muted">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-muted">Total Value</p>
                  <p className="text-base font-black text-text-primary mt-0.5">{selectedTeam.teamValue} coins</p>
                </div>
              </div>

              <div className="bg-surface border border-border p-4 rounded-xl flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-surface-elevated flex items-center justify-center text-accent-green">
                  <Coins size={18} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-muted">Budget Spent</p>
                  <p className="text-base font-black text-text-primary mt-0.5">{selectedTeam.totalBudget - selectedTeam.remainingBudget} coins</p>
                </div>
              </div>

              <div className="bg-surface border border-border p-4 rounded-xl flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-surface-elevated flex items-center justify-center text-accent-blue">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-muted">Max Budget</p>
                  <p className="text-base font-black text-text-primary mt-0.5">{selectedTeam.totalBudget} coins</p>
                </div>
              </div>
            </div>

            {/* Players Table */}
            <div className="border border-border bg-surface rounded-2xl p-5 mt-2">
              <h2 className="font-display text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                Drafted Roster <span className="text-sm font-normal text-text-secondary">({selectedTeam.players.length})</span>
              </h2>

              {selectedTeam.players.length === 0 ? (
                <div className="text-center py-12 text-text-secondary text-sm bg-background rounded-xl border border-border border-dashed">
                  ⚽ No players drafted into this squad yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedTeam.players.map((p) => {
                    const posColor =
                      p.positionGroup === "GK" ? "#F59E0B" :
                      p.positionGroup === "DEF" ? "#3B82F6" :
                      p.positionGroup === "MID" ? "#22C55E" : "#EF4444";

                    return (
                      <div
                        key={p._id}
                        className="group flex items-center gap-3 p-3.5 rounded-xl border border-border bg-background hover:border-text-secondary transition-all relative overflow-hidden"
                      >
                        {/* Rating & Position */}
                        <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg bg-surface-elevated font-display border border-border z-10">
                          <span className="text-base font-black text-text-primary leading-none">{p.rating}</span>
                          <span className="text-[9px] font-bold mt-0.5" style={{ color: posColor }}>{p.position}</span>
                        </div>

                        {/* Player details */}
                        <div className="flex-1 min-w-0 z-10">
                          <p className="text-sm font-bold text-text-primary truncate">{p.commonName || p.name}</p>
                          <p className="text-xs text-text-secondary truncate mt-0.5">{p.club} | {p.nation}</p>
                        </div>

                        {/* Price */}
                        <div className="text-right z-10 pr-1 transition-all duration-300 group-hover:opacity-0 group-hover:-translate-x-4">
                          <p className="text-xs font-bold text-text-muted">Draft Price</p>
                          <p className="text-sm font-black text-accent-amber">{p.soldPrice || p.basePrice || 10}</p>
                        </div>

                        {/* Delete Action (Shows on hover) */}
                        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-surface to-transparent flex items-center justify-end pr-3 opacity-0 translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 z-20">
                           <button 
                             onClick={() => handleRemovePlayer(selectedTeam._id, p._id, p.commonName || p.name)}
                             className="bg-accent-red/10 text-accent-red hover:bg-accent-red hover:text-white p-2.5 rounded-lg transition-colors"
                             title="Remove player from squad"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
