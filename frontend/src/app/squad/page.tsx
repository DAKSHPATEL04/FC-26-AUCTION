"use client";

import { useEffect, useState, useCallback } from "react";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { useUserStore } from "@/store/userStore";
import { api } from "@/lib/api";
import { Player } from "@/types/player.types";
import { motion } from "framer-motion";
import { Shield, Coins, Users, Star, Sparkles, Loader2 } from "lucide-react";
import { io } from "socket.io-client";

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

export default function MySquadPage() {
  const { user } = useUserStore();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyTeam = useCallback(async () => {
    if (!user?.teamId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/teams");
      const myTeam = res.data.find((t: any) => t._id === user.teamId);
      if (myTeam) {
        setTeam(myTeam);
      } else {
        setError("Team data not found in registration records.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load team roster.");
    } finally {
      setLoading(false);
    }
  }, [user?.teamId]);

  useEffect(() => {
    fetchMyTeam();
  }, [fetchMyTeam]);

  // Keep a stable ref so the socket handler always calls the latest version
  const fetchMyTeamRef = useCallback(() => {
    fetchMyTeam();
  }, [fetchMyTeam]);

  // Subscribe to auction sold/undo events so the squad updates in real-time
  useEffect(() => {
    const token = localStorage.getItem("fc26_token");
    if (!token || !user?.teamId) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const socket = io(API_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    // Refresh squad whenever any player is sold, unsold, or a draft is undone
    socket.on("auction:sold_broadcast", () => {
      // Short delay to ensure DB write has committed
      setTimeout(() => fetchMyTeamRef(), 800);
    });

    socket.on("auction:undo_broadcast", () => {
      setTimeout(() => fetchMyTeamRef(), 800);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.teamId, fetchMyTeamRef]);

  if (!user?.teamId) {
    return (
      <AuthenticatedLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Shield size={48} className="text-text-muted mb-4" />
          <h2 className="font-display text-2xl font-bold text-text-primary">No Team Assigned</h2>
          <p className="text-sm text-text-secondary mt-2 max-w-sm">
            An administrator has not assigned you to a team yet. Live draft rosters will appear here once you are assigned.
          </p>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent-blue" />
              <p className="mt-4 text-sm text-text-secondary">Loading squad details...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-accent-red/20 bg-accent-red/5 p-4 text-sm text-accent-red text-center">
            {error}
          </div>
        ) : !team ? (
          <div className="text-center py-12 text-text-secondary">Roster unavailable.</div>
        ) : (
          <>
            {/* Team Header banner */}
            <div
              className="rounded-2xl border border-border bg-surface p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
              style={{ borderLeft: `6px solid ${team.color || "#3B82F6"}` }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border text-2xl font-bold flex-shrink-0"
                  style={{
                    backgroundColor: `${team.color}15`,
                    borderColor: `${team.color}45`,
                    color: team.color,
                  }}
                >
                  {team.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        typeof team.logo === "string" && team.logo.startsWith("http")
                          ? `/api/image-proxy?url=${encodeURIComponent(team.logo)}`
                          : team.logo
                      }
                      alt={team.teamName}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    team.teamName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-primary">
                    {team.teamName}
                  </h1>
                  <p className="text-xs text-text-secondary mt-1">
                    My Official Team Roster & Draft Metrics
                  </p>
                </div>
              </div>

              {/* Top highlights */}
              <div className="flex flex-wrap gap-4">
                <div className="bg-background border border-border px-4 py-2 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-text-muted uppercase">Remaining Budget</span>
                  <span className="block font-display text-lg font-black text-accent-green mt-0.5">{team.remainingBudget} coins</span>
                </div>
                <div className="bg-background border border-border px-4 py-2 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-text-muted uppercase">Squad Size</span>
                  <span className="block font-display text-lg font-black text-accent-blue mt-0.5">{team.players.length} / 22</span>
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
                  <p className="text-base font-black text-text-primary mt-0.5">{team.avgRating > 0 ? team.avgRating.toFixed(1) : "0.0"}</p>
                </div>
              </div>

              <div className="bg-surface border border-border p-4 rounded-xl flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-surface-elevated flex items-center justify-center text-text-muted">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-muted">Total Value</p>
                  <p className="text-base font-black text-text-primary mt-0.5">{team.teamValue} coins</p>
                </div>
              </div>

              <div className="bg-surface border border-border p-4 rounded-xl flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-surface-elevated flex items-center justify-center text-accent-green">
                  <Coins size={18} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-muted">Budget Spent</p>
                  <p className="text-base font-black text-text-primary mt-0.5">{team.totalBudget - team.remainingBudget} coins</p>
                </div>
              </div>

              <div className="bg-surface border border-border p-4 rounded-xl flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-surface-elevated flex items-center justify-center text-accent-blue">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-muted">Max Budget</p>
                  <p className="text-base font-black text-text-primary mt-0.5">{team.totalBudget} coins</p>
                </div>
              </div>
            </div>

            {/* Players Table */}
            <div className="border border-border bg-surface rounded-2xl p-5 mt-2">
              <h2 className="font-display text-lg font-bold text-text-primary mb-4">
                Drafted Roster ({team.players.length})
              </h2>

              {team.players.length === 0 ? (
                <div className="text-center py-12 text-text-secondary text-sm">
                  ⚽ No players drafted into your squad yet. Live auction drafts will show up here.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {team.players.map((p) => {
                    const posColor =
                      p.positionGroup === "GK" ? "#F59E0B" :
                      p.positionGroup === "DEF" ? "#3B82F6" :
                      p.positionGroup === "MID" ? "#22C55E" : "#EF4444";

                    return (
                      <div
                        key={p._id}
                        className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-background hover:border-text-secondary transition-colors"
                      >
                        {/* Rating & Position */}
                        <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg bg-surface-elevated font-display border border-border">
                          <span className="text-base font-black text-text-primary leading-none">{p.rating}</span>
                          <span className="text-[9px] font-bold mt-0.5" style={{ color: posColor }}>{p.position}</span>
                        </div>

                        {/* Player details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-text-primary truncate">{p.commonName || p.name}</p>
                          <p className="text-xs text-text-secondary truncate mt-0.5">{p.club} | {p.nation}</p>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-xs font-bold text-text-muted">Draft Price</p>
                          <p className="text-sm font-black text-accent-amber">{p.soldPrice || p.basePrice || 10} coins</p>
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
